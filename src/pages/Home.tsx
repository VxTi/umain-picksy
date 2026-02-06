import { useCallback, useEffect, useState } from 'react';
import {
  listenToBackendCommands,
  type BackendCommand,
  type Photo
} from '@/backend/commandStream';
import { getLibraryPhotos } from '@/lib/library';
import { selectSourceFolder, addPhotoToLibrary } from '@/lib/vision';
import PicksyView from '../PicksyView';

export default function Home() {
  const [ photos, setPhotos ] = useState<Photo[]>([]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    listenToBackendCommands((command: BackendCommand) => {
      if (command.command === 'SetLibrary') {
        setPhotos(command.photos);
      }
    })
      .then((stop) => {
        unlisten = stop;
      })
      .catch((error) => {
        console.error('Failed to listen for backend commands', error);
      });

    getLibraryPhotos()
      .then((initialPhotos) => {
        setPhotos(initialPhotos);
      })
      .catch((error) => {
        console.error('Failed to fetch library photos', error);
      });

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  const handleAddPhoto = useCallback(async () => {
    await addPhotoToLibrary();
  }, []);

  const handleSelectFolder = useCallback(async () => {
    try {
      await selectSourceFolder();
    } catch (error) {
      console.error('Failed to select source folder', error);
    }
  }, []);

  return (
    <main className="container">
      <PicksyView
        photos={photos}
        onSelectFolder={handleSelectFolder}
        onAddPhoto={handleAddPhoto}
      />
    </main>
  );
}