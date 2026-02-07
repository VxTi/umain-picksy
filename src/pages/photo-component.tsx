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
	const filter = Array.isArray(config)
		? config
				.map((opt) => {
					switch (opt.type) {
						case "brightness":
							return `brightness(${opt.value}%)`;
						case "saturate":
							return `saturate(${opt.value}%)`;
						case "blur":
							return `blur(${opt.value}px) `;
						case "contrast":
							return `contrast(${opt.value}%)`;
						case "sepia":
							return `sepia(${opt.value}%)`;
						case "grayscale":
							return `grayscale(${opt.value}%)`;
						case "hue-rotate":
							return `hue-rotate(${opt.value}deg)`;
						case "invert":
							return `invert(${opt.value}%)`;
						case "opacity":
							return `opacity(${opt.value}%)`;
						default:
							return "";
					}
				})
				.join(" ")
		: "";

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
