import { CommandType } from "@/backend/commands";
import type { SetLibraryResult } from "@/backend/events";
import { invoke } from "@/backend/invoke";
import { listen } from "@/backend/listen";
import type { Photo, PhotoConfig } from "@/backend/schemas";
import { useCallbackEffect, useEffectEffect } from "@/effect-react";
import { Effect } from "effect";
import React from "react";
import type { Dispatch, SetStateAction } from "react";

export interface PhotoLibraryContextType {
	photos: Readonly<Photo[]>;
	setPhotos: Dispatch<SetStateAction<Readonly<Photo[]>>>;

	loading: boolean;

	addPhotosFromFolder: () => Promise<Readonly<Photo[]>>;
	removePhotoFromLibrary: (
		photo: Photo,
	) => Promise<Record<string, never> | null>;
	clearLibrary: () => Promise<Record<string, never> | null>;
	addPhotosToLibrary: () => Promise<Readonly<Photo[]>>;

	saveImageConfig: (
		id: string,
		config: PhotoConfig,
	) => Promise<Record<string, never> | null>;
	setPhotoFavorite: (
		id: string,
		favorite: boolean,
	) => Promise<Record<string, never> | null>;
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
	const [loading, setLoading] = React.useState<boolean>(true);

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
					invoke(CommandType.REMOVE_PHOTO_FROM_LIBRARY, { id: photo.id }),
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

	const saveImageConfig = useCallbackEffect(
		(id: string, config: PhotoConfig) =>
			Effect.sync(() => setLoading(true)).pipe(
				Effect.zipRight(invoke(CommandType.SAVE_PHOTO_CONFIG, { id, config })),
				Effect.ensuring(Effect.sync(() => setLoading(false))),
			),
		[],
	);

	const setPhotoFavorite = useCallbackEffect(
		(id: string, favorite: boolean) =>
			Effect.sync(() =>
				setPhotos((prev) =>
					prev.map((photo) =>
						photo.id === id ? { ...photo, favorite } : photo,
					),
				),
			).pipe(
				Effect.zipRight(
					invoke(CommandType.SET_PHOTO_FAVORITE, { id, favorite }),
				),
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
				saveImageConfig,
				setPhotoFavorite,
			}}
		>
			{children}
		</PhotoLibraryContext.Provider>
	);
}
