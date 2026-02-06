mod ditto_repo;

use ditto_repo::{AppState, DittoRepository, PhotoPayload};
use tauri::{Manager, State};

mod commands;

use commands::image_analysis::{
    add_photo_to_library,
    analyze_image_metadata,
    recognize_faces,
    clear_library,
    remove_image_from_album,
    select_images_directory,
};

#[tauri::command]
fn get_app_state(repo: State<'_, DittoRepository>) -> AppState {
    repo.get_state()
}

#[tauri::command]
async fn get_library_photos(repo: State<'_, DittoRepository>) -> Result<Vec<PhotoPayload>, String> {
    repo.get_photos().await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle();
            let repo = tauri::async_runtime::block_on(DittoRepository::init(&handle)).map_err(
                |e| -> Box<dyn std::error::Error> {
                    Box::new(std::io::Error::new(std::io::ErrorKind::Other, e))
                },
            )?;
            app.manage(repo);
            Ok(())
        })
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            select_images_directory,
            add_photo_to_library,
            analyze_image_metadata,
            recognize_faces,
            clear_library,
            remove_image_from_album,
            get_app_state,
            get_library_photos
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
