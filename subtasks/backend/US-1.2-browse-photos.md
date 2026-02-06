# Task: US-1.2 Browse photos (Backend)

## Description
Backend support for serving photo thumbnails and metadata for the gallery.

## Technical Details
- **Tauri Command**: `get_photos`
- **Metadata**: Extract EXIF data (date taken, dimensions, location) using the `exif` crate.
- **Thumbnail Generation**:
    - Use the `image` crate to generate downscaled thumbnails.
    - Implement a caching strategy (e.g., in `AppCache` directory) to avoid re-generating thumbnails on every launch.
    - **Tauri Command**: `get_thumbnail` (returns base64 or a custom protocol URL like `asset://`).
