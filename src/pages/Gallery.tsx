import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { getLibraryPhotos } from "@/lib/library";
import { openEditWindow } from "@/lib/windows";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Photo } from "@/backend/commandStream";

export interface ImageItem {
	id: string;
	url: string;
	title: string;
}

interface PresencePeer {
	peer_key: string;
	device_name: string;
	metadata: Record<string, unknown> | null;
}

interface PresencePayload {
	local_peer: PresencePeer;
	remote_peers: PresencePeer[];
}

function Gallery() {
	const [photos, setPhotos] = useState<Photo[]>([]);
	const [loading, setLoading] = useState(true);
	const [presence, setPresence] = useState<PresencePayload | null>(null);
	const [showPeers, setShowPeers] = useState(false);
	const [pinnedPeers, setPinnedPeers] = useState(false);
	const [authorFilter, setAuthorFilter] = useState("all");

	// Listen for photos from the main window via events
	useEffect(() => {
		// Load photos from library on mount
		getLibraryPhotos()
			.then((loadedPhotos) => {
				console.log("Gallery loaded photos from library:", loadedPhotos.length);
				setPhotos(loadedPhotos);
				setLoading(false);
			})
			.catch((err) => {
				console.error("Failed to load photos:", err);
				setLoading(false);
			});

		// Also listen for photos sent via event
		const unlisten = listen<Photo[]>("gallery-photos", (event) => {
			console.log("Gallery received photos via event:", event.payload.length);
			setPhotos(event.payload);
			setLoading(false);
		});

		const unlistenPresence = listen<PresencePayload>("Presence", (event) => {
			setPresence(event.payload);
		});

		return () => {
			unlisten.then((fn) => fn());
			unlistenPresence.then((fn) => fn());
		};
	}, []);

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

	const filteredPhotos =
		authorFilter === "all"
			? photos
			: photos.filter((photo) => photo.author_peer_id === authorFilter);

	// Convert Photo[] to ImageItem[] for the gallery
	const images: ImageItem[] = filteredPhotos.map((photo) => ({
		id: photo.id,
		url: photo.base64,
		title: photo.filename,
	}));

	const [selectedImages, setSelectedImages] = useState<ImageItem[]>([]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: reset selection on filter change
	useEffect(() => {
		setSelectedImages([]);
	}, [authorFilter]);

	const handleImageClick = (image: ImageItem) => {
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
	};

	const handleEditClick = () => {
		if (selectedImages.length > 0) {
			openEditWindow(selectedImages);
		}
	};

	const handleDeleteClick = async () => {
		if (selectedImages.length === 0) return;

		try {
			for (const image of selectedImages) {
				await invoke("remove_image_from_album", { id: image.id });
			}
			// Update local state by removing the deleted photos
			const deletedIds = new Set(selectedImages.map((img) => img.id));
			setPhotos((prev) => prev.filter((p) => !deletedIds.has(p.id)));
			setSelectedImages([]);
		} catch (error) {
			console.error("Failed to delete images:", error);
		}
	};

	const isSelected = (id: string) =>
		selectedImages.some((img) => img.id === id);

	const onlineCount = presence?.remote_peers.length ?? 0;
	const onlineLabel = onlineCount > 0 ? `${onlineCount} online` : "Offline";
	const onlineDotClass = onlineCount > 0 ? "bg-emerald-500" : "bg-red-500";
	const localPeerName =
		(presence?.local_peer.metadata?.name as string | undefined) ??
		presence?.local_peer.device_name ??
		"This device";

	return (
		<main className="min-h-screen bg-background">
			<div className="p-4 pt-8">
				<div className="flex items-center justify-between mb-4 sticky top-0 bg-background z-10 py-4">
					<p className="text-sm text-muted-foreground">
						Select up to 2 images ({selectedImages.length}/2 selected)
					</p>
					<div className="relative flex items-center gap-2">
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
						<div>
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
						</div>
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
						{showPeers && (
							<div className="absolute right-0 top-full z-10 mt-2 w-72 rounded-lg border bg-card p-3 text-sm shadow-sm">
								<p className="mb-2 text-muted-foreground">Online peers</p>
								<div className="flex flex-col gap-1">
									<div className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1">
										<span>You</span>
										<span className="text-muted-foreground">
											{localPeerName}
										</span>
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
														...{peer.peer_key.slice(-8)}
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
						)}
					</div>
				</div>

				{loading ? (
					<p className="text-center text-muted-foreground">Loading photos...</p>
				) : (
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
						{images.map((image) => {
							return (
								<button
									type="button"
									key={image.id}
									onClick={() => handleImageClick(image)}
									className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${
										isSelected(image.id)
											? "border-primary ring-2 ring-primary ring-offset-2"
											: "border-transparent hover:border-muted-foreground/50"
									}`}
								>
									<img
										src={image.url}
										alt={image.title}
										className="w-full h-48 object-cover"
									/>
									<div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-2">
										<p className="text-white text-sm font-medium">
											{image.title}
										</p>
									</div>
									{isSelected(image.id) && (
										<div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
											<span className="text-white text-xs font-bold">
												{selectedImages.findIndex(
													(img) => img.id === image.id,
												) + 1}
											</span>
										</div>
									)}
								</button>
							);
						})}
					</div>
				)}
			</div>
		</main>
	);
}

export default Gallery;
