import { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

export default function ScreenWrapper({
	className,
	...props
}: ComponentProps<"div">) {
	return (
		<main
			className={twMerge(
				"bg-background text-foreground w-screen h-screen flex flex-col overflow-hidden",
				className,
			)}
			{...props}
		/>
	);
}
