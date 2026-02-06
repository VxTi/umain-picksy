# Task: US-7.1 Undo last action (Backend)

## Description
As a user, I want to undo my last action.

## Technical Details
- **Pattern**: Command pattern with an Undo/Redo stack.
- **State**: Keep a history of operations (e.g., `StackCreated`, `TopPicked`).
- **Tauri Command**: `undo_action`
