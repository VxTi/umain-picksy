import { usePhotoLibrary } from "@/backend/photo-library-context";
import { Photo } from "@/backend/schemas";
import { Button } from "@/components/ui/button";
import { PhotoComponent } from "@/components/photo-component";
import { ButtonWithTooltip } from "@/components/ui/button-with-tooltip";
import { openEditWindow } from "@/lib/windows";
import { XIcon, HeartIcon, PencilIcon } from "lucide-react";
import React, { useMemo } from "react";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";

interface StackPreviewProps {
	openStackId: string | null;
	setOpenStackId: React.Dispatch<React.SetStateAction<string | null>>;
	openStackPhotos: Readonly<Photo[]>;
}

export default function StackPreview({
	openStackId,
	setOpenStackId,
	openStackPhotos,
}: StackPreviewProps) {
	const { setStackPrimary } = usePhotoLibrary();

	const openStackPrimaryId = useMemo(() => {
		return (
			openStackPhotos.find((photo) => photo.is_stack_primary)?.id ??
			openStackPhotos[0]?.id ??
			null
		);
	}, [openStackPhotos]);

	const handleSetStackPrimary = React.useCallback(
		(stackId: string, primaryId: string) => {
			void setStackPrimary(stackId, primaryId).catch(() =>
				toast.error("Failed to update stack primary."),
			);
		},
		[setStackPrimary],
	);

	if (!openStackId) return null;

	return (
		<div className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6">
			<motion.button
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				type="button"
				className="absolute inset-0 size-sm bg-black/60 backdrop-blur-sm"
				onClick={() => setOpenStackId(null)}
				aria-label="Close stack"
			/>
			<motion.div
				initial={{ opacity: 0, scale: 0.9, y: 20 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.9, y: 20 }}
				transition={{ type: "spring", damping: 25, stiffness: 300 }}
				className="relative z-10 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl backdrop-blur-md shadow-2xl border border-white/10"
			>
				<div className="flex items-center justify-between p-4 border-b border-border/50">
					<div className="flex items-center gap-3">
						<div className="bg-primary/10 p-2 rounded-lg">
							<p className="text-primary font-bold text-lg leading-none">
								{openStackPhotos.length}
							</p>
						</div>
						<div>
							<h3 className="text-lg font-semibold leading-none">
								Photo Stack
							</h3>
							<p className="text-sm text-muted-foreground mt-1">
								Manage and select the primary photo for this stack
							</p>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<span className="hidden sm:flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[10px] font-medium text-muted-foreground bg-muted/30 uppercase tracking-wider">
							ESC to close
						</span>
						<button
							type="button"
							onClick={() => setOpenStackId(null)}
							className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
							aria-label="Close stack"
						>
							<XIcon className="h-5 w-5" />
						</button>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
					<div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
						{openStackPhotos.map((photo) => (
							<StackPreviewItem
								key={`stack-preview-entry-${photo.id}`}
								photo={photo}
								isPrimary={photo.id === openStackPrimaryId}
								handleSetStackPrimary={handleSetStackPrimary}
								openStackId={openStackId}
							/>
						))}
					</div>
				</div>
			</motion.div>
		</div>
	);
}

function StackPreviewItem({
	photo,
	isPrimary,
	handleSetStackPrimary,
	openStackId,
}: {
	photo: Photo;
	isPrimary: boolean;
	handleSetStackPrimary: (stackId: string, primaryId: string) => void;
	openStackId: string;
}) {
	return (
		<motion.div
			key={`stack-${photo.id}`}
			className={twMerge(
				"group relative flex flex-col gap-3 rounded-xl p-3 transition-all duration-300",
				isPrimary
					? "bg-primary/5 ring-2 ring-primary ring-offset-2 ring-offset-background"
					: "bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-border",
			)}
		>
			<div className="relative aspect-4/3 w-full overflow-hidden rounded-lg cursor-zoom-in">
				<motion.div key={`stack-photo-${photo.id}`} className="size-full">
					<PhotoComponent
						src={photo.base64}
						alt={photo.filename}
						config={photo.config ?? {}}
						className="transition-transform duration-500 group-hover:scale-105"
					/>
				</motion.div>
				{isPrimary && (
					<div className="absolute bg-red-500 top-0 right-2 text-primary-foreground p-1.5 rounded-full shadow-lg">
						<HeartIcon className="size-4  fill-white" />
					</div>
				)}
				<ButtonWithTooltip
					size="icon-sm"
					className="absolute top-0 left-2 p-1! rounded-full!"
					tooltip="Edit image"
					onClick={() => openEditWindow([photo])}
				>
					<PencilIcon />
				</ButtonWithTooltip>
			</div>
			<div className="flex flex-col gap-2">
				<p className="truncate text-sm font-medium px-1" title={photo.filename}>
					{photo.filename}
				</p>
				<Button
					size="sm"
					variant={isPrimary ? "default" : "secondary"}
					className={twMerge(
						"w-full h-8 text-xs font-semibold rounded-lg transition-all",
						!isPrimary && "opacity-0 group-hover:opacity-100",
					)}
					onClick={() => handleSetStackPrimary(openStackId, photo.id)}
				>
					{isPrimary ? "Primary Image" : "Set as Primary"}
				</Button>
			</div>
		</motion.div>
	);
}
