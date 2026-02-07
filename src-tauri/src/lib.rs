mod ditto_repo;

use ditto_repo::{AppState, DittoRepository};
use tauri::{Manager, State};

mod commands;

use commands::photo_library_commands::{
    add_photos_to_library,
    analyze_image_metadata,
    recognize_faces,
    clear_library,
    get_photos_from_library,
    remove_image_from_album,
    add_photos_from_folder,
    save_photo_config,
    set_photo_favorite,
    set_photos_favorite,
    set_photo_stack,
    set_stack_primary,
    clear_photo_stack,
};

#[tauri::command]
fn get_app_state(repo: State<'_, DittoRepository>) -> AppState {
    repo.get_state()
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
            add_photos_from_folder,
            add_photos_to_library,
            analyze_image_metadata,
            recognize_faces,
            clear_library,
            remove_image_from_album,
            get_app_state,
            get_photos_from_library,
            save_photo_config,
            set_photo_favorite,
            set_photos_favorite,
            set_photo_stack,
            set_stack_primary,
            clear_photo_stack
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
