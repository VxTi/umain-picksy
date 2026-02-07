import { ButtonProps } from "@/components/ui/button";
import { ButtonWithTooltip } from "@/components/ui/button-with-tooltip";
import { twMerge } from "tailwind-merge";

export default function HeaderMenuButton({
	className,
	...props
}: ButtonProps & { tooltip: string }) {
	return (
		<ButtonWithTooltip
			variant="ghost"
			size="icon-sm"
			className={twMerge(
				"*:size-4 text-muted-foreground hover:text-foreground",
				className,
			)}
			{...props}
		/>
	);
}
