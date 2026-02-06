# Task: US-5.1 Detect faces locally (Backend)

## Description
Detect faces using local Mac API (Vision framework).

## Technical Details
- **Technology**: Use `swift-rs` or `objc` to call Apple's `Vision` framework.
- **Logic**: For each photo, detect face rectangles and potentially landmarks.
- **Storage**: Save face metadata linked to `PhotoId`.
