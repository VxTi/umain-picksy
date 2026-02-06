# Task: US-3.1 Auto-group by content (Backend)

## Description
Photos grouped automatically by visual/content similarity.

## Technical Details
- **Technology**: Use a local ML model (e.g., CLIP or similar embeddings via `ort` - ONNX Runtime) to generate vectors for each image.
- **Algorithm**: DBSCAN or K-Means clustering on embeddings to identify similar photos/bursts.
- **Tauri Command**: `run_auto_grouping`
