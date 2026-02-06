import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { listen } from "@tauri-apps/api/event";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { convertFileSrc } from "@tauri-apps/api/core";
import type { Photo } from "../backend/commandStream";
import { getLibraryPhotos } from "@/lib/library";
import { openEditWindow } from "@/lib/windows";

export interface ImageItem {
	id: string;
	url: string;
	title: string;
}

function Gallery() {
	const navigate = useNavigate();
	const location = useLocation();
	const [photos, setPhotos] = useState<Photo[]>(location.state?.photos || []);

	// Listen for photos from the main window via events
	useEffect(() => {
		// Load photos from library on mount
		getLibraryPhotos().then(setPhotos).catch(console.error);

		// Also listen for photos sent via event
		const unlisten = listen<Photo[]>("gallery-photos", (event) => {
			setPhotos(event.payload);
		});

		return () => {
			unlisten.then((fn) => fn());
		};
	}, []);

	// Convert Photo[] to ImageItem[] for the gallery
	const images: ImageItem[] = photos.map((photo) => ({
		id: photo.id,
		url: convertFileSrc(photo.path),
		title: photo.filename,
	}));

	const [selectedImages, setSelectedImages] = useState<ImageItem[]>([]);

	const handleImageClick = (image: ImageItem) => {
		setSelectedImages((prev) => {
			const isSelected = prev.some((img) => img.id === image.id);
			if (isSelected) {
				// Deselect if already selected
				return prev.filter((img) => img.id !== image.id);
			} else if (prev.length < 2) {
				// Select if less than 2 images selected
				return [...prev, image];
			}
			// Max 2 images, don't add more
			return prev;
		});
	};

	const handleEditClick = () => {
		if (selectedImages.length > 0) {
			openEditWindow(selectedImages);
		}
	};

	const isSelected = (id: string) => selectedImages.some((img) => img.id === id);

	return (
		<main className="min-h-screen bg-background">

			<div className="p-4">
				<div className="flex items-center justify-between mb-4">
					<p className="text-sm text-muted-foreground">
						Select up to 2 images ({selectedImages.length}/2 selected)
					</p>
					<Button
						onClick={handleEditClick}
						disabled={selectedImages.length === 0}
					>
						Edit Selected
					</Button>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{images.map((image) => (
						<div
							key={image.id}
							onClick={() => handleImageClick(image)}
							className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${
								isSelected(image.id)
									? "border-primary ring-2 ring-primary ring-offset-2"
									: "border-transparent hover:border-muted-foreground/50"
							}`}
						>
							<img
								src={image.url}
								alt={image.title}
								className="w-full h-48 object-cover"
							/>
							<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
								<label className="text-white text-sm font-medium">
									{image.title}
								</label>
							</div>
							{isSelected(image.id) && (
								<div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
									<span className="text-white text-xs font-bold">
										{
											selectedImages.findIndex((img) => img.id === image.id) + 1
										}
									</span>
								</div>
							)}
						</div>
					))}
				</div>
			</div>
		</main>
	);
}

export default Gallery;
