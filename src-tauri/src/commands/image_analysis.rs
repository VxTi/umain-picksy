use crate::ditto_repo::{AppAction, DittoRepository, Photo};
use base64::{engine::general_purpose, Engine as _};
use image::{DynamicImage, ImageFormat};
use rexif::{ExifTag, TagValue};
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::io::Cursor;
use tauri::{AppHandle, State};
use tauri_plugin_dialog::DialogExt;
use walkdir::WalkDir;

#[derive(Debug, Serialize)]
pub struct ImageMetadata {
    pub datetime: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub make: Option<String>,
    pub model: Option<String>,
}

pub fn generate_image_id(img: &DynamicImage) -> String {
    let thumb = img.resize_exact(300, 300, image::imageops::FilterType::Lanczos3);
    let mut hasher = Sha256::new();
    hasher.update(thumb.to_rgb8().as_raw());
    format!("{:x}", hasher.finalize())
}

#[tauri::command]
pub async fn analyze_image_metadata(path: String) -> Result<ImageMetadata, String> {
    let data = match rexif::parse_file(&path) {
        Ok(d) => d,
        Err(_) => {
            return Ok(ImageMetadata {
                datetime: None,
                latitude: None,
                longitude: None,
                make: None,
                model: None,
            })
        }
    };

    let mut out = ImageMetadata {
        datetime: None,
        latitude: None,
        longitude: None,
        make: None,
        model: None,
    };

    for entry in &data.entries {
        match entry.tag {
            ExifTag::DateTimeOriginal | ExifTag::DateTime => {
                if out.datetime.is_none() {
                    out.datetime = Some(entry.value_more_readable.to_string());
                }
            }
            ExifTag::Make => out.make = Some(entry.value_more_readable.to_string()),
            ExifTag::Model => out.model = Some(entry.value_more_readable.to_string()),
            ExifTag::GPSLatitude => out.latitude = parse_gps_to_decimal(&entry.value),
            ExifTag::GPSLongitude => out.longitude = parse_gps_to_decimal(&entry.value),
            ExifTag::GPSLatitudeRef => {
                if entry.value_more_readable.contains('S') {
                    out.latitude = out.latitude.map(|lat| -lat.abs());
                }
            }
            ExifTag::GPSLongitudeRef => {
                if entry.value_more_readable.contains('W') {
                    out.longitude = out.longitude.map(|lon| -lon.abs());
                }
            }
            _ => {}
        }
    }

    Ok(out)
}

fn parse_gps_to_decimal(value: &TagValue) -> Option<f64> {
    if let TagValue::URational(values) = value {
        if values.len() >= 3 {
            let deg = values[0].value();
            let min = values[1].value();
            let sec = values[2].value();
            return Some(deg + (min / 60.0) + (sec / 3600.0));
        }
    }
    None
}

#[derive(Debug, Serialize)]
pub struct FaceRecognitionResult {
    pub matched_paths: Vec<String>,
}

#[tauri::command]
pub async fn recognize_faces(
    target_image_path: String,
    _target_name: String,
    candidate_image_paths: Vec<String>,
) -> Result<FaceRecognitionResult, String> {
    #[cfg(target_os = "macos")]
    {
        if !contains_face(&target_image_path)? {
            return Ok(FaceRecognitionResult {
                matched_paths: vec![],
            });
        }
        let mut matched = Vec::new();
        for p in candidate_image_paths {
            if contains_face(&p)? {
                matched.push(p);
            }
        }
        return Ok(FaceRecognitionResult {
            matched_paths: matched,
        });
    }

    #[cfg(not(target_os = "macos"))]
    {
        Ok(FaceRecognitionResult {
            matched_paths: vec![],
        })
    }
}

#[cfg(all(target_os = "macos", feature = "vision_face_detect"))]
fn contains_face(path: &str) -> Result<bool, String> {
    use objc2::rc::Retained;
    use objc2_foundation::{NSData, NSDataReadingOptions, NSDictionary, NSString, NSURL};
    use objc2_vision::{VNDetectFaceRectanglesRequest, VNImageRequestHandler, VNRequest};

    unsafe {
        let nsurl = NSURL::fileURLWithPath_isDirectory(&NSString::from_str(path), false);
        let data = NSData::initWithContentsOfURL_options_error(
            NSData::alloc(),
            &nsurl,
            NSDataReadingOptions(0),
        )
        .map_err(|_| "Failed to read image data".to_string())?;

        let opts = NSDictionary::new();
        let handler = VNImageRequestHandler::initWithData_options(
            VNImageRequestHandler::alloc(),
            &data,
            &opts,
        );

        let req = VNDetectFaceRectanglesRequest::new();
        let mut reqs: [Retained<VNRequest>; 1] = [Retained::cast(req.retain())];

        let _ = handler
            .performRequests_error(&mut reqs, std::ptr::null_mut())
            .map_err(|_| "Vision face detection failed".to_string())?;

        let results = req.results();
        Ok(results.is_some() && results.unwrap().count() > 0)
    }
}

#[cfg(any(not(target_os = "macos"), not(feature = "vision_face_detect")))]
fn contains_face(_path: &str) -> Result<bool, String> {
    Ok(false)
}

fn image_to_base64(img: &DynamicImage, format: ImageFormat) -> String {
    let mut image_data: Vec<u8> = Vec::new();

    // The crate handles the encoding logic based on the enum variant
    img.write_to(&mut Cursor::new(&mut image_data), format.clone())
        .expect("Failed to encode image");

    let res_base64 = general_purpose::STANDARD.encode(image_data);

    // Map the enum to the correct string for the HTML data URI
    let mime_type = match format {
        ImageFormat::Png => "image/png",
        ImageFormat::Jpeg => "image/jpeg",
        ImageFormat::Gif => "image/gif",
        ImageFormat::WebP => "image/webp",
        _ => "image/png", // Fallback
    };

    format!("data:{};base64,{}", mime_type, res_base64)
}

fn process_image_file(path: String) -> Result<Photo, String> {
    let img = image::open(&path).map_err(|e| e.to_string())?;
    let id = generate_image_id(&img);
    let thumbnail = img.thumbnail(300, 300);

    let base64_content = image_to_base64(&thumbnail, ImageFormat::Jpeg);

    Ok(Photo {
        id,
        image_path: path,
        base64: base64_content,
        metadata: None,
    })
}

#[tauri::command]
pub async fn select_images_directory(
    app: AppHandle,
    repo: State<'_, DittoRepository>,
) -> Result<Option<Vec<Photo>>, String> {
    use tauri_plugin_dialog::FilePath;
    use tauri_plugin_store::StoreExt;

    let (tx, rx) = std::sync::mpsc::channel();

    app.dialog().file().pick_folder(move |path| {
        tx.send(path).unwrap();
    });

    let folder = rx.recv().map_err(|e| e.to_string())?;

    if let Some(folder_path) = folder {
        let path_str = match folder_path {
            FilePath::Path(p) => p.to_string_lossy().to_string(),
            FilePath::Url(u) => u
                .to_file_path()
                .map_err(|_| "Invalid URL".to_string())?
                .to_string_lossy()
                .to_string(),
        };

        let mut images: Vec<Photo> = Vec::new();

        for entry in WalkDir::new(&path_str).into_iter().filter_map(|e| e.ok()) {
            if entry.file_type().is_file() {
                if let Some(ext) = entry.path().extension() {
                    let ext = ext.to_string_lossy().to_lowercase();
                    if matches!(
                        ext.as_str(),
                        "jpg" | "jpeg" | "png" | "heic" | "webp" | "tiff"
                    ) {
                        let path = entry.path().to_string_lossy().to_string();

                        if let Ok(photo) = process_image_file(path) {
                            images.push(photo);
                        }
                    }
                }
            }
        }

        // Persist the path
        let store = app.store("config.json").map_err(|e| e.to_string())?;
        store.set("library_path", serde_json::Value::String(path_str.clone()));
        store.save().map_err(|e| e.to_string())?;

        repo.dispatch(AppAction::SetImageLibraryContent {
            images: images.clone(),
        })
        .await?;

        repo.upsert_photos_from_paths(&images).await?;

        Ok(Some(images))
    } else {
        // No directory content
        Ok(None)
    }
}

#[tauri::command]
pub async fn add_photo_to_library(
    app: AppHandle,
    repo: State<'_, DittoRepository>,
) -> Result<Option<Photo>, String> {
    use tauri_plugin_dialog::FilePath;

    let (tx, rx) = std::sync::mpsc::channel();

    app.dialog()
        .file()
        .add_filter("Image", &["jpg", "jpeg", "png", "heic", "webp", "tiff"])
        .pick_file(move |path| {
            tx.send(path).unwrap();
        });

    let file = rx.recv().map_err(|e| e.to_string())?;

    if let Some(file_path) = file {
        let path_str = match file_path {
            FilePath::Path(p) => p.to_string_lossy().to_string(),
            FilePath::Url(u) => u
                .to_file_path()
                .map_err(|_| "Invalid URL".to_string())?
                .to_string_lossy()
                .to_string(),
        };

        let photo = process_image_file(path_str)?;

        let mut current_state = repo.get_state();
        current_state.images.push(photo.clone());

        repo.dispatch(AppAction::SetImageLibraryContent {
            images: current_state.images,
        })
        .await?;

        repo.upsert_photos_from_paths(&[photo.clone()]).await?;

        Ok(Some(photo))
    } else {
        Ok(None)
    }
}
