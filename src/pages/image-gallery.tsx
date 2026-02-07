import { usePhotoLibrary } from "@/backend/photo-library-context";
import { Spinner } from "@/components/ui/spinner";
import { EventType } from "@/lib/events";
import { PhotoComponent } from "@/pages/photo-component";
import { listen } from "@tauri-apps/api/event";
import { openEditWindow } from "@/lib/windows";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
	HeartIcon,
	LayersIcon,
	PencilIcon,
	Trash2Icon,
	XIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, MouseEvent, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ButtonWithTooltip } from "@/components/ui/button-with-tooltip";
import type { Photo } from "@/backend/commandStream";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

interface PresencePeer {
	peer_key: string;
	device_name: string;
	metadata: Record<string, unknown> | null;
}

interface PresencePayload {
	local_peer: PresencePeer;
	remote_peers: PresencePeer[];
}

export default function ImageGallery() {
	const { photos, loading, setPhotoStack, setStackPrimary, clearPhotoStack } =
		usePhotoLibrary();

	const [authorFilter, setAuthorFilter] = useState("all");

	const [selectedImages, setSelectedImages] = useState<Readonly<Photo[]>>([]);
	const [fullScreenPhoto, setFullScreenPhoto] = useState<Photo | null>(null);
	const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
	const [openStackId, setOpenStackId] = useState<string | null>(null);
	const [autoStackingEnabled, setAutoStackingEnabled] = useState(false);
	const [autoStackedStackIds, setAutoStackedStackIds] = useState<Set<string>>(
		() => new Set(),
	);

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
	const openStackPrimaryId = useMemo(() => {
		return (
			openStackPhotos.find((photo) => photo.is_stack_primary)?.id ??
			openStackPhotos[0]?.id ??
			null
		);
	}, [openStackPhotos]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: reset selection on filter change
	useEffect(() => {
		setSelectedImages([]);
	}, [authorFilter]);

	useEffect(() => {
		setSelectedImages((prev) =>
			prev.filter((photo) => filteredPhotoIds.includes(photo.id)),
		);
	}, [filteredPhotoIds]);

	useEffect(() => {
		if (!autoStackingEnabled) return;
		const unstacked = filteredPhotos.filter((photo) => !photo.stack_id);
		if (unstacked.length < 2) return;

		const groups = buildHeuristicStacks(unstacked);
		if (groups.length === 0) return;

		void (async () => {
			for (const group of groups) {
				if (group.length < 2) continue;
				const stackId = crypto.randomUUID();
				const sorted = [...group].sort((a, b) =>
					a.filename.localeCompare(b.filename),
				);
				const primaryId = sorted[0].id;
				const photoIds = sorted.map((photo) => photo.id);
				try {
					await setPhotoStack(photoIds, stackId, primaryId);
					setAutoStackedStackIds((prev) => {
						const next = new Set(prev);
						next.add(stackId);
						return next;
					});
				} catch {
					toast.error("Failed to auto-stack images.");
					break;
				}
			}
		})();
	}, [autoStackingEnabled, filteredPhotos, setPhotoStack]);

	useEffect(() => {
		if (autoStackingEnabled) return;
		if (autoStackedStackIds.size === 0) return;
		const stackIds = Array.from(autoStackedStackIds);
		const photoIds = stackIds.flatMap(
			(stackId) => stackGroups.get(stackId)?.map((photo) => photo.id) ?? [],
		);
		if (photoIds.length === 0) {
			setAutoStackedStackIds(new Set());
			return;
		}
		void clearPhotoStack(photoIds)
			.then(() => setAutoStackedStackIds(new Set()))
			.catch(() => toast.error("Failed to clear auto-stacked images."));
	}, [autoStackingEnabled, autoStackedStackIds, clearPhotoStack, stackGroups]);

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

	const handleSetStackPrimary = useCallback(
		(stackId: string, primaryId: string) => {
			void setStackPrimary(stackId, primaryId).catch(() =>
				toast.error("Failed to update stack primary."),
			);
		},
		[setStackPrimary],
	);

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
		<main className="h-screen bg-background flex flex-col overflow-hidden">
			<div className="flex-1 overflow-y-auto">
				<GalleryNavigationBar
					selectedImages={selectedImages}
					authorFilter={authorFilter}
					setAuthorFilter={setAuthorFilter}
					onCreateStack={handleCreateStack}
					stackActionLabel={stackActionLabel}
					showStackAction={showStackAction}
					autoStackingEnabled={autoStackingEnabled}
					onToggleAutoStacking={setAutoStackingEnabled}
				/>

				{loading && (
					<p className="text-center text-muted-foreground">
						<Spinner />
						Loading photos...
					</p>
				)}
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
			{fullScreenPhoto && (
				<div className="fixed inset-0 z-50">
					<button
						type="button"
						className="absolute inset-0 bg-black/90"
						onClick={() => setFullScreenPhoto(null)}
						aria-label="Close full screen"
					/>
					<div className="relative z-10 flex h-full items-center justify-center p-6">
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
						<PhotoComponent
							src={fullScreenPhoto.base64}
							alt={fullScreenPhoto.filename}
							config={fullScreenPhoto.config ?? {}}
						/>
					</div>
				</div>
			)}
			{openStackId && (
				<div className="fixed inset-0 z-40">
					<button
						type="button"
						className="absolute inset-0 bg-black/80"
						onClick={() => setOpenStackId(null)}
						aria-label="Close stack"
					/>
					<div className="relative z-10 flex h-full items-center justify-center p-6">
						<div className="absolute right-4 top-4 flex items-center gap-2 text-white/80">
							<span className="rounded border border-white/30 px-2 py-0.5 text-xs">
								ESC
							</span>
							<button
								type="button"
								onClick={(event) => {
									event.stopPropagation();
									setOpenStackId(null);
								}}
								aria-label="Close stack"
								className="p-1 text-white/80 transition-colors hover:text-white"
							>
								<XIcon className="h-5 w-5" />
							</button>
						</div>
						<div className="w-full max-w-5xl rounded-xl bg-background/95 p-4 shadow-lg">
							<div className="mb-4 flex items-center justify-between">
								<div>
									<p className="text-sm text-muted-foreground">
										Stack ({openStackPhotos.length})
									</p>
									{openStackPrimaryId && (
										<p className="text-base font-semibold">
											Primary:{" "}
											{
												openStackPhotos.find(
													(photo) => photo.id === openStackPrimaryId,
												)?.filename
											}
										</p>
									)}
								</div>
							</div>
							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
								{openStackPhotos.map((photo) => {
									const isPrimary = photo.id === openStackPrimaryId;
									return (
										<div
											key={photo.id}
											className={twMerge(
												"relative rounded-lg border-2 p-2",
												isPrimary
													? "border-primary"
													: "border-muted-foreground/30",
											)}
										>
											<PhotoComponent
												src={photo.base64}
												alt={photo.filename}
												config={photo.config ?? {}}
											/>
											<div className="mt-2 flex items-center justify-between">
												<span className="text-sm">{photo.filename}</span>
												<Button
													size="sm"
													variant={isPrimary ? "default" : "outline"}
													onClick={() =>
														handleSetStackPrimary(openStackId, photo.id)
													}
												>
													{isPrimary ? "Primary" : "Set as primary"}
												</Button>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					</div>
				</div>
			)}
		</main>
	);
}

function GalleryNavigationBar({
	authorFilter,
	setAuthorFilter,
	selectedImages,
	onCreateStack,
	stackActionLabel,
	showStackAction,
	autoStackingEnabled,
	onToggleAutoStacking,
}: {
	authorFilter: string;
	setAuthorFilter: (value: string) => void;
	selectedImages: Readonly<Photo[]>;
	onCreateStack: () => void;
	stackActionLabel: string;
	showStackAction: boolean;
	autoStackingEnabled: boolean;
	onToggleAutoStacking: (enabled: boolean) => void;
}) {
	const { photos, removePhotoFromLibrary, setPhotos, setPhotosFavorite } =
		usePhotoLibrary();

	const [presence, setPresence] = useState<PresencePayload | null>(null);
	const [showPeers, setShowPeers] = useState(false);
	const [pinnedPeers, setPinnedPeers] = useState(false);

	useEffect(() => {
		const unlisten = listen<Photo[]>(EventType.TRANSPORT_IMAGES, (event) => {
			setPhotos(event.payload);
		});

		const unlistenPresence = listen<PresencePayload>("Presence", (event) => {
			setPresence(event.payload);
		});

		return () => {
			unlisten.then((fn) => fn());
			unlistenPresence.then((fn) => fn());
		};
	}, [setPhotos]);

	const handleEditClick = () => {
		if (selectedImages.length > 0) {
			void openEditWindow(selectedImages);
		}
	};

	const isAnyNotFavorited = selectedImages.some((img) => !img.favorite);
	const allFavorited =
		selectedImages.length > 0 && selectedImages.every((img) => img.favorite);

	const handleFavoriteClick = async () => {
		if (selectedImages.length === 0) return;

		const targetState = isAnyNotFavorited;
		try {
			await setPhotosFavorite(
				selectedImages.map((img) => img.id),
				targetState,
			);
		} catch (error) {
			toast.error(
				`Failed to ${targetState ? "favorite" : "unfavorite"} images.`,
			);
		}
	};

	const handleDeleteClick = async () => {
		if (selectedImages.length === 0) return;

		const results = await Promise.allSettled(
			selectedImages.map((img) => removePhotoFromLibrary(img)),
		);
		const failed = results.filter((result) => result.status === "rejected");
		if (failed.length > 0) {
			console.error(failed);
			toast.error(
				`Failed to delete ${failed.length} ${
					failed.length === 1 ? "image" : "images"
				}.`,
			);
		} else {
			toast.success(
				`Deleted ${selectedImages.length} ${
					selectedImages.length === 1 ? "image" : "images"
				}.`,
			);
		}
	};

	const onlineCount = presence?.remote_peers.length ?? 0;
	const onlineLabel = onlineCount > 0 ? `${onlineCount + 1} online` : "Offline";

	return (
		<div
			onMouseDown={() => getCurrentWindow().startDragging()}
			className="flex items-center justify-between mb-4 sticky top-0 bg-background z-10 px-3 py-4"
		>
			<p className="text-sm text-muted-foreground select-none pointer-events-none">
				Click to select, Shift-click for multi-select ({selectedImages.length}{" "}
				selected)
			</p>
			<div className="relative flex items-center gap-2 text-sm! *:px-2!">
				<div className="flex items-center gap-2">
					<Switch
						id="auto-stack-toggle"
						checked={autoStackingEnabled}
						onCheckedChange={onToggleAutoStacking}
					/>
					<Label htmlFor="auto-stack-toggle" className="text-sm">
						Auto-stack similar
					</Label>
				</div>
				<FilterUsers
					photos={photos}
					presence={presence}
					authorFilter={authorFilter}
					setAuthorFilter={setAuthorFilter}
				/>
				<Button
					variant="outline"
					onMouseEnter={() => setShowPeers(true)}
					onMouseLeave={() => {
						if (!pinnedPeers) {
							setShowPeers(false);
						}
					}}
					onClick={() => {
						setPinnedPeers((prev) => {
							const next = !prev;
							setShowPeers(next);
							return next;
						});
					}}
				>
					<span
						className={twMerge(
							"inline-block h-2 w-2 rounded-full",
							onlineCount > 0
								? "bg-emerald-500 ring-0 transition-all duration-200 "
								: "bg-red-500",
						)}
					/>
					<span
						key={onlineLabel}
						className="animate-in fade-in slide-in-from-top-1 bg-muted/50 rounded-full px-3 py-1 text-xs font-medium text-muted-foreground transition-all duration-300 hover:bg-muted hover:text-foreground cursor-help"
						title="Online peers"
						onMouseDown={(e) => e.stopPropagation()}
					>
						{onlineLabel}
					</span>
				</Button>
				{showStackAction && (
					<Button variant="outline" onClick={onCreateStack}>
						{stackActionLabel}
					</Button>
				)}
				{showPeers && <ActiveUsers presence={presence} />}
				<div className="flex items-center gap-2">
					<ButtonWithTooltip
						variant="ghost"
						size="icon-sm"
						onClick={handleEditClick}
						disabled={selectedImages.length === 0}
						className="text-muted-foreground hover:text-foreground"
						tooltip="Edit selected"
						onMouseDown={(e) => e.stopPropagation()}
					>
						<PencilIcon className="size-4" />
					</ButtonWithTooltip>
					<ButtonWithTooltip
						variant="ghost"
						size="icon-sm"
						onClick={handleFavoriteClick}
						disabled={selectedImages.length === 0}
						className={twMerge(
							"text-muted-foreground hover:bg-yellow-500/10",
							allFavorited
								? "text-yellow-500 hover:text-yellow-600"
								: "hover:text-yellow-500",
						)}
						tooltip={
							isAnyNotFavorited ? "Add to favorites" : "Remove from favorites"
						}
						onMouseDown={(e) => e.stopPropagation()}
					>
						<HeartIcon
							className={twMerge("size-4", allFavorited && "fill-current")}
						/>
					</ButtonWithTooltip>
					<ButtonWithTooltip
						variant="ghost"
						size="icon-sm"
						onClick={handleDeleteClick}
						disabled={selectedImages.length === 0}
						className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
						tooltip="Delete selected"
						onMouseDown={(e) => e.stopPropagation()}
					>
						<Trash2Icon className="size-4" />
					</ButtonWithTooltip>
				</div>
				{showPeers && presence && <ActiveUsers presence={presence} />}
			</div>
		</div>
	);
}

function FilterUsers({
	photos,
	presence,
	authorFilter,
	setAuthorFilter,
}: {
	photos: Readonly<Photo[]>;
	presence: PresencePayload | null;
	authorFilter: string;
	setAuthorFilter: (value: string) => void;
}) {
	const localPeerName =
		(presence?.local_peer.metadata?.name as string | undefined) ??
		presence?.local_peer.device_name ??
		"This device";
	const resolvePeerLabel = (peerId: string) => {
		if (presence?.local_peer.peer_key === peerId) {
			return `You (${localPeerName})`;
		}
		const peer = presence?.remote_peers.find((p) => p.peer_key === peerId);
		if (!peer) {
			return `${peerId.slice(0, 8)}...`;
		}
		return (
			(peer.metadata?.name as string | undefined) ??
			peer.device_name ??
			peer.peer_key
		);
	};

	return (
		<select
			className="h-9 rounded-md border border-input bg-background px-3 text-sm"
			value={authorFilter}
			onChange={(event) => setAuthorFilter(event.target.value)}
		>
			<option value="all">All authors</option>
			{Array.from(
				new Set(
					photos
						.map((photo) => photo.author_peer_id)
						.filter((id): id is string => Boolean(id)),
				),
			).map((authorId) => (
				<option key={authorId} value={authorId}>
					{resolvePeerLabel(authorId)}
				</option>
			))}
		</select>
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
				"relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 outline-none",
				isActive ? "bg-primary/10" : "hover:bg-primary/10",
				isSelected
					? "border-primary ring-2 ring-primary ring-offset-2"
					: "border-transparent hover:border-muted-foreground/50",
			)}
		>
			<PhotoComponent
				src={image.base64}
				alt={image.filename}
				config={image.config ?? {}}
				className="shadow-sm shadow-black h-60"
			/>
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
					<span className="text-white text-xs font-bold">
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

type FilenameSignature = {
	key: string;
	numericSuffix?: number;
};

function buildHeuristicStacks(photos: Photo[]): Photo[][] {
	const byKey = new Map<string, { photo: Photo; numericSuffix?: number }[]>();
	for (const photo of photos) {
		const signature = getFilenameSignature(photo.filename);
		const existing = byKey.get(signature.key) ?? [];
		existing.push({ photo, numericSuffix: signature.numericSuffix });
		byKey.set(signature.key, existing);
	}

	const groups: Photo[][] = [];
	for (const entries of byKey.values()) {
		if (entries.length < 2) continue;
		const withNumber = entries.every(
			(entry) => entry.numericSuffix !== undefined,
		);
		if (!withNumber) {
			groups.push(entries.map((entry) => entry.photo));
			continue;
		}
		const sorted = [...entries].sort(
			(a, b) => (a.numericSuffix ?? 0) - (b.numericSuffix ?? 0),
		);
		let current: Photo[] = [sorted[0].photo];
		for (let i = 1; i < sorted.length; i += 1) {
			const prev = sorted[i - 1].numericSuffix ?? 0;
			const next = sorted[i].numericSuffix ?? 0;
			if (next - prev <= 3) {
				current.push(sorted[i].photo);
			} else {
				if (current.length >= 2) {
					groups.push(current);
				}
				current = [sorted[i].photo];
			}
		}
		if (current.length >= 2) {
			groups.push(current);
		}
	}
	return groups;
}

function getFilenameSignature(filename: string): FilenameSignature {
	const lower = filename.toLowerCase();
	const withoutExt = lower.replace(/\.[^/.]+$/, "");
	const dateMatch =
		withoutExt.match(/\b(20\d{2}[01]\d[0-3]\d)\b/) ??
		withoutExt.match(/\b(20\d{2}-[01]\d-[0-3]\d)\b/);
	const dateKey = dateMatch?.[1];
	const suffixMatch = withoutExt.match(/(\d+)\s*$/);
	const numericSuffix = suffixMatch
		? Number.parseInt(suffixMatch[1], 10)
		: undefined;
	const base = withoutExt.replace(/[\s_-]*\d+$/, "").trim();
	const key = dateKey ? `${base}|${dateKey}` : base;
	return { key, numericSuffix };
}

function ActiveUsers({ presence }: { presence: PresencePayload | null }) {
	const localPeerName =
		(presence?.local_peer.metadata?.name as string | undefined) ??
		presence?.local_peer.device_name ??
		"This device";
	return (
		<div className="absolute right-0 top-full z-10 mt-2 w-72 rounded-lg border bg-card p-3 text-sm shadow-sm">
			<p className="mb-2 text-muted-foreground">Online peers</p>
			<div className="flex flex-col gap-1">
				<div className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1">
					<span>You</span>
					<span className="text-muted-foreground">{localPeerName}</span>
				</div>
				{presence?.remote_peers.length ? (
					presence.remote_peers.map((peer) => {
						const displayName =
							(peer.metadata?.name as string | undefined) ??
							peer.device_name ??
							peer.peer_key;
						return (
							<div
								key={peer.peer_key}
								className="flex items-center justify-between rounded-md px-2 py-1"
							>
								<span>{displayName}</span>
								<span className="text-xs text-muted-foreground">
									{peer.peer_key.slice(0, 8)}...
								</span>
							</div>
						);
					})
				) : (
					<div className="rounded-md px-2 py-1 text-muted-foreground">
						No peers online yet
					</div>
				)}
			</div>
		</div>
	);
}
