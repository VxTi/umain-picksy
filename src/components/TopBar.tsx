import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

interface TopBarProps {
	title: string;
}

export function TopBar({ title }: TopBarProps) {
	const navigate = useNavigate();

	const handleDrag = () => {
		getCurrentWindow().startDragging();
	};

	return (
		<header
			className="flex items-center gap-2 py-2 px-4 border-b bg-gray-100 select-none cursor-default"
			onMouseDown={handleDrag}
		>
			<Button
				variant="ghost"
				size="icon-sm"
				onClick={(e) => {
					e.stopPropagation();
					navigate(-1);
				}}
				onMouseDown={(e) => e.stopPropagation()}
			>
				<ArrowLeft className="size-4 text-gray-600" />
			</Button>
			<h1 className="text-base font-semibold text-gray-700">{title}</h1>
		</header>
	);
}
