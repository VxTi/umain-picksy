import { Photo } from "@/backend/schemas";
import { ButtonWithTooltip } from "@/components/ui/button-with-tooltip";
import { PhotoComponent } from "@/components/photo-component";
import { XIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import React, { useEffect, useCallback } from "react";

interface FullScreenImagePreviewProps {
	fullScreenPhoto: Readonly<Photo> | null | undefined;
	setFullScreenPhoto: React.Dispatch<
		React.SetStateAction<Readonly<Photo> | null>
	>;
	fullScreenSrc: string | null;
	photos: ReadonlyArray<Photo>;
}

export default function FullScreenImagePreview({
	fullScreenPhoto,
	setFullScreenPhoto,
	fullScreenSrc,
	photos,
}: FullScreenImagePreviewProps) {
	const currentIndex = fullScreenPhoto
		? photos.findIndex((p) => p.id === fullScreenPhoto.id)
		: -1;

	const hasPrev = currentIndex > 0;
	const hasNext = currentIndex >= 0 && currentIndex < photos.length - 1;

	const goToPrev = useCallback(() => {
		if (hasPrev) {
			setFullScreenPhoto(photos[currentIndex - 1]);
		}
	}, [currentIndex, hasPrev, photos, setFullScreenPhoto]);

	const goToNext = useCallback(() => {
		if (hasNext) {
			setFullScreenPhoto(photos[currentIndex + 1]);
		}
	}, [currentIndex, hasNext, photos, setFullScreenPhoto]);

	useEffect(() => {
		if (!fullScreenPhoto) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "ArrowLeft") {
				e.preventDefault();
				goToPrev();
			} else if (e.key === "ArrowRight") {
				e.preventDefault();
				goToNext();
			} else if (e.key === "Escape") {
				setFullScreenPhoto(null);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [fullScreenPhoto, goToPrev, goToNext, setFullScreenPhoto]);

	if (!fullScreenPhoto) return null;

	return (
		<div className="fixed inset-0 z-50">
			<button
				type="button"
				className="absolute inset-0 bg-black/90"
				onClick={() => setFullScreenPhoto(null)}
				aria-label="Close full screen"
			/>
			<div className="relative z-10 flex h-full items-center justify-center p-6">
				{/* Top-right controls */}
				<div className="absolute right-4 top-4 flex items-center gap-2 text-white/80">
					<span className="rounded border border-white/30 px-2 py-0.5 text-xs">
						ESC
					</span>
					<ButtonWithTooltip
						variant="ghost"
						size="icon-xs"
						type="button"
						onClick={(event) => {
							event.stopPropagation();
							setFullScreenPhoto(null);
						}}
						aria-label="Close full screen"
						className="text-white/80 transition-colors hover:text-white"
						tooltip="Close full screen"
					>
						<XIcon className="h-5 w-5" />
					</ButtonWithTooltip>
				</div>

				{/* Left arrow */}
				{hasPrev && (
					<ButtonWithTooltip
						variant="ghost"
						size="icon"
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							goToPrev();
						}}
						aria-label="Previous image"
						className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 transition-colors hover:text-white hover:bg-white/10 h-12 w-12"
						tooltip="Previous (←)"
					>
						<ChevronLeftIcon className="h-8 w-8" />
					</ButtonWithTooltip>
				)}

				{/* Right arrow */}
				{hasNext && (
					<ButtonWithTooltip
						variant="ghost"
						size="icon"
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							goToNext();
						}}
						aria-label="Next image"
						className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 transition-colors hover:text-white hover:bg-white/10 h-12 w-12"
						tooltip="Next (→)"
					>
						<ChevronRightIcon className="h-8 w-8" />
					</ButtonWithTooltip>
				)}

				{/* Image counter */}
				{photos.length > 1 && (
					<div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/50 px-3 py-1 rounded-full">
						{currentIndex + 1} / {photos.length}
					</div>
				)}

				<PhotoComponent
					src={fullScreenSrc ?? fullScreenPhoto.base64}
					alt={fullScreenPhoto.filename}
					config={fullScreenPhoto.config ?? {}}
				/>
			</div>
		</div>
	);
}
