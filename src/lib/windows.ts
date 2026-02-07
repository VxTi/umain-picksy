import { Photo } from "@/backend/schemas";
import { AppLocation } from "@/lib/app-locations";
import { EventType } from "@/lib/events";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { emit } from "@tauri-apps/api/event";

const enum WindowLabel {
	EDIT = "edit",
}

export async function openEditWindow(images: Readonly<Photo[]>) {
	// Hide the main window
	const mainWindow = await WebviewWindow.getByLabel("main");
	if (mainWindow) {
		await mainWindow.hide();
	}

	const existing = await WebviewWindow.getByLabel(WindowLabel.EDIT);
	if (existing) {
		await existing.setFocus();
		await emit(EventType.EDIT_IMAGES, images);

		return existing;
	}

	const editWindow = new WebviewWindow(WindowLabel.EDIT, {
		url: AppLocation.EDITOR,
		title: "Edit - Picksy",
		width: 1400,
		height: 900,
		minWidth: 800,
		minHeight: 500,
		center: true,
		hiddenTitle: true,
		titleBarStyle: "overlay",
	});

	// Wait for window to be created, then send images
	await editWindow.once("tauri://created", async () => {
		console.log("Edit window created");
		if (images) {
			// Longer delay to ensure React component has mounted and listener is ready
			setTimeout(() => {
				console.log("Emitting edit-images with", images);
				emit(EventType.EDIT_IMAGES, images);
			}, 500);
		}
	});

	// When edit window is closed, show the main window again
	await editWindow.once("tauri://destroyed", async () => {
		console.log("Edit window closed, showing main window");
		const mainWindow = await WebviewWindow.getByLabel("main");
		if (mainWindow) {
			await mainWindow.show();
			await mainWindow.setFocus();
		}
	});

	await editWindow.once("tauri://error", (e) => {
		console.error("Failed to create edit window:", e);
		// Show main window again on error
		if (mainWindow) {
			mainWindow.show();
		}
	});

	return editWindow;
}
