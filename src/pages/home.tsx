import { ThemeToggle } from "@/components/theme-toggle";
import PicksyView from "../PicksyView";

export default function Home() {
	return (
		<main className="h-screen bg-background overflow-hidden">
			<div className="fixed top-4 right-4 z-50">
				<ThemeToggle />
			</div>
			<PicksyView />
		</main>
	);
}
