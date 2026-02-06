import type { Photo } from "@/backend/schemas";
import { listen, type Event } from "@tauri-apps/api/event";

export type { Photo };

export type BackendCommand = {
	command: "SetLibrary";
	photos: Photo[];
};

export const BACKEND_COMMAND_EVENT = "backend_command";

export const listenToBackendCommands = async (
	handler: (command: BackendCommand) => void,
) => {
	return await listen<BackendCommand>(
		BACKEND_COMMAND_EVENT,
		(event: Event<BackendCommand>) => handler(event.payload),
	);
};
