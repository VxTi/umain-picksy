# Umain Picksy for LLMs
This is a collaborative photo library with photo selection, and MANY other features.
Directory ./user-stories contains the list of user stories.

Technology is React front-end, and Rust-based Tauri back-end running the (local) infra.
Between front-end and back-end the IPC transport sends strings. These are commands.
The storage is a CRDT (Conflict-Free Replicated Data Type) which is replicated between clients (users of the same photo library, typically a family).

## Ditto observer/write pitfall
Ditto store observers (`install_photos_observer` in `src-tauri/src/ditto_repo.rs`) run inline with the store thread. Doing heavy work (deserializing large payloads or emitting to the UI) directly in the observer can block write transactions and make imports appear to “hang”.

Fix strategy:
- Keep observer callbacks tiny; offload emit/snapshot work to an async task.
- Queue photo upserts and perform writes + snapshot emits in a background worker so commands return immediately.
