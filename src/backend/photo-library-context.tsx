import { CommandType } from "@/backend/commands";
import { SetLibraryResult } from "@/backend/events";
import { invoke } from "@/backend/invoke";
import { listen } from "@/backend/listen";
import { Photo } from "@/backend/schemas";
import { useCallbackEffect, useEffectEffect } from "@/effect-react";
import { Effect } from "effect";
import React, { Dispatch, SetStateAction } from "react";

export interface PhotoLibraryContextType {
	photos: Readonly<Photo[]>;
	setPhotos: Dispatch<SetStateAction<Readonly<Photo[]>>>;

	loading: boolean;

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
	const [loading, setLoading] = React.useState<boolean>(false);

	const addPhotosToLibrary = useCallbackEffect(
		() =>
			Effect.sync(() => setLoading(true)).pipe(
				Effect.zipRight(invoke(CommandType.ADD_PHOTOS_TO_LIBRARY, {})),
				Effect.ensuring(Effect.sync(() => setLoading(false))),
			),
		[],
	);

	const removePhotoFromLibrary = useCallbackEffect(
		(photo: Photo) =>
			Effect.sync(() => setLoading(true)).pipe(
				Effect.zipRight(
					invoke(CommandType.REMOVE_PHOTO_FROM_LIBRARY, { photoId: photo.id }),
				),
				Effect.ensuring(Effect.sync(() => setLoading(false))),
			),
		[],
	);

	const addPhotosFromFolder = useCallbackEffect(
		() =>
			Effect.sync(() => setLoading(true)).pipe(
				Effect.zipRight(invoke(CommandType.ADD_PHOTOS_FROM_FOLDER, {})),
				Effect.ensuring(Effect.sync(() => setLoading(false))),
			),
		[],
	);

	const clearLibrary = useCallbackEffect(
		() =>
			Effect.sync(() => setLoading(true)).pipe(
				Effect.zipRight(invoke(CommandType.CLEAR_LIBRARY, {})),
				Effect.ensuring(Effect.sync(() => setLoading(false))),
			),
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

			setLoading(true);
			yield* invoke(CommandType.GET_PHOTOS_FROM_LIBRARY, {}).pipe(
				Effect.tap((photos) => setPhotos(photos)),
				Effect.catchAllCause((cause) =>
					Effect.logError("Failed to get library photos", cause),
				),
				Effect.ensuring(Effect.sync(() => setLoading(false))),
			);
		}),
		[],
	);

	return (
		<PhotoLibraryContext.Provider
			value={{
				photos,
				setPhotos,
				loading,
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
