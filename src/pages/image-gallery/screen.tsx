import { usePhotoLibrary } from "@/backend/photo-library-context";
import ScreenWrapper from "@/components/screen-wrapper";
import FullScreenImagePreview from "@/pages/image-gallery/components/full-screen-image-preview";
import Navigator from "@/pages/image-gallery/components/navigator";
import StackPreview from "@/pages/image-gallery/components/stack-preview";
import { PhotoComponent } from "@/components/photo-component";
import {
	HeartIcon,
	Layers2Icon,
	LayersIcon,
	LayersPlusIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, MouseEvent, SetStateAction } from "react";
import { ButtonWithTooltip } from "@/components/ui/button-with-tooltip";
import type { Photo } from "@/backend/commandStream";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import { AnimatePresence, motion } from "framer-motion";

export default function ImageGallery() {
	const { photos, setPhotoStack, clearPhotoStack, getFullResAttachment } =
		usePhotoLibrary();

	const [authorFilter, setAuthorFilter] = useState("all");

	const [selectedImages, setSelectedImages] = useState<Readonly<Photo[]>>([]);
	const [fullScreenPhoto, setFullScreenPhoto] = useState<Photo | null>(null);
	const [fullScreenSrc, setFullScreenSrc] = useState<string | null>(null);
	const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
	const [openStackId, setOpenStackId] = useState<string | null>(null);

	const filteredPhotos =
		authorFilter === "all"
			? photos
			: photos.filter((photo) => photo.author_peer_id === authorFilter);
	const stackGroups = useMemo(() => {
		const groups = new Map<string, Photo[]>();
		for (const photo of filteredPhotos) {
			if (!photo.stack_id) continue;
			const existing = groups.get(photo.stack_id) ?? [];
			existing.push(photo);
			groups.set(photo.stack_id, existing);
		}
		return groups;
	}, [filteredPhotos]);
	const displayPhotos = useMemo(() => {
		const result: Photo[] = [];
		const seenStacks = new Set<string>();
		for (const photo of filteredPhotos) {
			const stackId = photo.stack_id;
			if (!stackId) {
				result.push(photo);
				continue;
			}
			if (seenStacks.has(stackId)) {
				continue;
			}
			const stack = stackGroups.get(stackId) ?? [];
			const primary =
				stack.find((item) => item.is_stack_primary) ?? stack[0] ?? photo;
			result.push(primary);
			seenStacks.add(stackId);
		}
		return result;
	}, [filteredPhotos, stackGroups]);
	const filteredPhotoIds = useMemo(
		() => displayPhotos.map((photo) => photo.id),
		[displayPhotos],
	);
	const openStackPhotos = useMemo(() => {
		if (!openStackId) return [];
		return stackGroups.get(openStackId) ?? [];
	}, [openStackId, stackGroups]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: reset selection on filter change
	useEffect(() => {
		setSelectedImages([]);
	}, [authorFilter]);

	useEffect(() => {
		setSelectedImages((prev) =>
			prev.filter((photo) => filteredPhotoIds.includes(photo.id)),
		);
	}, [filteredPhotoIds]);

	const selectedStackIds = useMemo(
		() =>
			Array.from(
				new Set(
					selectedImages
						.map((photo) => photo.stack_id)
						.filter((id): id is string => Boolean(id)),
				),
			),
		[selectedImages],
	);
	const selectedOnlyStack =
		selectedImages.length > 0 &&
		selectedStackIds.length === 1 &&
		selectedImages.every((photo) => photo.stack_id === selectedStackIds[0]);
	const showStackAction = selectedImages.length >= 2 || selectedOnlyStack;

	const stackIcon = selectedOnlyStack
		? LayersIcon
		: selectedStackIds.length === 1
			? LayersPlusIcon
			: Layers2Icon;

	const stackActionLabel = selectedOnlyStack
		? "Unstack"
		: selectedStackIds.length === 1
			? "Add to stack"
			: "Create stack";

	const handleCreateStack = useCallback(() => {
		if (selectedImages.length < 1) return;
		const selectedIds = selectedImages.map((photo) => photo.id);

		if (selectedOnlyStack) {
			const stackId = selectedStackIds[0];
			const stackIds =
				stackGroups.get(stackId)?.map((photo) => photo.id) ?? selectedIds;
			void clearPhotoStack(stackIds)
				.then(() => {
					setSelectedImages([]);
					setActivePhotoId(null);
				})
				.catch(() => toast.error("Failed to unstack images."));
			return;
		}

		const stackId =
			selectedStackIds.length === 1 ? selectedStackIds[0] : crypto.randomUUID();
		const primaryId =
			selectedStackIds.length === 1
				? (selectedImages.find((photo) => photo.is_stack_primary)?.id ??
					selectedImages[0].id)
				: (activePhotoId ?? selectedImages[0].id);
		void setPhotoStack(selectedIds, stackId, primaryId)
			.then(() => {
				setSelectedImages([]);
				setActivePhotoId(primaryId);
			})
			.catch(() => toast.error("Failed to update stack."));
	}, [
		activePhotoId,
		clearPhotoStack,
		selectedImages,
		selectedOnlyStack,
		selectedStackIds,
		setPhotoStack,
		stackGroups,
	]);

	useEffect(() => {
		if (activePhotoId && !filteredPhotoIds.includes(activePhotoId)) {
			setActivePhotoId(null);
		}
	}, [activePhotoId, filteredPhotoIds]);

	useEffect(() => {
		if (openStackId && !stackGroups.has(openStackId)) {
			setOpenStackId(null);
		}
	}, [openStackId, stackGroups]);

	useEffect(() => {
		if (!fullScreenPhoto) {
			setFullScreenSrc(null);
			return;
		}

		let cancelled = false;
		setFullScreenSrc(null);

		if (!fullScreenPhoto.full_res_attachment) {
			console.log("no full res attachment for", fullScreenPhoto.id);
			return () => {
				cancelled = true;
			};
		}

		console.log("fetching full res attachment for", fullScreenPhoto.id);
		void getFullResAttachment(fullScreenPhoto.id)
			.then((src) => {
				if (!cancelled && src) {
					setFullScreenSrc(src);
				}
			})
			.catch((e) => {
				console.error(
					"error fetching full res attachment for",
					fullScreenPhoto.id,
					e,
				);
			});

		return () => {
			cancelled = true;
		};
	}, [fullScreenPhoto, getFullResAttachment]);

	useEffect(() => {
		if (!fullScreenPhoto && !openStackId) return;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setFullScreenPhoto(null);
				setOpenStackId(null);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [fullScreenPhoto, openStackId]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (
				event.target instanceof HTMLElement &&
				(event.target.isContentEditable ||
					["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName))
			) {
				return;
			}
			if (
				![
					"ArrowLeft",
					"ArrowRight",
					"ArrowUp",
					"ArrowDown",
					"Home",
					"End",
				].includes(event.key)
			) {
				return;
			}
			if (displayPhotos.length === 0) return;

			event.preventDefault();

			const getGridColumns = () => {
				const width = window.innerWidth;
				if (width >= 1024) return 4;
				if (width >= 768) return 3;
				return 2;
			};

			const currentId =
				selectedImages[selectedImages.length - 1]?.id ?? displayPhotos[0].id;
			const currentIndex = Math.max(0, filteredPhotoIds.indexOf(currentId));
			const columns = getGridColumns();
			let nextIndex = currentIndex;

			switch (event.key) {
				case "ArrowLeft":
					nextIndex = currentIndex - 1;
					break;
				case "ArrowRight":
					nextIndex = currentIndex + 1;
					break;
				case "ArrowUp":
					nextIndex = currentIndex - columns;
					break;
				case "ArrowDown":
					nextIndex = currentIndex + columns;
					break;
				case "Home":
					nextIndex = 0;
					break;
				case "End":
					nextIndex = displayPhotos.length - 1;
					break;
			}

			nextIndex = Math.min(Math.max(nextIndex, 0), displayPhotos.length - 1);
			const nextPhoto = displayPhotos[nextIndex];
			setSelectedImages([nextPhoto]);
			setActivePhotoId(nextPhoto.id);
			requestAnimationFrame(() => {
				const button = document.querySelector<HTMLButtonElement>(
					`[data-photo-id="${nextPhoto.id}"]`,
				);
				button?.focus();
			});
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [displayPhotos, filteredPhotoIds, selectedImages]);

	return (
		<ScreenWrapper>
			<div className="flex-1 overflow-y-auto">
				<Navigator
					selectedImages={selectedImages}
					authorFilter={authorFilter}
					setAuthorFilter={setAuthorFilter}
					onCreateStack={handleCreateStack}
					stackActionLabel={stackActionLabel}
					showStackAction={showStackAction}
					stackIcon={stackIcon}
				/>
				<div className="px-2">
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
						{displayPhotos.map((image) => (
							<AlbumPhoto
								key={image.id}
								image={image}
								selectedImages={selectedImages}
								setSelectedImages={setSelectedImages}
								onOpenFullScreen={setFullScreenPhoto}
								activePhotoId={activePhotoId}
								setActivePhotoId={setActivePhotoId}
								stackPhotos={stackGroups.get(image.stack_id ?? "") ?? []}
								onOpenStack={setOpenStackId}
							/>
						))}
					</div>
				</div>
			</div>
			<AnimatePresence>
				{fullScreenPhoto && (
					<FullScreenImagePreview
						photo={fullScreenPhoto}
						setFullScreenPhoto={setFullScreenPhoto}
						fullScreenSrc={fullScreenSrc}
						photos={displayPhotos}
					/>
				)}
			</AnimatePresence>
			<AnimatePresence>
				{openStackId && (
					<StackPreview
						openStackId={openStackId}
						setOpenStackId={setOpenStackId}
						openStackPhotos={openStackPhotos}
					/>
				)}
			</AnimatePresence>
		</ScreenWrapper>
	);
}

function AlbumPhoto({
	image,
	selectedImages,
	setSelectedImages,
	onOpenFullScreen,
	activePhotoId,
	setActivePhotoId,
	stackPhotos,
	onOpenStack,
}: {
	image: Photo;
	selectedImages: Readonly<Photo[]>;
	setSelectedImages: Dispatch<SetStateAction<Readonly<Photo[]>>>;
	onOpenFullScreen: (photo: Photo) => void;
	activePhotoId: string | null;
	setActivePhotoId: (id: string | null) => void;
	stackPhotos: Photo[];
	onOpenStack: (stackId: string) => void;
}) {
	const { setPhotoFavorite } = usePhotoLibrary();
	const isSelected = useMemo(
		() => selectedImages.some((img) => img.id === image.id),
		[image, selectedImages],
	);
	const isActive = activePhotoId === image.id;
	const stackSize = stackPhotos.length;
	const isFavorite = image.favorite ?? false;

	const handleImageClick = useCallback(
		(event: MouseEvent<HTMLButtonElement>, image: Photo) => {
			if (event.shiftKey) {
				setSelectedImages((prev) => {
					const isSelected = prev.some((img) => img.id === image.id);
					return isSelected
						? prev.filter((img) => img.id !== image.id)
						: [...prev, image];
				});
				setActivePhotoId(image.id);
				event.currentTarget.focus();
				return;
			}
			setSelectedImages((prev) => {
				const isSelected = prev.some((img) => img.id === image.id);
				if (isSelected) {
					onOpenFullScreen(image);
					return prev;
				}
				return [image];
			});
			setActivePhotoId(image.id);
			event.currentTarget.focus();
		},
		[onOpenFullScreen, setActivePhotoId, setSelectedImages],
	);

	const handleFavoriteClick = useCallback(
		(event: MouseEvent<HTMLButtonElement>) => {
			event.preventDefault();
			event.stopPropagation();
			void setPhotoFavorite(image.id, !isFavorite).catch(() =>
				toast.error("Failed to update favorite."),
			);
		},
		[image.id, isFavorite, setPhotoFavorite],
	);

	return (
		<div
			key={image.id}
			data-photo-id={image.id}
			onClick={(event) => {
				// Prevent double trigger if clicking internal buttons
				if (
					event.target === event.currentTarget ||
					(event.target instanceof HTMLElement &&
						!event.target.closest("button"))
				) {
					handleImageClick(
						event as unknown as MouseEvent<HTMLButtonElement>,
						image,
					);
				}
			}}
			onDoubleClick={() => onOpenFullScreen(image)}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					handleImageClick(
						event as unknown as MouseEvent<HTMLButtonElement>,
						image,
					);
				}
			}}
			onFocus={() => setActivePhotoId(image.id)}
			onMouseEnter={() => setActivePhotoId(image.id)}
			onMouseLeave={() => {
				if (!isSelected) {
					setActivePhotoId(null);
				}
			}}
			tabIndex={isActive ? 0 : -1}
			role="button"
			aria-current={isActive ? "true" : undefined}
			className={twMerge(
				"relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 outline-none" +
					" shadow-md shadow-black/30",
				isActive ? "bg-primary/10" : "hover:bg-primary/10",
				isSelected
					? "border-primary/50 ring-2 ring-primary ring-offset-1"
					: "border-transparent hover:border-muted-foreground/50",
			)}
		>
			<motion.div layoutId={`photo-${image.id}`} className="h-60">
				<PhotoComponent
					src={image.base64}
					alt={image.filename}
					config={image.config ?? {}}
				/>
			</motion.div>
			<div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-2">
				<p className="text-white text-sm font-medium">{image.filename}</p>
			</div>
			<ButtonWithTooltip
				variant="ghost"
				size="icon-xs"
				type="button"
				onClick={handleFavoriteClick}
				onDoubleClick={(event) => {
					event.preventDefault();
					event.stopPropagation();
				}}
				aria-pressed={isFavorite}
				aria-label={isFavorite ? "Remove favorite" : "Mark favorite"}
				className={twMerge(
					"absolute top-2 right-2 p-1 transition-colors",
					isFavorite ? "text-yellow-400" : "text-white/80 hover:text-white",
				)}
				tooltip={isFavorite ? "Remove from favorites" : "Mark as favorite"}
			>
				<HeartIcon
					className="h-4 w-4"
					fill={isFavorite ? "currentColor" : "none"}
				/>
			</ButtonWithTooltip>
			{isSelected && (
				<div className="absolute top-2 left-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
					<span className="text-primary-foreground text-xs font-bold">
						{selectedImages.findIndex((img) => img.id === image.id) + 1}
					</span>
				</div>
			)}
			{image.stack_id && stackSize > 1 && (
				<button
					type="button"
					onClick={(event) => {
						event.preventDefault();
						event.stopPropagation();
						onOpenStack(image.stack_id ?? "");
					}}
					className="flex items-center gap-1 absolute bottom-2 left-2 rounded-md bg-black/60 px-1.5! py-1! text-white"
				>
					<LayersIcon className="size-4" />
					<span className="text-xs">Stack ({stackSize})</span>
				</button>
			)}
		</div>
	);
}
