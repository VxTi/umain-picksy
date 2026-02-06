# Undo

## US-7.1 Undo last action
**As a** user  
**I want** to undo my last action (e.g. delete, move, set top, rename)  
**So that** I can fix mistakes without redoing work.

- Global “Undo” (e.g. Cmd+Z).
- Covers: delete, move, stack top change, group rename, tag add/remove.

## US-7.2 Redo
**As a** user  
**I want** to redo after an undo  
**So that** I can flip back if I undid by mistake.

- “Redo” (e.g. Cmd+Shift+Z) when applicable.

## US-7.3 Undo history / multiple steps
**As a** user  
**I want** to undo more than just the last action (e.g. last 10)  
**So that** I can revert a sequence of changes.

- Undo stack (bounded, e.g. last N actions).
- Optional: “Undo history” panel showing recent actions.
