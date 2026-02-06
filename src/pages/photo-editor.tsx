import { usePhotoLibrary } from "@/backend/photo-library-context";
import { Photo } from "@/backend/schemas";
import { EventType } from "@/lib/events";
import { SaveIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { Button } from "@/components/ui/button";
import { twMerge } from "tailwind-merge";
import PhotoEditorSidebar from "../components/photo-editor-sidebar";
import { PhotoComponent } from "./PhotoComponent";

function PhotoEditor() {
	const { photos, setPhotos, saveImageConfig } = usePhotoLibrary();
	const navigate = useNavigate();

	// Listen for images from the gallery window via events
	useEffect(() => {
		const unlisten = listen<Photo[]>(EventType.EDIT_IMAGES, (event) => {
			console.log("Edit received images via event:", event.payload.length);
			setPhotos(event.payload);
		});

		return () => {
			unlisten.then((fn) => fn());
		};
	}, []);

	const image1 = photos[0];
	const image2 = photos[1];

	// editing state for image 1
	const [brightness1, setBrightness1] = useState(100);
	const [blur1, setBlur1] = useState(0);
	const [saturation1, setSaturation1] = useState(100);

	// editing state for image 2
	const [brightness2, setBrightness2] = useState(100);
	const [blur2, setBlur2] = useState(0);
	const [saturation2, setSaturation2] = useState(100);

	// Initialize state from photos
	useEffect(() => {
		if (image1) {
			setBrightness1(image1.config?.brightness ?? 100);
			setBlur1(image1.config?.blur ?? 0);
			setSaturation1(image1.config?.saturation ?? 100);
		}
		if (image2) {
			setBrightness2(image2.config?.brightness ?? 100);
			setBlur2(image2.config?.blur ?? 0);
			setSaturation2(image2.config?.saturation ?? 100);
		}
	}, [image1?.id, image2?.id]);

	const [activeImageIndex, setActiveImageIndex] = useState(0);

	const handleSave = async () => {
		if (image1) {
			console.log(
				`Image 1 (${image1.id}) edits: blur=${blur1}, brightness=${brightness1}, saturation=${saturation1}`,
			);
			await saveImageConfig(image1.id, {
				brightness: brightness1,
				saturation: saturation1,
				blur: blur1,
			});
		}
		if (image2) {
			console.log(
				`Image 2 (${image2.id}) edits: blur=${blur2}, brightness=${brightness2}, saturation=${saturation2}`,
			);
			await saveImageConfig(image2.id, {
				brightness: brightness2,
				saturation: saturation2,
				blur: blur2,
			});
		}
	};

	const isDouble = photos.length === 2;

	return (
		<main className="h-screen bg-background flex flex-col overflow-hidden">
			<div className="p-4 shrink-0">
				<div className="flex items-center justify-between">
					<p className="text-sm text-muted-foreground">
						{photos.length > 0
							? `${photos.length} image(s) selected for editing`
							: "No images selected"}
					</p>

					<div className="flex gap-2">
						{isDouble && (
							<div className="flex bg-muted rounded-lg p-1">
								<Button
									variant={activeImageIndex === 0 ? "default" : "ghost"}
									size="sm"
									onClick={() => setActiveImageIndex(0)}
								>
									Image 1
								</Button>
								<Button
									variant={activeImageIndex === 1 ? "default" : "ghost"}
									size="sm"
									onClick={() => setActiveImageIndex(1)}
								>
									Image 2
								</Button>
							</div>
						)}
						<Button
							onClick={handleSave}
							className="rounded-full font-semibold text-white bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30 hover:scale-102 transition-all"
						>
							<SaveIcon className="size-4" /> Save edits
						</Button>
						{photos.length === 0 && (
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
					{image1 && (
						<div
							className={twMerge(
								"flex-1 h-full flex flex-col items-center justify-center transition-all duration-300",
								isDouble && activeImageIndex === 1
									? "opacity-50 scale-95"
									: "opacity-100 scale-100",
							)}
						>
							<PhotoComponent
								src={image1.base64}
								alt={image1.filename}
								brightness={brightness1}
								blur={blur1}
								saturation={saturation1}
							/>
							{isDouble && (
								<span className="mt-2 text-xs font-medium text-muted-foreground">
									Image 1
								</span>
							)}
						</div>
					)}

					{image2 && (
						<div
							className={`flex-1 h-full flex flex-col items-center justify-center transition-all duration-300 ${activeImageIndex === 0 ? "opacity-50 scale-95" : "opacity-100 scale-100"}`}
						>
							<PhotoComponent
								src={image2.base64}
								alt={image2.filename}
								brightness={brightness2}
								blur={blur2}
								saturation={saturation2}
							/>
							<span className="mt-2 text-xs font-medium text-muted-foreground">
								Image 2
							</span>
						</div>
					)}

					{!image1 && !image2 && (
						<div className="text-muted-foreground">No images to display</div>
					)}
				</div>

				<PhotoEditorSidebar
					brightness={activeImageIndex === 0 ? brightness1 : brightness2}
					saturation={activeImageIndex === 0 ? saturation1 : saturation2}
					blur={activeImageIndex === 0 ? blur1 : blur2}
					onBrightnessChange={
						activeImageIndex === 0 ? setBrightness1 : setBrightness2
					}
					onSaturationChange={
						activeImageIndex === 0 ? setSaturation1 : setSaturation2
					}
					onBlurChange={activeImageIndex === 0 ? setBlur1 : setBlur2}
				/>
			</div>
		</main>
	);
}

export default PhotoEditor;
