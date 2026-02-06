# Umain Picksy for LLMs
This is a collaborative photo library with photo selection, and MANY other features.
Directory ./user-stories contains the list of user stories.

Technology is React front-end, and Rust-based Tauri back-end running the (local) infra.
Between front-end and back-end the IPC transport sends strings. These are commands.
The storage is a CRDT (Conflict-Free Replicated Data Type) which is replicated between clients (users of the same photo library, typically a family).
