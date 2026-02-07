# Content Aware Similarity Index

Idea: find similar pictures, by content, time, GPS, etc.

Search: extract id of image visually similar image similar id crop rotate.
Result:

Extracting the ID, location, or metadata of a visually similar image, particularly when that image is cropped or rotated, requires advanced Content-Based Image Retrieval (CBIR) techniques. The process involves generating a unique, rotation-invariant hash or vector descriptor for the image and comparing it against a database.
Key Methods to Find and Extract Image Data (Similar, Rotated, Cropped)

- Google Lens/Search: For online images, Google Lens allows you to drag a selection box to crop the specific area of interest, which helps isolate the object for better matching. The results often show where the exact image, or a variation of it, appears online.
- Perceptual Hashing (pHash): To find rotated or modified images, pHash is more effective than standard file hashes because it generates a signature based on the visual content rather than the pixel data.
- SIFT/SURF Algorithms: For detecting cropped or rotated versions, Scale-Invariant Feature Transform (SIFT) is highly effective as it computes descriptors that are invariant to scaling, orientation, and, to some extent, illumination.
- Fourier-Mellin Transform: This is specialized for identifying images that have been cropped, rotated, and resized, allowing you to determine the exact transformation needed to match the original.
- FAISS (Facebook AI Similarity Search): An open-source library that allows for efficient similarity search of high-dimensional vectors (often generated via deep learning models like CLIP).

## Followup:

- pHash is available in https://github.com/abonander/img_hash (fast)
- FAISS bindings for Rust https://docs.rs/faiss (more work)
