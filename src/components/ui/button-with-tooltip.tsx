import * as React from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface ButtonWithTooltipProps extends React.ComponentProps<typeof Button> {
	tooltip?: React.ReactNode;
}

export const ButtonWithTooltip = React.forwardRef<
	HTMLButtonElement,
	ButtonWithTooltipProps
>(({ tooltip, children, ...props }, ref) => {
	if (!tooltip || typeof tooltip !== "string" || !tooltip.trim().length) {
		return (
			<Button ref={ref} {...props}>
				{children}
			</Button>
		);
	}

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button ref={ref} {...props}>
					{children}
				</Button>
			</TooltipTrigger>
			<TooltipContent>{tooltip}</TooltipContent>
		</Tooltip>
	);
});
ButtonWithTooltip.displayName = "ButtonWithTooltip";
