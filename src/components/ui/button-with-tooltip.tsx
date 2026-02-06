import * as React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface ButtonWithTooltipProps extends React.ComponentProps<typeof Button> {
	tooltip?: React.ReactNode;
}

export function ButtonWithTooltip({
	tooltip,
	children,
	...props
}: ButtonWithTooltipProps) {
	if (!tooltip) {
		return <Button {...props}>{children}</Button>;
	}

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button {...props}>{children}</Button>
			</TooltipTrigger>
			<TooltipContent>{tooltip}</TooltipContent>
		</Tooltip>
	);
}
