use serde::Serialize;
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;
use walkdir::WalkDir;

#[derive(Serialize)]
pub struct SelectionResponse {
    path: String,
    image_count: usize,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn select_source_folder(app: AppHandle) -> Result<Option<SelectionResponse>, String> {
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
            FilePath::Url(u) => u.to_file_path().map_err(|_| "Invalid URL".to_string())?.to_string_lossy().to_string(),
        };
        
        let mut image_count = 0;

        for entry in WalkDir::new(&path_str).into_iter().filter_map(|e| e.ok()) {
            if entry.file_type().is_file() {
                if let Some(ext) = entry.path().extension() {
                    let ext = ext.to_string_lossy().to_lowercase();
                    if matches!(
                        ext.as_str(),
                        "jpg" | "jpeg" | "png" | "heic" | "webp" | "tiff"
                    ) {
                        image_count += 1;
                    }
                }
            }
        }

        // Persist the path
        let store = app.store("config.json").map_err(|e| e.to_string())?;
        store.set("library_path", serde_json::Value::String(path_str.clone()));
        store.save().map_err(|e| e.to_string())?;

        Ok(Some(SelectionResponse {
            path: path_str,
            image_count,
        }))
    } else {
        Ok(None)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![select_source_folder])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
