mod ditto_repo;

use ditto_repo::{AppAction, AppState, DittoRepository};
use tauri::{AppHandle, Manager, State};
use tauri_plugin_dialog::DialogExt;
use walkdir::WalkDir;

mod vision;
use vision::{analyze_image_metadata, recognize_faces};

#[tauri::command]
async fn select_source_folder(
    app: AppHandle,
    repo: State<'_, DittoRepository>,
) -> Result<Option<Vec<String>>, String> {
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

        let mut images: Vec<String> = Vec::new();

        for entry in WalkDir::new(&path_str).into_iter().filter_map(|e| e.ok()) {
            if entry.file_type().is_file() {
                if let Some(ext) = entry.path().extension() {
                    let ext = ext.to_string_lossy().to_lowercase();
                    if matches!(ext.as_str(), "jpg" | "jpeg" | "png" | "heic" | "webp" | "tiff") {
                        images.push(entry.path().to_string_lossy().to_string());
                    }
                }
            }
        }
        let image_count = images.len();

        // Persist the path
        let store = app.store("config.json").map_err(|e| e.to_string())?;
        store.set("library_path", serde_json::Value::String(path_str.clone()));
        store.save().map_err(|e| e.to_string())?;

        repo.dispatch(AppAction::SetLibraryPath {
            path: path_str.clone(),
            image_count,
        })
        .await?;

        Ok(Some(images))
    } else {
        Ok(None)
    }
}

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
            select_source_folder,
            analyze_image_metadata,
            recognize_faces,
            get_app_state
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
