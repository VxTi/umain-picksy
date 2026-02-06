import { PhotoConfig } from "@/backend/schemas";
import React from "react";

type ImageViewProps = {
	src: string;
	alt?: string;
	config: PhotoConfig;
};

export const PhotoComponent: React.FC<ImageViewProps> = ({
	config,
	src,
	alt = "",
}) => {
	const { brightness, saturation, blur } = config;
	const filter = `brightness(${brightness ?? 100}%) saturate(${saturation ?? 50}%) blur(${blur ?? 0}px)`;
	return (
		<div
			style={{
				maxHeight: "70%",
				maxWidth: "70%",
				overflow: "hidden",
				display: "inline-block",
			}}
		>
			<img
				src={src}
				alt={alt}
				style={{
					maxHeight: "100%",
					maxWidth: "100%",
					objectFit: "contain",
					filter,
					display: "block",
				}}
			/>
		</div>
	);
};
