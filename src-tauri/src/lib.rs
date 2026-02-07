mod ditto_repo;

use ditto_repo::{AppState, DittoRepository};
use tauri::{Manager, State};
use tauri::{
  menu::{Menu, MenuItem},
  tray::TrayIconBuilder,
};

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
    get_full_res_attachment,
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

            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&quit_i])?;

            let tray = TrayIconBuilder::new()
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                    println!("quit menu item was clicked");
                    app.exit(0);
                    }
                    _ => {
                    println!("menu item {:?} not handled", event.id);
                    }
                })
                .menu(&menu)
                .show_menu_on_left_click(true)
                .build(app);

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
            clear_photo_stack,
            get_full_res_attachment
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
