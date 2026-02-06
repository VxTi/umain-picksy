import { invoke } from "@tauri-apps/api/core";

/**
 * Metadata extracted from an image.
 */
export interface ImageMetadata {
  datetime?: string;
  latitude?: number;
  longitude?: number;
  make?: string;
  model?: string;
}

/**
 * Result of a face recognition operation.
 */
export interface FaceRecognitionResult {
  matched_paths: string[];
}

/**
 * Response from selecting a source folder.
 */
export interface SelectionResponse {
  path: string;
  image_count: number;
}

/**
 * Extracts metadata from an image at the given path.
 * @param path - The absolute path to the image file.
 * @returns A promise that resolves to the image metadata.
 */
export async function analyzeImageMetadata(path: string): Promise<ImageMetadata> {
  return await invoke<ImageMetadata>("analyze_image_metadata", { path });
}

/**
 * Recognizes faces in candidate images that match the target image.
 * @param targetImagePath - Path to the reference image.
 * @param targetName - Name associated with the face (unused in basic implementation).
 * @param candidateImagePaths - List of image paths to search through.
 * @returns A promise that resolves to a list of matching image paths.
 */
export async function recognizeFaces(
  targetImagePath: string,
  targetName: string,
  candidateImagePaths: string[]
): Promise<FaceRecognitionResult> {
  return await invoke<FaceRecognitionResult>("recognize_faces", {
    targetImagePath,
    targetName,
    candidateImagePaths,
  });
}

/**
 * Opens a native dialog to select a source folder and returns its path and image count.
 * @returns A promise that resolves to SelectionResponse or null if cancelled.
 */
export async function selectSourceFolder(): Promise<SelectionResponse | null> {
  return await invoke<SelectionResponse | null>("select_source_folder");
}
