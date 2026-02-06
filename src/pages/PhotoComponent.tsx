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
			className='overflow-hidden  size-full flex items-center justify-center'
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
