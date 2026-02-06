use serde::Serialize;

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
    // Fallback EXIF parsing using the `rexif` crate for portability.
    // On Apple platforms, a Vision/ImageIO-based implementation can replace/augment this.
    let data = match rexif::parse_file(&path) {
        Ok(d) => d,
        Err(e) => {
            return Err(format!("Failed to parse metadata: {e}"));
        }
    };

    let mut out = ImageMetadata {
        datetime: None,
        latitude: None,
        longitude: None,
        make: None,
        model: None,
    };

    // Helper to get string value by tag name
    let get_str = |tag_name: &str| -> Option<String> {
        data.entries
            .iter()
            .find(|e| e.tag.to_string() == tag_name)
            .map(|e| e.value_more_readable.to_string())
    };

    out.datetime = get_str("DateTimeOriginal").or_else(|| get_str("DateTime"));
    out.make = get_str("Make");
    out.model = get_str("Model");

    // GPS coordinates
    let lat_str = get_str("GPSLatitude");
    let lat_ref = get_str("GPSLatitudeRef");
    let lon_str = get_str("GPSLongitude");
    let lon_ref = get_str("GPSLongitudeRef");

    let parse_first_float = |s: &str| -> Option<f64> {
        let token = s
            .split(|c: char| !(c.is_ascii_digit() || c == '.' || c == '-' ))
            .find(|t| !t.is_empty())?;
        token.parse::<f64>().ok()
    };

    if let (Some(lat_s), Some(lat_ref_s)) = (lat_str.as_ref(), lat_ref.as_ref()) {
        if let Some(v) = parse_first_float(lat_s) {
            let sign = if lat_ref_s.trim().eq_ignore_ascii_case("S") { -1.0 } else { 1.0 };
            out.latitude = Some(v * sign);
        }
    }
    if let (Some(lon_s), Some(lon_ref_s)) = (lon_str.as_ref(), lon_ref.as_ref()) {
        if let Some(v) = parse_first_float(lon_s) {
            let sign = if lon_ref_s.trim().eq_ignore_ascii_case("W") { -1.0 } else { 1.0 };
            out.longitude = Some(v * sign);
        }
    }

    Ok(out)
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
