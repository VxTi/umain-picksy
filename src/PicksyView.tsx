import { usePhotoLibrary } from "@/backend/photo-library-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
	FolderIcon,
	ImagePlusIcon,
	ImagesIcon,
	Trash2Icon,
} from "lucide-react";
import { openGalleryWindow } from "@/lib/windows";
import { getCurrentWindow } from "@tauri-apps/api/window";

export default function PicksyView() {
	const {
		addPhotosToLibrary,
		loading,
		addPhotosFromFolder,
		clearLibrary,
		photos,
	} = usePhotoLibrary();
	return (
		<div
			onMouseDown={() => getCurrentWindow().startDragging()}
			className="h-full flex items-center justify-center bg-background"
		>
			<Card
				className="w-105 shadow-xl"
				onMouseDown={(e) => e.stopPropagation()}
			>
				<CardContent className="flex flex-col items-center gap-6 p-8">
					<div className="w-100 h-100 rounded-xl flex items-center justify-center text-sm text-muted-foreground">
						<img
							src="/picksy_logo_2.png"
							alt="logo"
							className="w-100 h-100 object-contain"
						/>
					</div>

					<div className="flex flex-col gap-2 w-full">
						<Button size="lg" className="w-full" onClick={addPhotosToLibrary}>
							<ImagePlusIcon /> Add photo
						</Button>

						<Button size="lg" className="w-full" onClick={addPhotosFromFolder}>
							<FolderIcon /> Select photo folder
						</Button>

						<Button
							size="lg"
							variant="outline"
							className="w-full"
							onClick={() => openGalleryWindow(photos)}
						>
							<ImagesIcon />
							View Library
						</Button>

						<Button
							size="lg"
							variant="destructive"
							className="w-full"
							onClick={clearLibrary}
						>
							<Trash2Icon />
							Clear library
						</Button>
					</div>

					<p className="text-xs text-muted-foreground">
						{photos.length} photos in library
					</p>
					{loading && (
						<div className="flex items-center gap-1 text-xs">
							<Spinner />
							<span>Photos are currently being added to the library.</span>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
