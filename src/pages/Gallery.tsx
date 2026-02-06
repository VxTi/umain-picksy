import { usePhotoLibrary } from "@/backend/photo-library-context";
import { Spinner } from "@/components/ui/spinner";
import { EventType } from "@/lib/events";
import { SyncStatus } from "@/lib/synchronization";
import { PhotoComponent } from "@/pages/PhotoComponent";
import { listen } from "@tauri-apps/api/event";
import { openEditWindow } from "@/lib/windows";
import { PencilIcon, StarIcon, Trash2Icon, XIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, MouseEvent, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
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

export default function Gallery() {
	const { photos, loading } = usePhotoLibrary();

	const [authorFilter, setAuthorFilter] = useState("all");

	const [selectedImages, setSelectedImages] = useState<Readonly<Photo[]>>([]);
	const [fullScreenPhoto, setFullScreenPhoto] = useState<Photo | null>(null);
	const [activePhotoId, setActivePhotoId] = useState<string | null>(null);

	const filteredPhotos =
		authorFilter === "all"
			? photos
			: photos.filter((photo) => photo.author_peer_id === authorFilter);
	const filteredPhotoIds = useMemo(
		() => filteredPhotos.map((photo) => photo.id),
		[filteredPhotos],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: reset selection on filter change
	useEffect(() => {
		setSelectedImages([]);
	}, [authorFilter]);

	useEffect(() => {
		if (activePhotoId && !filteredPhotoIds.includes(activePhotoId)) {
			setActivePhotoId(null);
		}
	}, [activePhotoId, filteredPhotoIds]);

	useEffect(() => {
		if (!fullScreenPhoto) return;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setFullScreenPhoto(null);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [fullScreenPhoto]);

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
			if (filteredPhotos.length === 0) return;

			event.preventDefault();

			const getGridColumns = () => {
				const width = window.innerWidth;
				if (width >= 1024) return 4;
				if (width >= 768) return 3;
				return 2;
			};

			const currentId =
				selectedImages[selectedImages.length - 1]?.id ?? filteredPhotos[0].id;
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
					nextIndex = filteredPhotos.length - 1;
					break;
			}

			nextIndex = Math.min(Math.max(nextIndex, 0), filteredPhotos.length - 1);
			const nextPhoto = filteredPhotos[nextIndex];
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
	}, [filteredPhotoIds, filteredPhotos, selectedImages]);

	return (
		<main className="min-h-screen bg-background">
			<div className="p-4">
				<GalleryNavigationBar
					selectedImages={selectedImages}
					authorFilter={authorFilter}
					setAuthorFilter={setAuthorFilter}
				/>

				{loading && (
					<p className="text-center text-muted-foreground">
						<Spinner />
						Loading photos...
					</p>
				)}

				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{filteredPhotos.map((image) => (
						<AlbumPhoto
							key={image.id}
							image={image}
							selectedImages={selectedImages}
							setSelectedImages={setSelectedImages}
							onOpenFullScreen={setFullScreenPhoto}
							activePhotoId={activePhotoId}
							setActivePhotoId={setActivePhotoId}
						/>
					))}
				</div>
			</div>
			{fullScreenPhoto && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6"
					onClick={() => setFullScreenPhoto(null)}
				>
					<div className="absolute right-4 top-4 flex items-center gap-2 text-white/80">
						<span className="rounded border border-white/30 px-2 py-0.5 text-xs">
							ESC
						</span>
						<button
							type="button"
							onClick={(event) => {
								event.stopPropagation();
								setFullScreenPhoto(null);
							}}
							aria-label="Close full screen"
							className="p-1 text-white/80 transition-colors hover:text-white"
						>
							<XIcon className="h-5 w-5" />
						</button>
					</div>
					<img
						src={fullScreenPhoto.base64}
						alt={fullScreenPhoto.filename}
						className="max-h-full max-w-full object-contain"
					/>
				</div>
			)}
		</main>
	);
}

function GalleryNavigationBar({
	authorFilter,
	setAuthorFilter,
	selectedImages,
}: {
	authorFilter: string;
	setAuthorFilter: (value: string) => void;
	selectedImages: Readonly<Photo[]>;
}) {
	const { photos, removePhotoFromLibrary, setPhotos } = usePhotoLibrary();

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
	const onlineDotClass = onlineCount > 0 ? "bg-emerald-500" : "bg-red-500";

	return (
		<div className="flex items-center justify-between mb-4 sticky top-0 bg-background z-10 py-4">
			<p className="text-sm text-muted-foreground">
				Click to select, Shift-click for multi-select ({selectedImages.length}{" "}
				selected)
			</p>
			<div className="relative flex items-center gap-2">
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
						className={`inline-block h-2 w-2 rounded-full ${onlineDotClass}`}
					/>
					{onlineLabel}
				</Button>
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
				{showPeers && <ActiveUsers presence={presence} />}
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
}: {
	image: Photo;
	selectedImages: Readonly<Photo[]>;
	setSelectedImages: Dispatch<SetStateAction<Readonly<Photo[]>>>;
	onOpenFullScreen: (photo: Photo) => void;
	activePhotoId: string | null;
	setActivePhotoId: (id: string | null) => void;
}) {
	const { setPhotoFavorite } = usePhotoLibrary();
	const isSelected = useMemo(
		() => selectedImages.some((img) => img.id === image.id),
		[image, selectedImages],
	);
	const isActive = activePhotoId === image.id;
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
		<button
			type="button"
			key={image.id}
			data-photo-id={image.id}
			onClick={(event) => handleImageClick(event, image)}
			onDoubleClick={() => onOpenFullScreen(image)}
			onFocus={() => setActivePhotoId(image.id)}
			onMouseEnter={() => setActivePhotoId(image.id)}
			onMouseLeave={() => {
				if (!isSelected) {
					setActivePhotoId(null);
				}
			}}
			tabIndex={isActive ? 0 : -1}
			aria-current={isActive ? "true" : undefined}
			className={twMerge(
				"relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200",
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
			/>
			<div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-2">
				<p className="text-white text-sm font-medium">{image.filename}</p>
			</div>
			<button
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
			>
				<StarIcon
					className="h-4 w-4"
					fill={isFavorite ? "currentColor" : "none"}
				/>
			</button>
			{isSelected && (
				<div className="absolute top-2 left-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
					<span className="text-white text-xs font-bold">
						{selectedImages.findIndex((img) => img.id === image.id) + 1}
					</span>
				</div>
			)}
		</button>
	);
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
