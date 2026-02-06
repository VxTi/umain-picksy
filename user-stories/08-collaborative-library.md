# Collaborative Library (Ditto)

## Share library

### US-8.1 Share my library
**As a** user  
**I want** to share my photo library with others via Ditto  
**So that** they can see and interact with the same set of photos in near real time.

- “Share library” creates or joins a Ditto sync identity/collection.
- Invite by link or code; others join same live document.

### US-8.2 Leave or revoke access
**As a** user  
**I want** to leave a shared library or revoke someone’s access  
**So that** I control who sees my photos.

- “Leave shared library” / “Revoke access” for a participant.

---

## Share commands on library

### US-8.3 Sync actions (picks, deletes, groups)
**As a** user  
**I want** actions on the library (pick top, delete, group, rename) to sync to others via Ditto  
**So that** we all see the same state (e.g. same “top” in a stack, same groups).

- Command/operation log or CRDT-style updates over Ditto.
- Conflict resolution: last-write-wins or explicit merge rules.

### US-8.4 See who did what (optional)
**As a** user  
**I want** to see who made a change (e.g. “Alice set top”, “Bob added to group”)  
**So that** we can coordinate and avoid confusion.

- Optional: identity per participant and “changed by” on actions.

---

## Share photo previews/binaries

### US-8.5 Sync thumbnails and previews
**As a** user  
**I want** thumbnails and previews to sync through Ditto  
**So that** others can browse without needing the full-resolution originals immediately.

- Thumbnail and medium-size preview as syncable blobs/attachments in Ditto.
- Lazy load full-res on demand or out-of-band.

### US-8.6 Sync full photo binaries (optional)
**As a** user  
**I want** full-resolution photos to sync over Ditto when needed  
**So that** collaborators can download or view originals.

- Optional: full binary sync (with size/bandwidth considerations and maybe “download on demand”).

---

## Reactions / likes

### US-8.7 React or like a photo
**As a** user  
**I want** to add a reaction or “like” to a photo in the shared library  
**So that** I can signal approval or highlight favorites without editing.

- Reactions/likes stored in Ditto (e.g. photo_id + user_id + reaction type).
- Sync to all participants.

### US-8.8 See reactions from others
**As a** user  
**I want** to see who reacted or liked a photo  
**So that** I know what others think and can use it for picking.

- Show reaction count and/or list of reactors per photo (e.g. in gallery or detail view).
