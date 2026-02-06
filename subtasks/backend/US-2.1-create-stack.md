# Task: US-2.1 Create a stack (Backend)

## Description
Backend logic for managing photo stacks (grouping similar photos).

## Technical Details
- **Data Model**: `Stack { id: UUID, representative_id: PhotoId, member_ids: Vec<PhotoId> }`.
- **Tauri Command**: `create_stack`
- **Persistence**: Store stack definitions in a local database (SQLite/rusqlite) or a JSON manifest.
