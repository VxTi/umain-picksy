import { Schema } from "effect";
import { PhotoConfig, PhotoSchema } from "./schemas";

/** Ensures every command has both args and result schemas. */
type CommandEntry = {
	args: Schema.Schema<any, any, any>;
	result: Schema.Schema<any, any, any>;
};

const EmptySchema = Schema.NullOr(Schema.Struct({}));

const SavePhotoConfigArgsSchema = Schema.Struct({
	id: Schema.String,
	config: PhotoConfig,
});

const AddPhotosFromFolderArgsSchema = EmptySchema;
const AddPhotosFromFolderResultSchema = Schema.Array(PhotoSchema);

const AddPhotosToLibraryArgsSchema = EmptySchema;
const AddPhotosToLibraryResultSchema = Schema.Array(PhotoSchema);

const GetPhotosFromLibraryArgsSchema = EmptySchema;
const GetPhotosFromLibraryResultSchema = Schema.Array(PhotoSchema);

const RemovePhotoFromLibraryArgsSchema = Schema.Struct({
	photoId: Schema.String,
});

export const enum CommandType {
	ADD_PHOTOS_FROM_FOLDER = "add_photos_from_folder",
	CLEAR_LIBRARY = "clear_library",
	ADD_PHOTOS_TO_LIBRARY = "add_photos_to_library",
	REMOVE_PHOTO_FROM_LIBRARY = "remove_photo_from_library",
	GET_PHOTOS_FROM_LIBRARY = "get_photos_from_library",
	SAVE_PHOTO_CONFIG = "save_photo_config",
}

export const CommandSchemas = {
	[CommandType.ADD_PHOTOS_FROM_FOLDER]: {
		args: AddPhotosFromFolderArgsSchema,
		result: AddPhotosFromFolderResultSchema,
	},
	[CommandType.ADD_PHOTOS_TO_LIBRARY]: {
		args: AddPhotosToLibraryArgsSchema,
		result: AddPhotosToLibraryResultSchema,
	},

	[CommandType.GET_PHOTOS_FROM_LIBRARY]: {
		args: GetPhotosFromLibraryArgsSchema,
		result: GetPhotosFromLibraryResultSchema,
	},
	[CommandType.CLEAR_LIBRARY]: {
		args: EmptySchema,
		result: EmptySchema,
	},
	[CommandType.REMOVE_PHOTO_FROM_LIBRARY]: {
		args: RemovePhotoFromLibraryArgsSchema,
		result: EmptySchema,
	},
	[CommandType.SAVE_PHOTO_CONFIG]: {
		args: SavePhotoConfigArgsSchema,
		result: EmptySchema,
	},
} as const satisfies Record<string, CommandEntry>;

export type Command = keyof typeof CommandSchemas;
export type Args<C extends Command> = Schema.Schema.Type<
	(typeof CommandSchemas)[C]["args"]
>;
export type Result<C extends Command> = Schema.Schema.Type<
	(typeof CommandSchemas)[C]["result"]
>;
