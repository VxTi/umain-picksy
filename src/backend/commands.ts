import { Schema } from "effect";
import { PhotoSchema } from "./schemas";

/** Ensures every command has both args and result schemas. */
type CommandEntry = {
	args: Schema.Schema<any, any, any>;
	result: Schema.Schema<any, any, any>;
};

const OpenFolderArgsSchema = Schema.Struct({ folder: Schema.String });
const OpenFolderResultSchema = Schema.Struct({});

export const CommandSchemas = {
	open_folder: {
		args: OpenFolderArgsSchema,
		result: OpenFolderResultSchema,
	},
	get_library_photos: {
		args: Schema.Struct({}),
		result: Schema.Array(PhotoSchema),
	},
	clear_library: {
		args: Schema.Struct({}),
		result: Schema.Struct({}),
	},
} as const satisfies Record<string, CommandEntry>;

export type Command = keyof typeof CommandSchemas;
export type Args<C extends Command> = Schema.Schema.Type<
	(typeof CommandSchemas)[C]["args"]
>;
export type Result<C extends Command> = Schema.Schema.Type<
	(typeof CommandSchemas)[C]["result"]
>;
