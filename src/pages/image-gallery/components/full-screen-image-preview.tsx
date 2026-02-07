import { usePhotoLibrary } from "@/backend/photo-library-context";
import { Photo } from "@/backend/schemas";
import { ButtonWithTooltip } from "@/components/ui/button-with-tooltip";
import { PhotoComponent } from "@/components/photo-component";
import { openEditWindow } from "@/lib/windows";
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	HeartIcon,
	PencilIcon,
	Trash2Icon,
	XIcon,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { twMerge } from "tailwind-merge";

const variants = {
	enter: (direction: number) => ({
		x: direction > 0 ? 1000 : -1000,
		opacity: 0,
	}),
	center: {
		zIndex: 1,
		x: 0,
		opacity: 1,
	},
	exit: (direction: number) => ({
		zIndex: 0,
		x: direction < 0 ? 1000 : -1000,
		opacity: 0,
	}),
};

interface FullScreenImagePreviewProps {
	photo: Readonly<Photo>;
	setFullScreenPhoto: React.Dispatch<
		React.SetStateAction<Readonly<Photo> | null>
	>;
	fullScreenSrc: string | null;
	photos: Readonly<Photo[]>;
}
export default function FullScreenImagePreview({
	photo,
	setFullScreenPhoto,
	fullScreenSrc,
	photos,
}: FullScreenImagePreviewProps) {
	const [[page, direction], setPage] = useState([0, 0]);

	// Reset direction when component mounts or photo changes externally
	useEffect(() => {
		setPage([0, 0]);
	}, [setPage]);
	const currentIndex = photos.findIndex((p) => p.id === photo.id);
	const hasPrev = currentIndex > 0;
	const hasNext = currentIndex < photos.length - 1;

	const goToPrev = useCallback(() => {
		if (hasPrev) {
			setPage([page - 1, -1]);
			setFullScreenPhoto(photos[currentIndex - 1]);
		}
	}, [currentIndex, hasPrev, photos, setFullScreenPhoto, page]);

	const goToNext = useCallback(() => {
		if (hasNext) {
			setPage([page + 1, 1]);
			setFullScreenPhoto(photos[currentIndex + 1]);
		}
	}, [currentIndex, hasNext, photos, setFullScreenPhoto, page]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "ArrowLeft") {
				event.preventDefault();
				goToPrev();
			} else if (event.key === "ArrowRight") {
				event.preventDefault();
				goToNext();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [goToPrev, goToNext]);

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="fixed inset-0 z-50"
		>
			<button
				type="button"
				className="absolute inset-0 bg-black/90"
				onClick={() => setFullScreenPhoto(null)}
				aria-label="Close full screen"
			/>
			<div className="relative z-10 flex h-full items-center justify-center pointer-events-none">
				{/* Left navigation button */}
				{hasPrev && (
					<ButtonWithTooltip
						variant="ghost"
						size="icon"
						type="button"
						onClick={(event) => {
							event.stopPropagation();
							goToPrev();
						}}
						aria-label="Previous image"
						className="absolute left-4 z-20 rounded-full! pointer-events-auto text-white/80 hover:text-white hover:bg-white/10 h-12 w-12"
						tooltip="Previous image (←)"
					>
						<ChevronLeftIcon className="h-8 w-8" />
					</ButtonWithTooltip>
				)}

				{/* Right navigation button */}
				{hasNext && (
					<ButtonWithTooltip
						variant="ghost"
						size="icon"
						type="button"
						onClick={(event) => {
							event.stopPropagation();
							goToNext();
						}}
						aria-label="Next image"
						className="absolute right-4 z-20 rounded-full! pointer-events-auto text-white/80 hover:text-white hover:bg-white/10 h-12 w-12"
						tooltip="Next image (→)"
					>
						<ChevronRightIcon className="h-8 w-8" />
					</ButtonWithTooltip>
				)}
				<PhotoActions photo={photo} onDelete={() => setFullScreenPhoto(null)} />
				<motion.div
					layoutId={`photo-${photo.id}`}
					transition={{ type: "spring", damping: 30, stiffness: 300 }}
					className="relative flex items-center justify-center pointer-events-none w-full h-full max-w-full max-h-full"
				>
					<div className="relative flex h-full w-full items-center justify-center overflow-hidden pointer-events-none">
						<AnimatePresence initial={false} custom={direction}>
							<motion.div
								key={photo.id}
								custom={direction}
								variants={variants}
								initial="enter"
								animate="center"
								exit="exit"
								transition={{
									x: { type: "spring", stiffness: 300, damping: 30 },
									opacity: { duration: 0.2 },
								}}
								className="absolute flex items-center justify-center pointer-events-auto w-full h-full max-w-full max-h-full"
							>
								<PhotoComponent
									src={fullScreenSrc ?? photo.base64}
									alt={photo.filename}
									config={photo.config ?? {}}
									className="max-w-full max-h-[90vh]"
								/>
							</motion.div>
						</AnimatePresence>

						<div className="absolute right-4 top-4 flex items-center gap-2 text-white/80 z-20 pointer-events-auto">
							<span className="rounded font-mono mr-0.5 text-xs">ESC</span>
							<ButtonWithTooltip
								variant="ghost"
								size="icon-xs"
								type="button"
								onClick={(event) => {
									event.stopPropagation();
									setFullScreenPhoto(null);
								}}
								aria-label="Close full screen"
								className="text-white/80 transition-colors hover:text-white rounded-full!"
								tooltip="Close full screen"
							>
								<XIcon className="size-4" />
							</ButtonWithTooltip>
						</div>
					</div>
				</motion.div>
			</div>
		</motion.div>
	);
}

function PhotoActions({
	photo,
	onDelete,
}: {
	photo: Photo;
	onDelete?: () => void;
}) {
	const [isFavorite, setIsFavorite] = useState(photo.favorite);
	const { setPhotoFavorite, removePhotoFromLibrary } = usePhotoLibrary();
	return (
		<div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.3 }}
				className="flex items-center gap-4"
			>
				<div className="flex items-center gap-1 rounded-full p-2 bg-background/40 border border-border/10 shadow-2xl backdrop-blur-2xl">
					<ButtonWithTooltip
						variant="ghost"
						size="icon-sm"
						tooltip={isFavorite ? "Remove from favorites" : "Add to favorites"}
						className={
							"border-transparent! hover:bg-accent/10 text-accent-foreground bg-transparent!"
						}
						onClick={(e) => {
							e.stopPropagation();
							setIsFavorite((fav) => {
								void setPhotoFavorite(photo.id, !fav);

								return !fav;
							});
						}}
					>
						<HeartIcon
							className={twMerge(
								"size-5 transition-all duration-100",
								isFavorite
									? "fill-red-500 hover:text-red-600 stroke-red-500"
									: "fill-none",
							)}
						/>
					</ButtonWithTooltip>
					<ButtonWithTooltip
						variant="ghost"
						size="icon-sm"
						tooltip="Edit image"
						className="border-transparent! hover:bg-accent/10 text-accent-foreground bg-transparent!"
						onClick={(e) => {
							e.stopPropagation();
							void openEditWindow([photo]);
						}}
					>
						<PencilIcon />
					</ButtonWithTooltip>
					<div className="w-px h-4 bg-foreground/20 mx-1" />
					<ButtonWithTooltip
						variant="ghost"
						size="icon-sm"
						tooltip="Delete image"
						className="border-transparent! text-accent-foreground/70 hover:text-red-500 hover:bg-accent/10 bg-transparent!"
						onClick={async (e) => {
							e.stopPropagation();
							if (confirm("Are you sure you want to delete this image?")) {
								await removePhotoFromLibrary(photo);
								onDelete?.();
							}
						}}
					>
						<Trash2Icon />
					</ButtonWithTooltip>
				</div>
			</motion.div>
		</div>
	);
}
