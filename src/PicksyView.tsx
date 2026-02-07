import { usePhotoLibrary } from "@/backend/photo-library-context";
import { ButtonWithTooltip } from "@/components/ui/button-with-tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
	FolderIcon,
	ImagePlusIcon,
	ImagesIcon,
	Trash2Icon,
} from "lucide-react";
import { SetLibraryResult } from "./backend/events";
import { openGalleryWindow } from "@/lib/windows";
import { getCurrentWindow } from "@tauri-apps/api/window";

type PicksyViewProps = {
	photos: SetLibraryResult["photos"];
	onSelectFolder: () => void;
	onAddPhoto: () => void;
	onClearLibrary: () => void;
};

export default function PicksyView({
	photos,
	onSelectFolder,
	onAddPhoto,
	onClearLibrary,
}: PicksyViewProps) {
	const { loading } = usePhotoLibrary();
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
						<ButtonWithTooltip
							size="lg"
							className="w-full"
							onClick={onAddPhoto}
							tooltip="Add a new photo to the library"
						>
							<ImagePlusIcon /> Add photo
						</ButtonWithTooltip>

						<ButtonWithTooltip
							size="lg"
							className="w-full"
							onClick={onSelectFolder}
							tooltip="Select a folder to import photos from"
						>
							<FolderIcon /> Select photo folder
						</ButtonWithTooltip>

						<ButtonWithTooltip
							size="lg"
							variant="outline"
							className="w-full"
							onClick={() => openGalleryWindow(photos)}
							tooltip="Open the gallery to view all photos"
						>
							<ImagesIcon />
							View Library
						</ButtonWithTooltip>

						<ButtonWithTooltip
							size="lg"
							variant="destructive"
							className="w-full"
							onClick={onClearLibrary}
							tooltip="Remove all photos from the library"
						>
							<Trash2Icon />
							Clear library
						</ButtonWithTooltip>
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
