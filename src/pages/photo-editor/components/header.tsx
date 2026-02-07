import { usePhotoLibrary } from "@/backend/photo-library-context";
import { Photo } from "@/backend/schemas";
import { ThemeToggle } from "@/components/theme-toggle";
import { ButtonWithTooltip } from "@/components/ui/button-with-tooltip";
import { AppLocation } from "@/lib/app-locations";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { SaveIcon } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface HeaderProps {
	editingPhotos: Readonly<Photo[]>;
	activeImageIndex: number;
	setActiveImageIndex: React.Dispatch<React.SetStateAction<number>>;
}

export default function Header({
	editingPhotos,
	activeImageIndex,
	setActiveImageIndex,
}: HeaderProps) {
	const hasEditablePhotos = editingPhotos.length > 0;
	const navigate = useNavigate();
	return (
		<div
			className="p-4 shrink-0"
			onMouseDown={() => getCurrentWindow().startDragging()}
		>
			<div className="flex items-center justify-between">
				<p className="text-sm text-muted-foreground select-none pointer-events-none">
					{hasEditablePhotos
						? `${editingPhotos.length} image(s) selected for editing`
						: "No images selected"}
				</p>

				<div className="flex gap-2">
					<ThemeToggle />
					{editingPhotos.length > 1 && (
						<div
							className="flex bg-muted rounded-lg p-1"
							onMouseDown={(e) => e.stopPropagation()}
						>
							{editingPhotos.map((photo, i) => (
								<ButtonWithTooltip
									key={photo.id}
									variant={activeImageIndex === i ? "default" : "ghost"}
									size="sm"
									onClick={() => setActiveImageIndex(i)}
									tooltip={`Edit Image ${i + 1}: ${photo.filename}`}
								>
									Image {i + 1}
								</ButtonWithTooltip>
							))}
						</div>
					)}
					<SaveEditsButton editingPhotos={editingPhotos} />
					{!hasEditablePhotos && (
						<ButtonWithTooltip
							variant="outline"
							onClick={() => navigate(AppLocation.HOME)}
							onMouseDown={(e) => e.stopPropagation()}
							tooltip="Return to the gallery view"
						>
							Go to Gallery
						</ButtonWithTooltip>
					)}
				</div>
			</div>
		</div>
	);
}

function SaveEditsButton({
	editingPhotos,
}: {
	editingPhotos: Readonly<Photo[]>;
}) {
	const { saveImageConfig } = usePhotoLibrary();

	const handleSave = async () => {
		for (const photo of editingPhotos) {
			await saveImageConfig(photo.id, photo.config ?? {});
		}
		toast.info("Images saved successfully");
	};

	return (
		<button
			onMouseDown={(e) => e.stopPropagation()}
			onClick={handleSave}
			className="flex items-center gap-1 rounded-full py-1! font-semibold shadow-lg transition-all text-white! bg-blue-400! hover:bg-blue-100 border border-blue-400"
		>
			<SaveIcon className="size-4" />
			<span className="text-white!"> Save changes</span>
		</button>
	);
}
