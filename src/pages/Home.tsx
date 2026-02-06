import { useCallback, useEffect, useState } from "react";
import {
  listenToBackendCommands,
  type BackendCommand,
  type Photo,
} from "../backend/commandStream";
import { getLibraryPhotos } from "../lib/library";
import { selectSourceFolder, analyzeImageMetadata } from '../lib/vision';
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PicksyView from "../PicksyView";

function Home() {
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    listenToBackendCommands((command: BackendCommand) => {
      if (command.command === "SetLibrary") {
        setPhotos(command.photos);
      }
    })
      .then((stop) => {
        unlisten = stop;
      })
      .catch((error) => {
        console.error("Failed to listen for backend commands", error);
      });

    getLibraryPhotos()
      .then((initialPhotos) => {
        setPhotos(initialPhotos);
      })
      .catch((error) => {
        console.error("Failed to fetch library photos", error);
      });

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  const handleSelectFolder = useCallback(async () => {
    try {
      const result = await selectSourceFolder();
      if (result && result.length > 0) {
        const metadata = await Promise.all(result.map(r => analyzeImageMetadata(r)));
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
