import { invoke } from "@tauri-apps/api/core";
import type { Photo } from "@/backend/commandStream";

export async function getLibraryPhotos(): Promise<Photo[]> {
	return await invoke<Photo[]>("get_library_photos");
}

export async function clearLibrary(): Promise<void> {
	await invoke("clear_library");
}
