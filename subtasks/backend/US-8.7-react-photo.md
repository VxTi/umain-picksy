# Task: US-8.7 React or like a photo (Backend)

## Description
Store and sync reactions via Ditto.

## Technical Details
- **Data Model**: `Reaction { photo_id: PhotoId, user_id: UserId, type: String, timestamp: u64 }`.
- **Sync**: Real-time sync of reactions using Ditto's live queries.
