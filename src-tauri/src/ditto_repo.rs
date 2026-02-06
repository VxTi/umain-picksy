use std::str::FromStr;
use std::sync::{Arc, RwLock};

use dittolive_ditto::dql::QueryResult;
use dittolive_ditto::fs::PersistentRoot;
use dittolive_ditto::identity;
use dittolive_ditto::prelude::*;
use dittolive_ditto::store::StoreObserver;
use serde::{Deserialize, Serialize};
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Emitter, Manager};

const STATE_COLLECTION: &str = "app_state";
const STATE_DOC_ID: &str = "root";
const PHOTOS_COLLECTION: &str = "photos";
const BACKEND_COMMAND_EVENT: &str = "backend_command";

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ImageMetadata {
    pub datetime: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub make: Option<String>,
    pub model: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Photo {
    #[serde(default)]
    pub id: String,
    pub image_path: String,
    pub base64: String,
    pub metadata: Option<ImageMetadata>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum AppAction {
    SetImageLibraryContent {
        images: Vec<Photo>
    },
    ClearImageLibraryContent,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct AppState {
    #[serde(default)]
    pub images: Vec<Photo>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct StoredState {
    _id: String,
    state: AppState,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct PhotoDocument {
    _id: String,
    filename: String,
    path: String,
    base64: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PhotoPayload {
    pub id: String,
    pub filename: String,
    pub path: String,
    pub base64: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(tag = "command")]
enum BackendCommand {
    SetLibrary { photos: Vec<PhotoPayload> },
}

pub struct DittoRepository {
    state: Arc<RwLock<AppState>>,
    ditto: Ditto,
    _observer: Arc<StoreObserver>,
    _photos_observer: Arc<StoreObserver>,
}

impl DittoRepository {
    pub async fn init(app: &AppHandle) -> Result<Self, String> {
        load_dotenv(app)?;

        let (app_id, playground_token, auth_url, websocket_url) = read_ditto_env()?;
        let data_dir = app
            .path()
            .app_data_dir()
            .map_err(|e| format!("Failed to resolve app data dir: {e}"))?;
        let ditto_root = PersistentRoot::new(data_dir.join("ditto"))
            .map_err(|e| format!("Failed to create Ditto data dir: {e}"))?;

        let ditto = Ditto::builder()
            .with_root(Arc::new(ditto_root))
            .with_identity(|root| {
                identity::OnlinePlayground::new(
                    root,
                    AppId::from_str(&app_id)?,
                    playground_token.clone(),
                    true,
                    Some(&auth_url),
                )
            })
            .map_err(|e| format!("Failed to configure Ditto identity: {e}"))?
            .build()
            .map_err(|e| format!("Failed to build Ditto instance: {e}"))?;

        ditto
            .disable_sync_with_v3()
            .map_err(|e| format!("Failed to disable v3 sync: {e}"))?;

        ditto
            .presence()
            .set_connection_request_handler(|connection_request: ConnectionRequest| {
                let connection_type = connection_request.connection_type();
                let peer_key = connection_request.peer_key_string();
                let peer_metadata = connection_request.peer_metadata_json_str();
                let identity_metadata = connection_request.identity_service_metadata_json_str();

                println!(
                    "Connection request: type={connection_type:?}, peer_key={peer_key}, peer_metadata={peer_metadata}, identity_metadata={identity_metadata}"
                );

                ConnectionRequestAuthorization::Allow
                // if (true) {
                // } else {
                //     ConnectionRequestAuthorization::Deny
                // }
            });

        ditto.update_transport_config(|transport_config| {
            transport_config.enable_all_peer_to_peer();
            transport_config.global.sync_group = 0; // all users in 1 big pool!
            transport_config.connect.websocket_urls.clear();
            transport_config.connect.websocket_urls.insert(websocket_url);
            //BluetoothLe
            transport_config.peer_to_peer.bluetooth_le.enabled = false;
            //Local Area Network
            transport_config.peer_to_peer.lan.enabled = false;
            // Apple Wireless Direct Link
            // transport_config.peer_to_peer.awdl.enabled = false;
            //wifi aware
            // transport_config.peer_to_peer.wifi_aware.enabled = false;
        });

        ditto
            .start_sync()
            .map_err(|e| format!("Failed to start Ditto sync: {e}"))?;
    
        ditto.sync().register_subscription_v2("SELECT * FROM photos").map_err(|e| format!("Failed to register subscription: {e}"))?;

        let initial_state = load_state(&ditto).await?;
        let state = Arc::new(RwLock::new(initial_state));
        let observer = install_state_observer(&ditto, state.clone())?;
        let photos_observer = install_photos_observer(&ditto, app)?;
        emit_library_snapshot(&ditto, app).await?;

        Ok(Self {
            state,
            ditto,
            _observer: observer,
            _photos_observer: photos_observer,
        })
    }

    pub fn get_state(&self) -> AppState {
        self.state
            .read()
            .map(|state| state.clone())
            .unwrap_or_default()
    }

    pub async fn dispatch(&self, action: AppAction) -> Result<AppState, String> {
        let updated = {
            let mut state = self
                .state
                .write()
                .map_err(|_| "Failed to lock app state".to_string())?;
            state.reduce(action);
            state.clone()
        };

        persist_state(&self.ditto, &updated).await?;
        Ok(updated)
    }

    pub async fn upsert_photos_from_paths(&self, images: &[Photo]) -> Result<(), String> {
        let store = self.ditto.store();
        let mut seen = std::collections::HashSet::new();

        for image in images {
            let filename = std::path::Path::new(&image.image_path)
                .file_name()
                .map(|name| name.to_string_lossy().to_string())
                .unwrap_or_else(|| image.image_path.clone());

            let doc_id = image.id.clone();

            if !seen.insert(doc_id.clone()) {
                continue;
            }

            let doc = PhotoDocument {
                _id: doc_id,
                filename: filename.clone(),
                path: image.image_path.clone(),
                base64: image.base64.clone(),
            };

            store
                .execute_v2((
                    format!("INSERT INTO {PHOTOS_COLLECTION} DOCUMENTS (:doc) ON ID CONFLICT DO UPDATE"),
                    serde_json::json!({ "doc": doc }),
                ))
                .await
                .map_err(|e| format!("Failed to upsert Ditto photo: {e}"))?;
        }

        Ok(())
    }

    pub async fn get_photos(&self) -> Result<Vec<PhotoPayload>, String> {
        let store = self.ditto.store();
        let result = store
            .execute_v2(format!("SELECT * FROM {PHOTOS_COLLECTION}"))
            .await
            .map_err(|e| format!("Failed to query Ditto photos: {e}"))?;
        Ok(collect_photo_payloads(&result))
    }
}

impl AppState {
    fn reduce(&mut self, action: AppAction) {
        match action {
            AppAction::SetImageLibraryContent { images } => {
                self.images = images;
            }
            AppAction::ClearImageLibraryContent => {
                self.images.clear();
            }
        }
    }
}

fn load_dotenv(app: &AppHandle) -> Result<(), String> {
    if dotenvy::dotenv().is_ok() {
        return Ok(());
    }

    let resource_env = app
        .path()
        .resolve(".env", BaseDirectory::Resource)
        .map_err(|e| format!("Failed to resolve bundled .env: {e}"))?;

    if resource_env.exists() {
        dotenvy::from_path(resource_env)
            .map(|_| ())
            .map_err(|e| format!("Failed to load bundled .env: {e}"))?;
    }

    Ok(())
}

fn read_ditto_env() -> Result<(String, String, String, String), String> {
    let app_id = std::env::var("DITTO_APP_ID")
        .or_else(|_| std::env::var("DITTO_DATABASE_ID"))
        .map_err(|_| "Missing DITTO_APP_ID (or DITTO_DATABASE_ID)".to_string())?;
    let playground_token = std::env::var("DITTO_PLAYGROUND_TOKEN")
        .or_else(|_| std::env::var("DITTO_SHARED_TOKEN"))
        .map_err(|_| "Missing DITTO_PLAYGROUND_TOKEN (or DITTO_SHARED_TOKEN)".to_string())?;
    let auth_url = std::env::var("DITTO_AUTH_URL")
        .map_err(|_| "Missing DITTO_AUTH_URL".to_string())?;
    let websocket_url = std::env::var("DITTO_WEBSOCKET_URL")
        .map_err(|_| "Missing DITTO_WEBSOCKET_URL".to_string())?;
    Ok((app_id, playground_token, auth_url, websocket_url))
}

async fn load_state(ditto: &Ditto) -> Result<AppState, String> {
    let store = ditto.store();
    let query = (
        format!("SELECT * FROM {STATE_COLLECTION} WHERE _id = :id"),
        serde_json::json!({ "id": STATE_DOC_ID }),
    );
    let result = store
        .execute_v2(query)
        .await
        .map_err(|e| format!("Failed to query Ditto state: {e}"))?;

    let Some(item) = result.iter().next() else {
        return Ok(AppState::default());
    };

    let stored: StoredState = match item.deserialize_value() {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Failed to deserialize Ditto state (schema mismatch?): {e}. Resetting state.");
            return Ok(AppState::default());
        }
    };
    Ok(normalize_state(stored.state))
}

async fn persist_state(ditto: &Ditto, state: &AppState) -> Result<(), String> {
    let store = ditto.store();
    let doc = StoredState {
        _id: STATE_DOC_ID.to_string(),
        state: state.clone(),
    };

    store
        .execute_v2((
            format!("INSERT INTO {STATE_COLLECTION} DOCUMENTS (:doc) ON ID CONFLICT DO UPDATE"),
            serde_json::json!({ "doc": doc }),
        ))
        .await
        .map_err(|e| format!("Failed to persist Ditto state: {e}"))?;

    Ok(())
}

fn install_state_observer(
    ditto: &Ditto,
    state: Arc<RwLock<AppState>>,
) -> Result<Arc<StoreObserver>, String> {
    let store = ditto.store();
    let query = (
        format!("SELECT * FROM {STATE_COLLECTION} WHERE _id = :id"),
        serde_json::json!({ "id": STATE_DOC_ID }),
    );
    store
        .register_observer_v2(query, move |query_result| {
            let Some(item) = query_result.iter().next() else {
                return;
            };
            let stored: Result<StoredState, _> = item.deserialize_value();
            if let Ok(stored) = stored {
                if let Ok(mut guard) = state.write() {
                    *guard = normalize_state(stored.state);
                }
            }
        })
        .map_err(|e| format!("Failed to register Ditto observer: {e}"))
}

fn normalize_state(mut state: AppState) -> AppState {
    for photo in &mut state.images {
        if photo.id.is_empty() {
            photo.id = photo.image_path.clone();
        }
    }
    state
}

fn install_photos_observer(ditto: &Ditto, app: &AppHandle) -> Result<Arc<StoreObserver>, String> {
    let store = ditto.store();
    let app_handle = app.clone();
    let query = format!("SELECT * FROM {PHOTOS_COLLECTION}");
    store
        .register_observer_v2(query, move |query_result| {
            let photos = collect_photo_payloads(&query_result);
            let command = BackendCommand::SetLibrary { photos };
            if let Err(error) = emit_backend_command(&app_handle, command) {
                eprintln!("{error}");
            }
        })
        .map_err(|e| format!("Failed to register photo observer: {e}"))
}

async fn emit_library_snapshot(ditto: &Ditto, app: &AppHandle) -> Result<(), String> {
    let store = ditto.store();
    let result = store
        .execute_v2(format!("SELECT * FROM {PHOTOS_COLLECTION}"))
        .await
        .map_err(|e| format!("Failed to query Ditto photos: {e}"))?;
    let command = BackendCommand::SetLibrary {
        photos: collect_photo_payloads(&result),
    };
    emit_backend_command(app, command)
}

fn collect_photo_payloads(query_result: &QueryResult) -> Vec<PhotoPayload> {
    query_result
        .iter()
        .filter_map(|item| item.deserialize_value::<PhotoDocument>().ok())
        .map(|doc| PhotoPayload {
            id: doc._id,
            filename: doc.filename,
            path: doc.path,
            base64: doc.base64,
        })
        .collect()
}

fn emit_backend_command(app: &AppHandle, command: BackendCommand) -> Result<(), String> {
    app.emit(BACKEND_COMMAND_EVENT, command)
        .map_err(|e| format!("Failed to emit backend command: {e}"))
}

