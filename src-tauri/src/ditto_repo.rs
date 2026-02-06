use std::str::FromStr;
use std::sync::{Arc, RwLock};

use dittolive_ditto::dql::QueryResult;
use dittolive_ditto::fs::PersistentRoot;
use dittolive_ditto::identity;
use dittolive_ditto::prelude::*;
use dittolive_ditto::transport::Peer;
use dittolive_ditto::store::StoreObserver;
use serde::{Deserialize, Serialize};
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Emitter, Manager};

const STATE_COLLECTION: &str = "app_state";
const STATE_DOC_ID: &str = "root";
const PHOTOS_COLLECTION: &str = "photos";
const SET_LIBRARY_EVENT: &str = "SetLibrary";
const PRESENCE_EVENT: &str = "Presence";
const SYNC_INFO_QUERY: &str = "SELECT * FROM system:data_sync_info WHERE is_ditto_server = true ORDER BY documents.synced_up_to_local_commit_id DESC LIMIT 1";

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
#[serde(rename_all = "snake_case")]
pub enum SyncStatus {
    Synced,
    Pending,
    Disconnected,
    Unknown,
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
    #[serde(default)]
    content_commit_id: Option<u64>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PhotoPayload {
    pub id: String,
    pub filename: String,
    pub path: String,
    pub base64: String,
    pub sync_status: SyncStatus,
}

#[derive(Clone, Debug, Serialize)]
struct SetLibraryPayload {
    photos: Vec<PhotoPayload>,
}

#[derive(Clone, Debug, Serialize)]
struct PresencePeerPayload {
    peer_key: String,
    device_name: String,
    metadata: serde_json::Value,
}

#[derive(Clone, Debug, Serialize)]
struct PresencePayload {
    local_peer: PresencePeerPayload,
    remote_peers: Vec<PresencePeerPayload>,
}

#[derive(Clone, Debug, Default)]
struct SyncInfo {
    connected: bool,
    synced_up_to_local_commit_id: Option<u64>,
}

pub struct DittoRepository {
    state: Arc<RwLock<AppState>>,
    sync_info: Arc<RwLock<SyncInfo>>,
    ditto: Arc<Ditto>,
    _observer: Arc<StoreObserver>,
    _photos_observer: Arc<StoreObserver>,
    _sync_observer: Arc<StoreObserver>,
    _presence_observer: PresenceObserver,
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
        let ditto = Arc::new(ditto);

        ditto
            .disable_sync_with_v3()
            .map_err(|e| format!("Failed to disable v3 sync: {e}"))?;

        let device_name = ditto.presence().graph().local_peer.device_name.clone();
        let user_name = std::env::var("USER")
            .or_else(|_| std::env::var("USERNAME"))
            .unwrap_or(device_name);
        let peer_metadata = serde_json::json!({ "name": user_name });
        ditto
            .presence()
            .set_peer_metadata(&peer_metadata)
            .map_err(|e| format!("Failed to set peer metadata: {e}"))?;

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
            transport_config.peer_to_peer.bluetooth_le.enabled = true;
            //Local Area Network
            transport_config.peer_to_peer.lan.enabled = true;
            // Apple Wireless Direct Link
            // transport_config.peer_to_peer.awdl.enabled = false;
            //wifi aware
            // transport_config.peer_to_peer.wifi_aware.enabled = false;
            println!("Transport config: {:#?}", transport_config);
        });

        ditto
            .start_sync()
            .map_err(|e| format!("Failed to start Ditto sync: {e}"))?;
    
        ditto.sync().register_subscription_v2("SELECT * FROM photos").map_err(|e| format!("Failed to register subscription: {e}"))?;

        let initial_state = load_state(ditto.as_ref()).await?;
        let sync_info = Arc::new(RwLock::new(load_sync_info(ditto.as_ref()).await?));
        let state = Arc::new(RwLock::new(initial_state));
        let observer = install_state_observer(ditto.as_ref(), state.clone())?;
        let sync_observer = install_sync_observer(ditto.clone(), app, sync_info.clone())?;
        let photos_observer = install_photos_observer(ditto.as_ref(), app, sync_info.clone())?;
        let presence_observer = install_presence_observer(ditto.clone(), app)?;
        emit_library_snapshot(ditto.as_ref(), app, sync_info.clone()).await?;
        emit_presence_snapshot(ditto.as_ref(), app)?;

        Ok(Self {
            state,
            sync_info,
            ditto,
            _observer: observer,
            _photos_observer: photos_observer,
            _sync_observer: sync_observer,
            _presence_observer: presence_observer,
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
                _id: doc_id.clone(),
                filename: filename.clone(),
                path: image.image_path.clone(),
                base64: image.base64.clone(),
                content_commit_id: None,
            };

            let result = store
                .execute_v2((
                    format!("INSERT INTO {PHOTOS_COLLECTION} DOCUMENTS (:doc) ON ID CONFLICT DO UPDATE"),
                    serde_json::json!({ "doc": doc }),
                ))
                .await
                .map_err(|e| format!("Failed to upsert Ditto photo: {e}"))?;
            if let Some(commit_id) = result.commit_id() {
                store
                    .execute_v2((
                        format!("UPDATE {PHOTOS_COLLECTION} SET content_commit_id = :commit_id WHERE _id = :id"),
                        serde_json::json!({ "commit_id": commit_id, "id": doc_id }),
                    ))
                    .await
                    .map_err(|e| format!("Failed to store photo commit id: {e}"))?;
            }
        }

        Ok(())
    }

    pub async fn get_photos(&self) -> Result<Vec<PhotoPayload>, String> {
        let store = self.ditto.store();
        let result = store
            .execute_v2(format!("SELECT * FROM {PHOTOS_COLLECTION}"))
            .await
            .map_err(|e| format!("Failed to query Ditto photos: {e}"))?;
        let sync_info = self
            .sync_info
            .read()
            .map(|info| info.clone())
            .unwrap_or_default();
        Ok(collect_photo_payloads(&result, &sync_info))
    }

    pub async fn remove_photo(&self, id: &str) -> Result<(), String> {
        let store = self.ditto.store();
        store
            .execute_v2((
                format!("DELETE FROM {PHOTOS_COLLECTION} WHERE _id = :id"),
                serde_json::json!({ "id": id }),
            ))
            .await
            .map_err(|e| format!("Failed to remove Ditto photo: {e}"))?;
        Ok(())
    }

    pub async fn clear_library(&self) -> Result<(), String> {
        let store = self.ditto.store();
        store
            .execute_v2(format!(
                "DELETE FROM {PHOTOS_COLLECTION} WHERE _id != ''"
            ))
            .await
            .map_err(|e| format!("Failed to clear Ditto photos: {e}"))?;

        self.dispatch(AppAction::ClearImageLibraryContent).await?;
        Ok(())
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

fn install_photos_observer(
    ditto: &Ditto,
    app: &AppHandle,
    sync_info: Arc<RwLock<SyncInfo>>,
) -> Result<Arc<StoreObserver>, String> {
    let store = ditto.store();
    let app_handle = app.clone();
    let query = format!("SELECT * FROM {PHOTOS_COLLECTION}");
    store
        .register_observer_v2(query, move |query_result| {
            let sync_info = sync_info
                .read()
                .map(|info| info.clone())
                .unwrap_or_default();
            let photos = collect_photo_payloads(&query_result, &sync_info);
            let payload = SetLibraryPayload { photos };
            if let Err(error) = app_handle.emit(SET_LIBRARY_EVENT, payload) {
                eprintln!("{error}");
            }
        })
        .map_err(|e| format!("Failed to register photo observer: {e}"))
}

fn install_presence_observer(
    ditto: Arc<Ditto>,
    app: &AppHandle,
) -> Result<PresenceObserver, String> {
    let app_handle = app.clone();
    ditto
        .presence()
        .register_observer(move |graph| {
            let payload = build_presence_payload(graph);
            if let Err(error) = app_handle.emit(PRESENCE_EVENT, payload) {
                eprintln!("{error}");
            }
        })
        .map_err(|e| format!("Failed to register presence observer: {e}"))
}

async fn emit_library_snapshot(
    ditto: &Ditto,
    app: &AppHandle,
    sync_info: Arc<RwLock<SyncInfo>>,
) -> Result<(), String> {
    let store = ditto.store();
    let result = store
        .execute_v2(format!("SELECT * FROM {PHOTOS_COLLECTION}"))
        .await
        .map_err(|e| format!("Failed to query Ditto photos: {e}"))?;
    let sync_info = sync_info
        .read()
        .map(|info| info.clone())
        .unwrap_or_default();
    let payload = SetLibraryPayload {
        photos: collect_photo_payloads(&result, &sync_info),
    };
    app.emit(SET_LIBRARY_EVENT, payload)
        .map_err(|e| format!("Failed to emit SetLibrary: {e}"))
}

fn emit_presence_snapshot(ditto: &Ditto, app: &AppHandle) -> Result<(), String> {
    let graph = ditto.presence().graph();
    let payload = build_presence_payload(&graph);
    app.emit(PRESENCE_EVENT, payload)
        .map_err(|e| format!("Failed to emit Presence: {e}"))
}

fn build_presence_payload(graph: &PresenceGraph) -> PresencePayload {
    let local_peer = build_presence_peer_payload(&graph.local_peer);
    let remote_peers = graph
        .remote_peers
        .iter()
        .map(build_presence_peer_payload)
        .collect();
    PresencePayload {
        local_peer,
        remote_peers,
    }
}

fn build_presence_peer_payload(peer: &Peer) -> PresencePeerPayload {
    PresencePeerPayload {
        peer_key: peer.peer_key_string.clone(),
        device_name: peer.device_name.clone(),
        metadata: peer.peer_metadata.clone(),
    }
}

fn collect_photo_payloads(query_result: &QueryResult, sync_info: &SyncInfo) -> Vec<PhotoPayload> {
    query_result
        .iter()
        .filter_map(|item| item.deserialize_value::<PhotoDocument>().ok())
        .map(|doc| {
            let sync_status = compute_sync_status(&doc, sync_info);
            PhotoPayload {
                id: doc._id,
                filename: doc.filename,
                path: doc.path,
                base64: doc.base64,
                sync_status,
            }
        })
        .collect()
}

fn compute_sync_status(doc: &PhotoDocument, sync_info: &SyncInfo) -> SyncStatus {
    if !sync_info.connected {
        return SyncStatus::Disconnected;
    }
    match (doc.content_commit_id, sync_info.synced_up_to_local_commit_id) {
        (Some(local_commit_id), Some(synced_up_to)) => {
            if synced_up_to >= local_commit_id {
                SyncStatus::Synced
            } else {
                SyncStatus::Pending
            }
        }
        (Some(_), None) => SyncStatus::Unknown,
        (None, _) => SyncStatus::Unknown,
    }
}

async fn load_sync_info(ditto: &Ditto) -> Result<SyncInfo, String> {
    let store = ditto.store();
    let result = store
        .execute_v2((SYNC_INFO_QUERY.to_string(), serde_json::json!({})))
        .await
        .map_err(|e| format!("Failed to query Ditto sync info: {e}"))?;
    Ok(extract_sync_info(&result))
}

fn install_sync_observer(
    ditto: Arc<Ditto>,
    app: &AppHandle,
    sync_info: Arc<RwLock<SyncInfo>>,
) -> Result<Arc<StoreObserver>, String> {
    let ditto_for_observer = ditto.clone();
    let store = ditto.store();
    let app_handle = app.clone();
    store
        .register_observer_v2(SYNC_INFO_QUERY.to_string(), move |query_result| {
            let updated = extract_sync_info(&query_result);
            if let Ok(mut guard) = sync_info.write() {
                *guard = updated;
            }
            let _ = tauri::async_runtime::spawn({
                let app_handle = app_handle.clone();
                let ditto = ditto_for_observer.clone();
                let sync_info = sync_info.clone();
                async move {
                    let _ = emit_library_snapshot(&ditto, &app_handle, sync_info).await;
                }
            });
        })
        .map_err(|e| format!("Failed to register sync observer: {e}"))
}

fn extract_sync_info(result: &QueryResult) -> SyncInfo {
    let Some(item) = result.iter().next() else {
        return SyncInfo::default();
    };
    let value: serde_json::Value = match item.deserialize_value() {
        Ok(value) => value,
        Err(_) => return SyncInfo::default(),
    };
    let documents = value
        .get("documents")
        .and_then(|doc| doc.as_object())
        .or_else(|| value.get("doc").and_then(|doc| doc.as_object()))
        .or_else(|| value.as_object())
        .cloned()
        .unwrap_or_default();
    let connected = documents
        .get("sync_session_status")
        .and_then(|status| status.as_str())
        .map(|status| status.to_lowercase().contains("connected"))
        .unwrap_or_else(|| documents.get("synced_up_to_local_commit_id").is_some());
    let synced_up_to_local_commit_id = documents
        .get("synced_up_to_local_commit_id")
        .and_then(|value| value.as_u64());
    SyncInfo {
        connected,
        synced_up_to_local_commit_id,
    }
}


