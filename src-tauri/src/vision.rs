use serde::Serialize;
use rexif::{ExifTag, TagValue};

#[derive(Debug, Serialize)]
pub struct ImageMetadata {
    pub datetime: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub make: Option<String>,
    pub model: Option<String>,
}


#[tauri::command]
pub async fn analyze_image_metadata(path: String) -> Result<ImageMetadata, String> {
    let data = match rexif::parse_file(&path) {
        Ok(d) => d,
        Err(_) => return Ok(ImageMetadata {
            datetime: None,
            latitude: None,
            longitude: None,
            make: None,
            model: None,
        }),
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
    // Platform-specific implementation using Apple's Vision framework via `objc2-vision`.
    // For now, provide a best-effort basic implementation:
    #[cfg(target_os = "macos")]
    {
        // Minimal face presence filter: keep candidate images that contain at least one face,
        // and only if the target image also contains at least one face.
        if !contains_face(&target_image_path)? {
            return Ok(FaceRecognitionResult { matched_paths: vec![] });
        }
        let mut matched = Vec::new();
        for p in candidate_image_paths {
            if contains_face(&p)? {
                matched.push(p);
            }
        }
        return Ok(FaceRecognitionResult { matched_paths: matched });
    }

    #[cfg(not(target_os = "macos"))]
    {
        // Non-Apple platforms: Vision is unavailable. Return empty result.
        Ok(FaceRecognitionResult { matched_paths: vec![] })
    }
}

#[cfg(all(target_os = "macos", feature = "vision_face_detect"))]
fn contains_face(path: &str) -> Result<bool, String> {
    use objc2::rc::Retained;
    use objc2::top_level_traits::AnyThread;
    use objc2_foundation::{NSData, NSDataReadingOptions, NSDictionary, NSString, NSURL};
    use objc2_vision::{VNDetectFaceRectanglesRequest, VNImageRequestHandler, VNRequest};

    unsafe {
        // Load image data via NSData
        let nsurl = NSURL::fileURLWithPath_isDirectory(&NSString::from_str(path), false);
        let data = NSData::initWithContentsOfURL_options_error(
            NSData::alloc(),
            &nsurl,
            NSDataReadingOptions(0),
        )
        .map_err(|_| "Failed to read image data".to_string())?;

        // Create a request handler from data
        let opts = NSDictionary::new();
        let handler = VNImageRequestHandler::initWithData_options(
            VNImageRequestHandler::alloc(),
            &data,
            &opts,
        );

        // Create face rectangles request
        let req = VNDetectFaceRectanglesRequest::new();
        let mut reqs: [Retained<VNRequest>; 1] = [Retained::cast(req.retain())];

        // Perform request
        let _ = handler.performRequests_error(&mut reqs, std::ptr::null_mut())
            .map_err(|_| "Vision face detection failed".to_string())?;

        // If any results -> faces found
        let results = req.results();
        Ok(results.is_some() && results.unwrap().count() > 0)
    }
}

#[cfg(any(not(target_os = "macos"), not(feature = "vision_face_detect")))]
fn contains_face(_path: &str) -> Result<bool, String> {
    Ok(false)
}

