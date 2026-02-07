import { usePhotoLibrary } from "@/backend/photo-library-context";
import { Photo } from "@/backend/schemas";
import { Button } from "@/components/ui/button";
import { PhotoComponent } from "@/components/photo-component";
import { XIcon } from "lucide-react";
import React, { useMemo } from "react";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

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
										isPrimary ? "border-primary" : "border-muted-foreground/30",
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
	);
}
