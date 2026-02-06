import { listen, type Event } from "@tauri-apps/api/event";

export interface PhotoMetadata {
  datetime?: string;
  latitude?: number;
  longitude?: number;
  make?: string;
  model?: string;
}

export type SyncStatus = "synced" | "pending" | "disconnected" | "unknown";

export interface Photo {
  base64: string;
  image_path: string;
  metadata?: PhotoMetadata;
  id: string;
  filename: string;
  sync_status?: SyncStatus;
}

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
