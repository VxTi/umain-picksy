# Task: US-8.3 Sync actions (Backend)

## Description
Sync actions (picks, deletes, groups) via Ditto.

## Technical Details
- **CRDTs**: Leverage Ditto's built-in CRDTs to resolve conflicts when multiple users pick different "top" photos.
- **Replication**: Define replication rules for library metadata.
