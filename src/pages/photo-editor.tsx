import { usePhotoLibrary }          from '@/backend/photo-library-context';
import { EventType }                from "@/lib/events";
import { SaveIcon }                 from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect }      from "react";
import { listen }                   from "@tauri-apps/api/event";
import { Button }                   from "@/components/ui/button";
import { twMerge }                  from "tailwind-merge";
import PhotoEditorSidebar           from "../components/photo-editor-sidebar";
import { PhotoComponent }           from "./PhotoComponent";
import type { ImageItem }           from "./Gallery";

function PhotoEditor() {
	const { photos } = usePhotoLibrary();
	const location = useLocation();
	const navigate = useNavigate();
	const [images, setImages] = useState<ImageItem[]>(
		(location.state?.images as ImageItem[]) || [],
	);

	// Listen for images from the gallery window via events
	useEffect(() => {
		const unlisten = listen<ImageItem[]>(EventType.EDIT_IMAGES, (event) => {
			console.log("Edit received images via event:", event.payload.length);
			setImages(event.payload);
		});

		return () => {
			unlisten.then((fn) => fn());
		};
	}, []);

	// editing state for image 1
	const [brightness1, setBrightness1] = useState(100);
	const [blur1, setBlur1] = useState(0);
	const [saturation1, setSaturation1] = useState(100);

	// editing state for image 2
	const [brightness2, setBrightness2] = useState(100);
	const [blur2, setBlur2] = useState(0);
	const [saturation2, setSaturation2] = useState(100);

	const [activeImageIndex, setActiveImageIndex] = useState(0);

	const image1 = photos[0];
	const image2 = photos[1];

	const handleSave = () => {
		if (image1) {
			console.log(
				`Image 1 (${image1.id}) edits: blur=${blur1}, brightness=${brightness1}, saturation=${saturation1}`,
			);
		}
		if (image2) {
			console.log(
				`Image 2 (${image2.id}) edits: blur=${blur2}, brightness=${brightness2}, saturation=${saturation2}`,
			);
		}
	};

	const isDouble = images.length === 2;

	return (
		<main className="h-screen bg-background flex flex-col overflow-hidden">
			<div className="p-4 shrink-0">
				<div className="flex items-center justify-between">
					<p className="text-sm text-muted-foreground">
						{images.length > 0
							? `${images.length} image(s) selected for editing`
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
						{images.length === 0 && (
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
