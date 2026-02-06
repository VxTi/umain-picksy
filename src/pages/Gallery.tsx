import { usePhotoLibrary } from "@/backend/photo-library-context";
import { Spinner } from "@/components/ui/spinner";
import { EventType } from "@/lib/events";
import { SyncStatus } from "@/lib/synchronization";
import { PhotoComponent } from "@/pages/PhotoComponent";
import { listen } from "@tauri-apps/api/event";
import { openEditWindow } from "@/lib/windows";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
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

	const filteredPhotos =
		authorFilter === "all"
			? photos
			: photos.filter((photo) => photo.author_peer_id === authorFilter);

	// biome-ignore lint/correctness/useExhaustiveDependencies: reset selection on filter change
	useEffect(() => {
		setSelectedImages([]);
	}, [authorFilter]);

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
						/>
					))}
				</div>
			</div>
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

		await Promise.allSettled(
			selectedImages.map((img) => removePhotoFromLibrary(img)),
		).catch(() => toast.error("Failed to delete images."));
	};

	const onlineCount = presence?.remote_peers.length ?? 0;
	const onlineLabel = onlineCount > 0 ? `${onlineCount} online` : "Offline";
	const onlineDotClass = onlineCount > 0 ? "bg-emerald-500" : "bg-red-500";

	return (
		<div className="flex items-center justify-between mb-4 sticky top-0 bg-background z-10 py-4">
			<p className="text-sm text-muted-foreground">
				Select up to 2 images ({selectedImages.length}/2 selected)
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

function getSyncStatusLabel(status: string | undefined) {
	switch (status) {
		case SyncStatus.SYNCED:
			return "Synced";
		case SyncStatus.PENDING:
			return "Syncing";
		case SyncStatus.DISCONNECTED:
			return "Offline";
		default:
			return "Unknown";
	}
}

function AlbumPhoto({
	image,
	selectedImages,
	setSelectedImages,
}: {
	image: Photo;
	selectedImages: Readonly<Photo[]>;
	setSelectedImages: Dispatch<SetStateAction<Readonly<Photo[]>>>;
}) {
	const isSelected = useMemo(
		() => selectedImages.some((img) => img.id === image.id),
		[image, selectedImages],
	);

	const handleImageClick = useCallback(
		(image: Photo) => {
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
		},
		[setSelectedImages],
	);

	const syncStatus = (image as { sync_status?: SyncStatus }).sync_status;

	return (
		<button
			type="button"
			key={image.id}
			onClick={() => handleImageClick(image)}
			className={twMerge(
				"relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200",
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
			<div
				className={twMerge(
					`absolute top-2 left-2 rounded-full px-2 py-1 text-xs font-medium`,
					syncStatus === SyncStatus.SYNCED
						? "bg-green-500"
						: syncStatus === SyncStatus.PENDING
							? "bg-yellow-500"
							: syncStatus === SyncStatus.DISCONNECTED
								? "bg-red-500"
								: "bg-gray-500",
				)}
			>
				{getSyncStatusLabel(syncStatus)}
			</div>
			<div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-2">
				<p className="text-white text-sm font-medium">{image.filename}</p>
			</div>
			{isSelected && (
				<div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
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
