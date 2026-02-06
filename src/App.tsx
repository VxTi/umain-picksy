import { useCallback, useEffect, useState } from "react";
import "./App.css";
import PicksyView from "./PicksyView";
import {
  listenToBackendCommands,
  type BackendCommand,
  type Photo,
} from "./backend/commandStream";
import { getLibraryPhotos } from "./lib/library";
import { selectSourceFolder } from "./lib/vision";

function App() {
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
      console.log(await selectSourceFolder());
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

export default App;
