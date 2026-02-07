import { usePhotoLibrary } from "@/backend/photo-library-context";
import type { Photo } from "@/backend/schemas";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EventType } from "@/lib/events";
import { openEditWindow } from "@/lib/windows";
import { PresencePayload } from "@/pages/image-gallery/common";
import HeaderMenuButton from "@/pages/image-gallery/components/header-menu-button";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
	FolderPlusIcon,
	HeartIcon,
	ImagePlusIcon,
	PencilIcon,
	Trash2Icon,
} from "lucide-react";
import React, {
	type Dispatch,
	type SetStateAction,
	useEffect,
	useState,
} from "react";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

interface NavigatorProps {
	authorFilter: string;
	setAuthorFilter: (value: string) => void;
	selectedImages: Readonly<Photo[]>;
	onCreateStack: () => void;
	stackActionLabel: string;
	showStackAction: boolean;
	stackIcon: React.ComponentType<{ className?: string }>;
}

export default function Navigator({
	authorFilter,
	setAuthorFilter,
	selectedImages,
	onCreateStack,
	stackActionLabel,
	showStackAction,
	stackIcon: StackIcon,
}: NavigatorProps) {
	const { photos, loading, setPhotos, setPhotosFavorite } = usePhotoLibrary();

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

	return (
		<div
			onMouseDown={() => getCurrentWindow().startDragging()}
			className="flex items-center justify-between mb-4 sticky top-0 bg-background z-10 px-3 py-4"
		>
			<p className="text-sm mt-2 text-muted-foreground select-none pointer-events-none">
				Click to select, Shift-click for multi-select ({selectedImages.length}{" "}
				selected)
			</p>
			<div className="relative flex items-center gap-2 text-sm!">
				{loading && <Spinner />}
				<ThemeToggle />
				<FilterImagesByAuthor
					photos={photos}
					presence={presence}
					authorFilter={authorFilter}
					setAuthorFilter={setAuthorFilter}
				/>
				<OnlineUsersStatus
					presence={presence}
					setShowPeers={setShowPeers}
					setPinnedPeers={setPinnedPeers}
					pinnedPeers={pinnedPeers}
				/>

				{showStackAction && (
					<Button variant="outline"  className='h-8' onClick={onCreateStack}>
						<StackIcon className="size-4" />
						{stackActionLabel}
					</Button>
				)}
				{showPeers && <ActiveUsers presence={presence} />}

				<DotSeparator />

				<div className="flex items-center gap-2">
					<HeaderMenuButton
						onClick={handleEditClick}
						disabled={selectedImages.length === 0}
						tooltip="Edit selected"
						onMouseDown={(e) => e.stopPropagation()}
					>
						<PencilIcon className="size-4" />
					</HeaderMenuButton>
					<HeaderMenuButton
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
					</HeaderMenuButton>
					<DeleteSelectionButton selectedImages={selectedImages} />

					<DotSeparator />

					<AddImagesFolderButton />
					<AddImagesButton />
				</div>
				{showPeers && presence && <ActiveUsers presence={presence} />}
			</div>
		</div>
	);
}

function DeleteSelectionButton({
	selectedImages,
}: {
	selectedImages: Readonly<Photo[]>;
}) {
	const { removePhotoFromLibrary } = usePhotoLibrary();
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

	return (
		<HeaderMenuButton
			onClick={handleDeleteClick}
			disabled={selectedImages.length === 0}
			className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
			tooltip="Delete selected"
			onMouseDown={(e) => e.stopPropagation()}
		>
			<Trash2Icon className="size-4" />
		</HeaderMenuButton>
	);
}

function AddImagesFolderButton() {
	const { addPhotosFromFolder } = usePhotoLibrary();

	return (
		<HeaderMenuButton
			tooltip="Add images from a folder on your device"
			onClick={addPhotosFromFolder}
		>
			<FolderPlusIcon className="size-4" />
		</HeaderMenuButton>
	);
}

function AddImagesButton() {
	const { addPhotosToLibrary } = usePhotoLibrary();

	return (
		<HeaderMenuButton
			tooltip="Add images from your device"
			onClick={addPhotosToLibrary}
		>
			<ImagePlusIcon className="size-4" />
		</HeaderMenuButton>
	);
}

function DotSeparator() {
	return <div className="mx-2 grow-0 bg-foreground/50 rounded-full p-0.5!" />;
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

function OnlineUsersStatus({
	presence,
	pinnedPeers,
	setShowPeers,
	setPinnedPeers,
}: {
	presence: PresencePayload | null;
	pinnedPeers: boolean;
	setPinnedPeers: Dispatch<SetStateAction<boolean>>;
	setShowPeers: Dispatch<SetStateAction<boolean>>;
}) {
	const onlineCount = presence?.remote_peers.length ?? 0;
	const onlineLabel = onlineCount > 0 ? `${onlineCount + 1} online` : "Offline";

	return (
		<Button
			variant="outline"
			className="h-8 px-1.5!"
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
	);
}

function FilterImagesByAuthor({
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
			className="h-8 rounded-md border border-input bg-background px-3 text-sm"
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
