import { usePhotos } from "@/backend/hooks";
import { useCallback } from "react";

import { selectSourceFolder, analyzeImageMetadata } from "@/lib/vision";
import PicksyView from "../PicksyView";

function Home() {
  const photos = usePhotos();

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

  return (
    <main className="container">
      <PicksyView photos={photos} onSelectFolder={handleSelectFolder} />
    </main>
  );
}

export default Home;
