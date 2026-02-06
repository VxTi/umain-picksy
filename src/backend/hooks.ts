import { Effect } from "effect";
import { useState } from "react";
import { useEffectEffect } from "../effect-react";
import { SetLibraryResult } from "./events";
import { listen } from "./listen";
import { invoke } from "./invoke";
import { CommandType } from "./commands";

export function usePhotos() {
	const [photos, setPhotos] = useState<SetLibraryResult["photos"]>([]);

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
	return photos;
}
