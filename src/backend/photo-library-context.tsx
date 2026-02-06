import { CommandType }                                from '@/backend/commands';
import { SetLibraryResult }                           from '@/backend/events';
import { invoke }                                     from '@/backend/invoke';
import { listen }                                     from '@/backend/listen';
import { Photo }                                      from '@/backend/schemas';
import { useEffectEffect }                            from '@/effect-react';
import { addPhotosToLibrary as addPhotosToLibrary$ } from '@/lib/vision';
import { Effect }                                     from 'effect';
import React, { useTransition }                       from 'react';

export interface PhotoLibraryContextType {
  photos: Readonly<Photo[]>;
  addPhotosFromFolder: () => Promise<Photo[]>;
  removePhotoFromLibrary: (photo: Photo) => void;
  clearLibrary: () => void;
  addPhotosToLibrary: () => Promise<Photo[]>;
  loading: boolean;
}

export const PhotoLibraryContext = React.createContext<PhotoLibraryContextType | null>(null);

export function usePhotoLibrary() {
  const context = React.useContext(PhotoLibraryContext);

  if (!context) {
    throw new Error('usePhotoLibrary must be used within a PhotoLibraryProvider');
  }

  return context;
}

export function PhotoLibraryProvider({children}: { children: React.ReactNode }) {
  const [ photos, setPhotos ]     = React.useState<SetLibraryResult['photos']>([]);
  const [ loading, startLoading ] = useTransition();

  const addPhotosToLibrary = () => {
    Effect.gen(function* () {
      startLoading(() => {
    };
  };

  const selectSourceFolder = () => {
    Effect.gen(function* () {
      yield* invoke(CommandType.ADD_PHOTOS_FROM_FOLDER, {});
    });
  };

  useEffectEffect(
    Effect.gen(function* () {
      yield* listen('SetLibrary', (event) => {
        setPhotos(event.photos);
      }).pipe(
        Effect.catchAllCause((cause) =>
                               Effect.logError('Failed to listen for SetLibrary', cause)
        )
      );
      yield* invoke(CommandType.GET_PHOTOS_FROM_LIBRARY, {}).pipe(
        Effect.tap((photos) => setPhotos(photos)),
        Effect.catchAllCause((cause) =>
                               Effect.logError('Failed to get library photos', cause)
        )
      );
    }),
    []
  );

  return (
    <PhotoLibraryContext.Provider value={{
      photos,
      loading,
      addPhotosToLibrary,
      selectSourceFolder
    }}>{children}</PhotoLibraryContext.Provider>
  );
}