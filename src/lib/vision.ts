import { Result } from "@/backend/commands";
import { Photo } from "@/backend/commandStream";
import { invoke, InvokeError } from "@/backend/invoke";
import { invoke as invokeTauri } from "@tauri-apps/api/core";
import { Effect } from "effect/Effect";

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
 * Extracts metadata from an image at the given path.
 * @param path - The absolute path to the image file.
 * @returns A promise that resolves to the image metadata.
 */
export async function analyzeImageMetadata(
  path: string,
): Promise<ImageMetadata> {
  console.log("Path:", path);
  return await invokeTauri<ImageMetadata>("analyze_image_metadata", { path });
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
  candidateImagePaths: string[],
): Promise<FaceRecognitionResult> {
  return await invokeTauri<FaceRecognitionResult>("recognize_faces", {
    targetImagePath,
    targetName,
    candidateImagePaths,
  });
}

/**
 * Opens a native dialog to select a source folder and returns a list of image file paths.
 * @returns A promise that resolves to a list of image paths or null if cancelled.
 */
export async function selectSourceFolder(): Promise<Photo[] | null> {
  return await invokeTauri<Photo[] | null>("select_images_directory");
}

export function addPhotosToLibrary(): Effect<Result<"add_photo_to_library">, InvokeError> {
  return invoke("add_photo_to_library", {});
}
