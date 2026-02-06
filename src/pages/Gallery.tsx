import { listen } from "@tauri-apps/api/event";
import { getLibraryPhotos } from "@/lib/library";
import { openEditWindow } from "@/lib/windows";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { invoke } from "@tauri-apps/api/core";
import type { Photo } from "@/backend/commandStream";

export interface ImageItem {
	id: string;
	url: string;
	title: string;
}

function Gallery() {
	const [photos, setPhotos] = useState<Photo[]>([]);
	const [loading, setLoading] = useState(true);

	// Listen for photos from the main window via events
	useEffect(() => {
		// Load photos from library on mount
		getLibraryPhotos()
			.then((loadedPhotos) => {
				console.log("Gallery loaded photos from library:", loadedPhotos.length);
				setPhotos(loadedPhotos);
				setLoading(false);
			})
			.catch((err) => {
				console.error("Failed to load photos:", err);
				setLoading(false);
			});

		// Also listen for photos sent via event
		const unlisten = listen<Photo[]>("gallery-photos", (event) => {
			console.log("Gallery received photos via event:", event.payload.length);
			setPhotos(event.payload);
			setLoading(false);
		});

		return () => {
			unlisten.then((fn) => fn());
		};
	}, []);

	// Convert Photo[] to ImageItem[] for the gallery
	const images: ImageItem[] = photos.map((photo) => ({
		id: photo.id,
		url: photo.base64,
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

	const handleDeleteClick = async () => {
		if (selectedImages.length === 0) return;

		try {
			for (const image of selectedImages) {
				await invoke("remove_image_from_album", { id: image.id });
			}
			// Update local state by removing the deleted photos
			const deletedIds = new Set(selectedImages.map((img) => img.id));
			setPhotos((prev) => prev.filter((p) => !deletedIds.has(p.id)));
			setSelectedImages([]);
		} catch (error) {
			console.error("Failed to delete images:", error);
		}
	};

	const isSelected = (id: string) =>
		selectedImages.some((img) => img.id === id);

	return (
		<main className="min-h-screen bg-background">
			<div className="p-4">
				<div className="flex items-center justify-between mb-4">
					<p className="text-sm text-muted-foreground">
						Select up to 2 images ({selectedImages.length}/2 selected)
					</p>
					<div className="flex gap-2">
						{selectedImages.length > 0 && (
							<Button
								variant="destructive"
								onClick={handleDeleteClick}
								disabled={selectedImages.length === 0}
							>
								<Trash2Icon />
								Delete{" "}
								{selectedImages.length === 1
									? "image"
									: `${selectedImages.length} images`}
							</Button>
						)}
						<Button
							onClick={handleEditClick}
							disabled={selectedImages.length === 0}
						>
							<PencilIcon />
							Edit Selected
						</Button>
					</div>
				</div>

				{loading ? (
					<p className="text-center text-muted-foreground">Loading photos...</p>
				) : (
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
								<div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-2">
									<p className="text-white text-sm font-medium">
										{image.title}
									</p>
								</div>
								{isSelected(image.id) && (
									<div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
										<span className="text-white text-xs font-bold">
											{selectedImages.findIndex((img) => img.id === image.id) +
												1}
										</span>
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</main>
	);
}

export default Gallery;
