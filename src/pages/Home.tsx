import { usePhotos } from "@/backend/hooks";
import { useCallback } from "react";

import {
  selectSourceFolder,
  addPhotoToLibrary,
  analyzeImageMetadata,
} from "@/lib/vision";
import { clearLibrary } from "@/lib/library";
import PicksyView from "../PicksyView";

export default function Home() {
  const photos = usePhotos();

  const handleAddPhoto = useCallback(async () => {
    await addPhotoToLibrary();
  }, []);

  const handleSelectFolder = useCallback(async () => {
    try {
      const result = await selectSourceFolder();

      console.log(result);
      if (result && result.length > 0) {
        const metadata = await Promise.all(
          result.map((r) => analyzeImageMetadata(r.image_path)),
        );
        console.log(metadata);
      }
    } catch (error) {
      console.error("Failed to select source folder", error);
    }
  }, []);

  const handleClearLibrary = useCallback(async () => {
    try {
      await clearLibrary();
    } catch (error) {
      console.error("Failed to clear library", error);
    }
  }, []);

  return (
    <main className="container bg-gray-100 min-h-screen">
      <PicksyView
        photos={photos}
        onSelectFolder={handleSelectFolder}
        onAddPhoto={handleAddPhoto}
        onClearLibrary={handleClearLibrary}
      />
    </main>
  );
}