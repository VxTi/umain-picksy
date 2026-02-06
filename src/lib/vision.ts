import { CommandType, Result } from "@/backend/commands";
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
 * Extracts metadata from an image at the given path.
 * @param path - The absolute path to the image file.
 * @returns A promise that resolves to the image metadata.
 */
export async function analyzeImageMetadata(
	path: string,
): Promise<ImageMetadata> {
	return await invokeTauri<ImageMetadata>("analyze_image_metadata", { path });
}

/**
 * Opens a native dialog to select a source folder and returns a list of image file paths.
 * @returns A promise that resolves to a list of image paths or null if cancelled.
 */
export async function selectSourceFolder(): Promise<Photo[] | null> {
	return await invokeTauri<Photo[] | null>("select_images_directory");
}

export function addPhotosToLibrary(): Effect<
	Result<CommandType.ADD_PHOTOS_TO_LIBRARY>,
	InvokeError
> {
	return invoke(CommandType.ADD_PHOTOS_TO_LIBRARY, {});
}
