import { useEffect, useState } from "react";
import "./App.css";
import PicksyView from "./PicksyView";
import {
  listenToBackendCommands,
  type BackendCommand,
  type Photo,
} from "./backend/commandStream";

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

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  return (
    <main className="container">
      <PicksyView photos={photos} />
    </main>
  );
}

export default App;
