import { Schema } from "effect";

/** Ensures every command has both args and result schemas. */
type CommandEntry = {
  args: Schema.Schema<any, any, any>;
  result: Schema.Schema<any, any, any>;
};

const PhotoSchema = Schema.Struct({ id: Schema.String });
const ListPhotosArgsSchema = Schema.Struct({});
const ListPhotosResultSchema = Schema.Struct({
  photos: Schema.Array(PhotoSchema),
});

export const CommandSchemas = {
  list_photos: {
    args: ListPhotosArgsSchema,
    result: ListPhotosResultSchema,
  },
} as const satisfies Record<string, CommandEntry>;

export type Command = keyof typeof CommandSchemas;
export type Args<C extends Command> = (typeof CommandSchemas)[C]["args"] extends
  Schema.Schema<infer A, any, any>
  ? A
  : never;
export type Result<C extends Command> =
  (typeof CommandSchemas)[C]["result"] extends Schema.Schema<infer A, any, any>
    ? A
    : never;
