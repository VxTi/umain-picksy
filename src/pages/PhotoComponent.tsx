import { PhotoConfig } from "@/backend/schemas";
import { type ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

type ImageViewProps = ComponentProps<"div"> & {
	src: string;
	alt?: string;
	config: PhotoConfig;
};

export function PhotoComponent({
	config,
	src,
	alt = "",
	className,
	...props
}: ImageViewProps) {
	const { brightness, saturation, blur } = config;
	const filter = `brightness(${brightness ?? 100}%) saturate(${saturation ?? 50}%) blur(${blur ?? 0}px)`;
	return (
		<div
			className={twMerge(
				"overflow-hidden  size-full flex items-center justify-center",
				className,
			)}
			{...props}
		>
			<img
				src={src}
				alt={alt}
				className="size-3/4 object-contain block"
				style={{ filter }}
			/>
		</div>
	);
}
