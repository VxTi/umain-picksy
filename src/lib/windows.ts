import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { emit } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { SetLibraryResult } from "@/backend/events";

export async function openGalleryWindow(photos?: SetLibraryResult["photos"]) {
  // Hide the current (main) window
  const currentWindow = getCurrentWindow();
  await currentWindow.hide();

  // Check if window already exists
  const existing = await WebviewWindow.getByLabel("gallery");
  if (existing) {
    await existing.setFocus();
    if (photos) {
      await emit("gallery-photos", photos);
    }
    return existing;
  }

  // Create new gallery window
  const galleryWindow = new WebviewWindow("gallery", {
    url: "/gallery",
    title: "Gallery - Picksy",
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    center: true,
  });

  // Wait for window to be created, then send photos
  galleryWindow.once("tauri://created", async () => {
    console.log("Gallery window created");
    if (photos && photos.length > 0) {
      // Longer delay to ensure React component has mounted and listener is ready
      setTimeout(() => {
        console.log("Emitting gallery-photos with", photos.length, "photos");
        emit("gallery-photos", photos);
      }, 500);
    }
  });

  // When gallery window is closed, show the main window again
  galleryWindow.once("tauri://destroyed", async () => {
    console.log("Gallery window closed, showing main window");
    const mainWindow = await WebviewWindow.getByLabel("main");
    if (mainWindow) {
      await mainWindow.show();
      await mainWindow.setFocus();
    }
  });

  galleryWindow.once("tauri://error", (e) => {
    console.error("Failed to create gallery window:", e);
    // Show main window again on error
    currentWindow.show();
  });

  return galleryWindow;
}

export async function openEditWindow(images?: unknown) {
  // Hide the current (gallery) window
  const currentWindow = getCurrentWindow();
  await currentWindow.hide();

  const existing = await WebviewWindow.getByLabel("edit");
  if (existing) {
    await existing.setFocus();
    if (images) {
      await emit("edit-images", images);
    }
    return existing;
  }

  const editWindow = new WebviewWindow("edit", {
    url: "/edit",
    title: "Edit - Picksy",
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 500,
    center: true,
  });

  // Wait for window to be created, then send images
  editWindow.once("tauri://created", async () => {
    console.log("Edit window created");
    if (images) {
      // Longer delay to ensure React component has mounted and listener is ready
      setTimeout(() => {
        console.log("Emitting edit-images with", images);
        emit("edit-images", images);
      }, 500);
    }
  });

  // When edit window is closed, show the gallery window again
  editWindow.once("tauri://destroyed", async () => {
    console.log("Edit window closed, showing gallery window");
    const galleryWindow = await WebviewWindow.getByLabel("gallery");
    if (galleryWindow) {
      await galleryWindow.show();
      await galleryWindow.setFocus();
    }
  });

  editWindow.once("tauri://error", (e) => {
    console.error("Failed to create edit window:", e);
    // Show gallery window again on error
    currentWindow.show();
  });

  return editWindow;
}
