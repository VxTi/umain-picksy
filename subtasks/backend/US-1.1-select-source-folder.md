# Task: US-1.1 Select source folder (Backend)

## Description
Implement a Tauri command to allow users to select a local directory as their photo source. The backend must validate the path, scan for supported image files, and persist the library path for future sessions.

## Technical Details
- **Tauri Command**: `select_source_folder`
- **Logic**:
    - Use `tauri-plugin-dialog` (Rust side) to open a native folder picker.
    - Validate that the path is accessible.
    - Persist the path using `tauri-plugin-store` or a simple JSON configuration.
    - Return the selected path and the count of images found.
- **File Types**: `.jpg`, `.jpeg`, `.png`, `.heic`, `.webp`.
