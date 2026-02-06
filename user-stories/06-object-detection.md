# Object Detection (Optional – Local Mac / Apple Vision or Skip)

## US-6.1 Detect objects locally
**As a** user  
**I want** objects in photos to be detected via a simple local Mac API (e.g. objc2 + Apple Vision)  
**So that** I can search or group by “dog”, “food”, “car” without cloud.

- Use Apple Vision (via objc2 Rust bindings or equivalent).
- Store labels/regions in metadata.

## US-6.2 Search or filter by object
**As a** user  
**I want** to search or filter the gallery by detected objects  
**So that** I can find “all photos with a dog” or “with cars”.

- Filter by tag/label (e.g. “dog”, “person”).
- Optional: show bounding boxes in detail view.

## US-6.3 Skip object detection
**As a** user  
**I want** to disable object detection  
**So that** the app runs without this feature and with lower resource use.

- Setting: “Object detection: Off”. No object indexing when off.
