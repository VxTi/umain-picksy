import { Photo } from "@/backend/schemas";
import { ButtonWithTooltip } from "@/components/ui/button-with-tooltip";
import { PhotoComponent } from "@/components/photo-component";
import { XIcon } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";

interface FullScreenImagePreviewProps {
	fullScreenPhoto: Readonly<Photo>;
	setFullScreenPhoto: React.Dispatch<
		React.SetStateAction<Readonly<Photo> | null>
	>;
	fullScreenSrc: string | null;
}
export default function FullScreenImagePreview({
	fullScreenPhoto,
	setFullScreenPhoto,
	fullScreenSrc,
}: FullScreenImagePreviewProps) {
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
			<div className="relative z-10 flex h-full items-center justify-center p-6 pointer-events-none">
				<motion.div
					initial={{ scale: 0.9, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					exit={{ scale: 0.9, opacity: 0 }}
					transition={{ type: "spring", damping: 25, stiffness: 300 }}
					className="relative flex items-center justify-center pointer-events-auto size-full"
				>
					<div className="absolute right-4 top-4 flex items-center gap-2 text-white/80 z-20">
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
						src={fullScreenSrc ?? fullScreenPhoto.base64}
						alt={fullScreenPhoto.filename}
						config={fullScreenPhoto.config ?? {}}
						className="size-full"
					/>
				</motion.div>
			</div>
		</motion.div>
	);
}
