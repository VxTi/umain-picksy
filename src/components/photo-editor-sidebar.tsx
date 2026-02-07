import { Slider } from "@/components/ui/slider";
import {
	BlendIcon,
	DropletIcon,
	SunIcon,
	Trash2Icon,
	GripVerticalIcon,
	PlusIcon,
	ContrastIcon,
	SparklesIcon,
	MonitorIcon,
	RotateCwIcon,
	LayersIcon,
	EyeOffIcon,
	MaximizeIcon,
	ScissorsIcon,
} from "lucide-react";
import { FilterOption, PhotoConfig } from "@/backend/schemas";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Props = {
	config: PhotoConfig;
	onConfigChange: (config: PhotoConfig) => void;
};

const FILTER_TYPES: {
	type: FilterOption["type"];
	label: string;
	icon: any;
	min: number;
	max: number;
	step: number;
	unit: string;
	defaultValue: number;
}[] = [
	{
		type: "brightness",
		label: "Brightness",
		icon: SunIcon,
		min: 0,
		max: 200,
		step: 1,
		unit: "%",
		defaultValue: 100,
	},
	{
		type: "saturate",
		label: "Saturation",
		icon: BlendIcon,
		min: 0,
		max: 200,
		step: 1,
		unit: "%",
		defaultValue: 100,
	},
	{
		type: "blur",
		label: "Blur",
		icon: DropletIcon,
		min: 0,
		max: 20,
		step: 0.1,
		unit: "px",
		defaultValue: 0,
	},
	{
		type: "contrast",
		label: "Contrast",
		icon: ContrastIcon,
		min: 0,
		max: 200,
		step: 1,
		unit: "%",
		defaultValue: 100,
	},
	{
		type: "sepia",
		label: "Sepia",
		icon: SparklesIcon,
		min: 0,
		max: 100,
		step: 1,
		unit: "%",
		defaultValue: 0,
	},
	{
		type: "grayscale",
		label: "Grayscale",
		icon: MonitorIcon,
		min: 0,
		max: 100,
		step: 1,
		unit: "%",
		defaultValue: 0,
	},
	{
		type: "hue-rotate",
		label: "Hue Rotate",
		icon: RotateCwIcon,
		min: 0,
		max: 360,
		step: 1,
		unit: "deg",
		defaultValue: 0,
	},
	{
		type: "invert",
		label: "Invert",
		icon: LayersIcon,
		min: 0,
		max: 100,
		step: 1,
		unit: "%",
		defaultValue: 0,
	},
	{
		type: "opacity",
		label: "Opacity",
		icon: EyeOffIcon,
		min: 0,
		max: 100,
		step: 1,
		unit: "%",
		defaultValue: 100,
	},
];

export default function PhotoEditorSidebar({ config, onConfigChange }: Props) {
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

	const addFilter = (type: FilterOption["type"]) => {
		const filterType = FILTER_TYPES.find((f) => f.type === type);
		if (!filterType) return;

		const currentFilters = config.filters ?? [];
		onConfigChange({
			...config,
			filters: [...currentFilters, { type, value: filterType.defaultValue }],
		});
	};

	const updateFilterValue = (index: number, value: number) => {
		const newFilters = [...(config.filters ?? [])];
		newFilters[index] = { ...newFilters[index], value };
		onConfigChange({ ...config, filters: newFilters });
	};

	const removeFilter = (index: number) => {
		onConfigChange({
			...config,
			filters: (config.filters ?? []).filter((_, i) => i !== index),
		});
	};

	const updateTransform = (key: string, value: number) => {
		onConfigChange({
			...config,
			transform: {
				...(config.transform ?? {
					rotate: 0,
					scale: 1,
					skewX: 0,
					skewY: 0,
				}),
				[key]: value,
			},
		});
	};

	const handleDragStart = (e: React.DragEvent, index: number) => {
		setDraggedIndex(index);
		e.dataTransfer.effectAllowed = "move";
	};

	const handleDragOver = (e: React.DragEvent, index: number) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
		if (draggedIndex === null || draggedIndex === index) return;

		const newFilters = [...(config.filters ?? [])];
		const item = newFilters.splice(draggedIndex, 1)[0];
		newFilters.splice(index, 0, item);
		onConfigChange({ ...config, filters: newFilters });
		setDraggedIndex(index);
	};

	const handleDragEnd = () => {
		setDraggedIndex(null);
	};

	const filters = config.filters ?? [];
	const transform = config.transform ?? {
		rotate: 0,
		scale: 1,
		skewX: 0,
		skewY: 0,
	};

	return (
		<div className="w-87.5 py-2 flex flex-col">
			<div className="h-full w-full flex flex-col bg-background rounded-l-xl border-t grow border-l border-b border-border overflow-hidden">
				<Tabs defaultValue="filters" className="flex flex-col h-full">
					<div className="px-6 pt-6">
						<TabsList className="w-full">
							<TabsTrigger value="filters" className="flex-1">
								Filters
							</TabsTrigger>
							<TabsTrigger value="transform" className="flex-1">
								Transform
							</TabsTrigger>
						</TabsList>
					</div>

					<TabsContent
						value="filters"
						className="flex-1 overflow-y-auto p-6 mt-0 space-y-6"
					>
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-semibold">Filters</h3>
							<Select onValueChange={(value) => addFilter(value as any)}>
								<SelectTrigger className="w-[120px]">
									<PlusIcon className="mr-2 h-4 w-4" />
									<SelectValue placeholder="Add" />
								</SelectTrigger>
								<SelectContent>
									{FILTER_TYPES.map((f) => (
										<SelectItem key={f.type} value={f.type}>
											<div className="flex items-center gap-2">
												<f.icon className="size-4" />
												{f.label}
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-4">
							{filters.map((filter, index) => {
								const filterType = FILTER_TYPES.find(
									(f) => f.type === filter.type,
								);
								if (!filterType) return null;
								const Icon = filterType.icon;

								return (
									<div
										key={`${filter.type}-${index}`}
										draggable
										onDragStart={(e) => handleDragStart(e, index)}
										onDragOver={(e) => handleDragOver(e, index)}
										onDragEnd={handleDragEnd}
										className={cn(
											"space-y-3 p-3 rounded-lg border bg-card transition-colors",
											draggedIndex === index && "opacity-50 border-primary",
										)}
									>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<GripVerticalIcon className="size-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
												<Icon className="size-4" />
												<span className="text-sm font-medium">
													{filterType.label}
												</span>
											</div>
											<Button
												variant="ghost"
												size="icon-xs"
												onClick={() => removeFilter(index)}
											>
												<Trash2Icon className="size-3" />
											</Button>
										</div>

										<div className="space-y-2">
											<div className="text-xs text-muted-foreground flex justify-between">
												<span>Value</span>
												<span>
													{filter.value}
													{filterType.unit}
												</span>
											</div>
											<Slider
												value={[filter.value]}
												onValueChange={(v) => updateFilterValue(index, v[0])}
												min={filterType.min}
												max={filterType.max}
												step={filterType.step}
											/>
										</div>
									</div>
								);
							})}

							{filters.length === 0 && (
								<div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
									No filters applied
								</div>
							)}
						</div>
					</TabsContent>

					<TabsContent
						value="transform"
						className="flex-1 overflow-y-auto p-6 mt-0 space-y-6"
					>
						<h3 className="text-lg font-semibold">Transform</h3>

						<div className="space-y-6">
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<RotateCwIcon className="size-4" />
									<span className="text-sm font-medium">Rotation</span>
								</div>
								<div className="text-xs text-muted-foreground flex justify-between">
									<span>Angle</span>
									<span>{transform.rotate ?? 0}°</span>
								</div>
								<Slider
									value={[transform.rotate ?? 0]}
									onValueChange={(v) => updateTransform("rotate", v[0])}
									min={-180}
									max={180}
									step={1}
								/>
							</div>

							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<MaximizeIcon className="size-4" />
									<span className="text-sm font-medium">Scale</span>
								</div>
								<div className="text-xs text-muted-foreground flex justify-between">
									<span>Factor</span>
									<span>{(transform.scale ?? 1).toFixed(2)}x</span>
								</div>
								<Slider
									value={[transform.scale ?? 1]}
									onValueChange={(v) => updateTransform("scale", v[0])}
									min={0.1}
									max={3}
									step={0.01}
								/>
							</div>

							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<ScissorsIcon className="size-4" />
									<span className="text-sm font-medium">Skew X</span>
								</div>
								<div className="text-xs text-muted-foreground flex justify-between">
									<span>Angle</span>
									<span>{transform.skewX ?? 0}°</span>
								</div>
								<Slider
									value={[transform.skewX ?? 0]}
									onValueChange={(v) => updateTransform("skewX", v[0])}
									min={-45}
									max={45}
									step={1}
								/>
							</div>

							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<ScissorsIcon className="size-4" />
									<span className="text-sm font-medium">Skew Y</span>
								</div>
								<div className="text-xs text-muted-foreground flex justify-between">
									<span>Angle</span>
									<span>{transform.skewY ?? 0}°</span>
								</div>
								<Slider
									value={[transform.skewY ?? 0]}
									onValueChange={(v) => updateTransform("skewY", v[0])}
									min={-45}
									max={45}
									step={1}
								/>
							</div>
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
