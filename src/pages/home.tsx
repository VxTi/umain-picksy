import { usePhotoLibrary } from "@/backend/photo-library-context";
import PicksyView from "../PicksyView";

export default function Home() {
	const { addPhotosToLibrary, addPhotosFromFolder, clearLibrary, photos } =
		usePhotoLibrary();

	return (
		<main className="h-screen bg-background overflow-hidden">
			<PicksyView
				photos={photos}
				onSelectFolder={addPhotosFromFolder}
				onAddPhoto={addPhotosToLibrary}
				onClearLibrary={clearLibrary}
			/>
		</main>
	);
}
