import { usePhotoLibrary } from "@/backend/photo-library-context";
import { Photo } from "@/backend/schemas";
import { EventType } from "@/lib/events";
import { SaveIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import PhotoEditorSidebar from "../components/photo-editor-sidebar";
import { PhotoComponent } from "./PhotoComponent";

function PhotoEditor() {
	const { saveImageConfig } = usePhotoLibrary();
	const navigate = useNavigate();

	const [editingPhotos, setEditingPhotos] = useState<Readonly<Photo[]>>([]);

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

	const handleSave = async () => {
		for (const photo of editingPhotos) {
			await saveImageConfig(photo.id, {
				brightness: photo.config?.brightness ?? 100,
				saturation: photo.config?.saturation ?? 100,
				blur: photo.config?.blur ?? 0,
			});
		}
		toast.info("Images saved successfully");
	};

	const onBrightnessChange = (brightness: number) => {
		setEditingPhotos((prev) =>
			prev.map((photo, i) =>
				i === activeImageIndex
					? { ...photo, config: { ...photo.config, brightness } }
					: photo,
			),
		);
	};

	const onSaturationChange = (saturation: number) => {
		setEditingPhotos((prev) =>
			prev.map((photo, i) =>
				i === activeImageIndex
					? { ...photo, config: { ...photo.config, saturation } }
					: photo,
			),
		);
	};

	const onBlurChange = (blur: number) => {
		setEditingPhotos((prev) =>
			prev.map((photo, i) =>
				i === activeImageIndex
					? { ...photo, config: { ...photo.config, blur } }
					: photo,
			),
		);
	};

	const hasEditablePhotos = editingPhotos.length > 0;

	return (
		<main className="h-screen bg-background flex flex-col overflow-hidden">
			<div className="p-4 shrink-0">
				<div className="flex items-center justify-between">
					<p className="text-sm text-muted-foreground">
						{hasEditablePhotos
							? `${editingPhotos.length} image(s) selected for editing`
							: "No images selected"}
					</p>

					<div className="flex gap-2">
						{editingPhotos.length > 1 && (
							<div className="flex bg-muted rounded-lg p-1">
								{editingPhotos.map((photo, i) => (
									<Button
										key={photo.id}
										variant={activeImageIndex === i ? "default" : "ghost"}
										size="sm"
										onClick={() => setActiveImageIndex(i)}
									>
										Image {i + 1}
									</Button>
								))}
							</div>
						)}
						<Button
							onClick={handleSave}
							className="rounded-full font-semibold text-white bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30 hover:scale-102 transition-all"
						>
							<SaveIcon className="size-4" /> Save edits
						</Button>
						{!hasEditablePhotos && (
							<Button variant="outline" onClick={() => navigate("/gallery")}>
								Go to Gallery
							</Button>
						)}
					</div>
				</div>
			</div>

			<div className="flex flex-1 overflow-hidden bg-black/5">
				{/* Image Preview Area */}
				<div className="flex-1 flex justify-center items-center  p-4 gap-4 overflow-hidden flex-wrap *:basis-50">
					{editingPhotos.map((photo, i) => (
						<div
							key={photo.id}
							className={twMerge(
								"flex-1 h-full flex flex-col items-center justify-center transition-all duration-300",
								editingPhotos.length > 1 && activeImageIndex === i
									? "opacity-100 scale-100"
									: "opacity-50 scale-90",
							)}
						>
							<PhotoComponent
								src={photo.base64}
								alt={photo.filename}
								config={photo.config ?? {}}
							/>
							{editingPhotos.length > 1 && (
								<span className="mt-2 text-xs font-medium text-muted-foreground">
									Image {i}
								</span>
							)}
						</div>
					))}

					{!hasEditablePhotos && (
						<div className="text-muted-foreground">No images to display</div>
					)}
				</div>

				<PhotoEditorSidebar
					brightness={
						editingPhotos[activeImageIndex]?.config?.brightness ?? 100
					}
					saturation={
						editingPhotos[activeImageIndex]?.config?.saturation ?? 100
					}
					blur={editingPhotos[activeImageIndex]?.config?.blur ?? 0}
					onBrightnessChange={onBrightnessChange}
					onSaturationChange={onSaturationChange}
					onBlurChange={onBlurChange}
				/>
			</div>
		</main>
	);
}

export default PhotoEditor;
