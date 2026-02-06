import { CommandType } from "@/backend/commands";
import { SetLibraryResult } from "@/backend/events";
import { invoke } from "@/backend/invoke";
import { listen } from "@/backend/listen";
import { Photo } from "@/backend/schemas";
import { useCallbackEffect, useEffectEffect } from "@/effect-react";
import { Effect } from "effect";
import React from "react";

export interface PhotoLibraryContextType {
	photos: Readonly<Photo[]>;
	addPhotosFromFolder: () => Promise<Readonly<Photo[]>>;
	removePhotoFromLibrary: (photo: Photo) => Promise<{}>;
	clearLibrary: () => Promise<{}>;
	addPhotosToLibrary: () => Promise<Readonly<Photo[]>>;
}

export const PhotoLibraryContext =
	React.createContext<PhotoLibraryContextType | null>(null);

export function usePhotoLibrary() {
	const context = React.useContext(PhotoLibraryContext);

	if (!context) {
		throw new Error(
			"usePhotoLibrary must be used within a PhotoLibraryProvider",
		);
	}

	return context;
}

export function PhotoLibraryProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [photos, setPhotos] = React.useState<SetLibraryResult["photos"]>([]);

	const addPhotosToLibrary = useCallbackEffect(
		() => invoke(CommandType.ADD_PHOTOS_TO_LIBRARY, {}),
		[],
	);

	const removePhotoFromLibrary = useCallbackEffect(
		(photo: Photo) =>
			invoke(CommandType.REMOVE_PHOTO_FROM_LIBRARY, { photoId: photo.id }),
		[],
	);

	const addPhotosFromFolder = useCallbackEffect(
		() => invoke(CommandType.ADD_PHOTOS_FROM_FOLDER, {}),
		[],
	);

	const clearLibrary = useCallbackEffect(
		() => invoke(CommandType.CLEAR_LIBRARY, {}),
		[],
	);

	useEffectEffect(
		Effect.gen(function* () {
			yield* listen("SetLibrary", (event) => {
				setPhotos(event.photos);
			}).pipe(
				Effect.catchAllCause((cause) =>
					Effect.logError("Failed to listen for SetLibrary", cause),
				),
			);

			yield* invoke(CommandType.GET_PHOTOS_FROM_LIBRARY, {}).pipe(
				Effect.tap((photos) => setPhotos(photos)),
				Effect.catchAllCause((cause) =>
					Effect.logError("Failed to get library photos", cause),
				),
			);
		}),
		[],
	);

	return (
		<PhotoLibraryContext.Provider
			value={{
				photos,
				addPhotosToLibrary,
				removePhotoFromLibrary,
				addPhotosFromFolder,
				clearLibrary,
			}}
		>
			{children}
		</PhotoLibraryContext.Provider>
	);
}
