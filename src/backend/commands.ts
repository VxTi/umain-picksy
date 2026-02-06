import { Schema } from "effect";

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
} as const satisfies Record<string, CommandEntry>;

export type Command = keyof typeof CommandSchemas;
export type Args<C extends Command> = Schema.Schema.Type<
  (typeof CommandSchemas)[C]["args"]
>;
export type Result<C extends Command> = Schema.Schema.Type<
  (typeof CommandSchemas)[C]["result"]
>;
