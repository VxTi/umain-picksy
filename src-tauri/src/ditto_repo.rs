use std::str::FromStr;
use std::sync::{Arc, RwLock};

use dittolive_ditto::fs::PersistentRoot;
use dittolive_ditto::identity;
use dittolive_ditto::prelude::*;
use dittolive_ditto::store::StoreObserver;
use serde::{Deserialize, Serialize};
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager};

const STATE_COLLECTION: &str = "app_state";
const STATE_DOC_ID: &str = "root";

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct AppState {
    pub library_path: Option<String>,
    pub image_count: Option<usize>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum AppAction {
    SetLibraryPath { path: String, image_count: usize },
    ClearLibraryPath,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct StoredState {
    _id: String,
    state: AppState,
}

pub struct DittoRepository {
    state: Arc<RwLock<AppState>>,
    ditto: Ditto,
    _observer: Arc<StoreObserver>,
}

impl DittoRepository {
    pub async fn init(app: &AppHandle) -> Result<Self, String> {
        load_dotenv(app)?;

        let (app_id, playground_token, auth_url) = read_ditto_env()?;
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
            .start_sync()
            .map_err(|e| format!("Failed to start Ditto sync: {e}"))?;

        let initial_state = load_state(&ditto).await?;
        let state = Arc::new(RwLock::new(initial_state));
        let observer = install_state_observer(&ditto, state.clone())?;

        Ok(Self {
            state,
            ditto,
            _observer: observer,
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
}

impl AppState {
    fn reduce(&mut self, action: AppAction) {
        match action {
            AppAction::SetLibraryPath { path, image_count } => {
                self.library_path = Some(path);
                self.image_count = Some(image_count);
            }
            AppAction::ClearLibraryPath => {
                self.library_path = None;
                self.image_count = None;
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

fn read_ditto_env() -> Result<(String, String, String), String> {
    let app_id = std::env::var("DITTO_APP_ID")
        .or_else(|_| std::env::var("DITTO_DATABASE_ID"))
        .map_err(|_| "Missing DITTO_APP_ID (or DITTO_DATABASE_ID)".to_string())?;
    let playground_token = std::env::var("DITTO_PLAYGROUND_TOKEN")
        .or_else(|_| std::env::var("DITTO_SHARED_TOKEN"))
        .map_err(|_| "Missing DITTO_PLAYGROUND_TOKEN (or DITTO_SHARED_TOKEN)".to_string())?;
    let auth_url = std::env::var("DITTO_AUTH_URL")
        .map_err(|_| "Missing DITTO_AUTH_URL".to_string())?;
    Ok((app_id, playground_token, auth_url))
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

    let stored: StoredState = item
        .deserialize_value()
        .map_err(|e| format!("Failed to deserialize Ditto state: {e}"))?;
    Ok(stored.state)
}

async fn persist_state(ditto: &Ditto, state: &AppState) -> Result<(), String> {
    let store = ditto.store();
    let update_query = (
        format!("UPDATE {STATE_COLLECTION} SET state = :state WHERE _id = :id"),
        serde_json::json!({ "state": state, "id": STATE_DOC_ID }),
    );
    let update_result = store
        .execute_v2(update_query)
        .await
        .map_err(|e| format!("Failed to update Ditto state: {e}"))?;

    if update_result.item_count() == 0 {
        let doc = StoredState {
            _id: STATE_DOC_ID.to_string(),
            state: state.clone(),
        };
        store
            .execute_v2((
                format!("INSERT INTO {STATE_COLLECTION} DOCUMENTS (:doc)"),
                serde_json::json!({ "doc": doc }),
            ))
            .await
            .map_err(|e| format!("Failed to insert Ditto state: {e}"))?;
    }

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
                    *guard = stored.state;
                }
            }
        })
        .map_err(|e| format!("Failed to register Ditto observer: {e}"))
}

