import { usePhotoLibrary } from "@/backend/photo-library-context";
import type { Photo, PhotoConfig } from "@/backend/schemas";
import { EventType } from "@/lib/events";
import Header from "@/pages/photo-editor/components/header";
import { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { twMerge } from "tailwind-merge";
import PhotoEditorSidebar from "../../components/photo-editor-sidebar";
import { PhotoComponent } from "@/components/photo-component";

export default function PhotoEditor() {
	const { getFullResAttachment } = usePhotoLibrary();

	const [editingPhotos, setEditingPhotos] = useState<Readonly<Photo[]>>([]);
	const [fullResById, setFullResById] = useState<Record<string, string>>({});

	// Listen for images from the gallery window via events
	useEffect(() => {
		const unlisten = listen<Photo[]>(EventType.EDIT_IMAGES, (event) => {
			console.log("Edit received images via event:", event.payload.length);
			setEditingPhotos(event.payload);
		});

		return () => {
			unlisten.then((fn) => fn());
		};
	}, []);

	const [activeImageIndex, setActiveImageIndex] = useState(0);

	useEffect(() => {
		let cancelled = false;
		const pending = editingPhotos.filter(
			(photo) => Boolean(photo.full_res_attachment) && !fullResById[photo.id],
		);
		if (pending.length === 0) return;

		const fetchAll = async () => {
			for (const photo of pending) {
				try {
					const src = await getFullResAttachment(photo.id);
					if (!cancelled && src) {
						setFullResById((prev) => ({ ...prev, [photo.id]: src }));
					}
				} catch {
					// Ignore fetch errors, fallback stays on thumbnail
				}
			}
		};

		void fetchAll();

		return () => {
			cancelled = true;
		};
	}, [editingPhotos, fullResById, getFullResAttachment]);

	const onConfigChange = (config: PhotoConfig) => {
		setEditingPhotos((prev) =>
			prev.map((photo, i) =>
				i === activeImageIndex ? { ...photo, config } : photo,
			),
		);
	};

	const hasEditablePhotos = editingPhotos.length > 0;

	return (
		<main className="h-screen bg-background flex flex-col overflow-hidden">
			<Header
				editingPhotos={editingPhotos}
				activeImageIndex={activeImageIndex}
				setActiveImageIndex={setActiveImageIndex}
			/>

			<div className="flex flex-1 overflow-hidden bg-black/5">
				{/* Image Preview Area */}
				<div className="flex-1 flex justify-center items-center  p-4 gap-4 overflow-hidden flex-wrap *:basis-50">
					{editingPhotos.map((photo, i) => (
						<div
							key={photo.id}
							className={twMerge(
								"flex-1 h-full flex flex-col items-center justify-center",
							)}
						>
							<PhotoComponent
								src={fullResById[photo.id] ?? photo.base64}
								alt={photo.filename}
								config={photo.config ?? {}}
								onClick={() => setActiveImageIndex(i)}
								className={twMerge(
									"transition-all duration-300",
									editingPhotos.length > 1 && activeImageIndex !== i
										? "opacity-50 scale-90"
										: "opacity-100 scale-100",
								)}
							/>
							{editingPhotos.length > 1 && (
								<span className="mt-2 text-xs font-medium text-muted-foreground">
									{photo.filename}
								</span>
							)}
						</div>
					))}

					{!hasEditablePhotos && (
						<div className="text-muted-foreground">No images to display</div>
					)}
				</div>

				<PhotoEditorSidebar
					config={editingPhotos[activeImageIndex]?.config ?? {}}
					onConfigChange={onConfigChange}
				/>
			</div>
		</main>
	);
}
