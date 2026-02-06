import { Schema } from "effect";
import { PhotoSchema } from "./schemas";

type EventEntry = {
  result: Schema.Schema<any, any, any>;
};

const SetLibraryResultSchema = Schema.Struct({
  photos: Schema.Array(PhotoSchema),
});
export type SetLibraryResult = Schema.Schema.Type<
  typeof SetLibraryResultSchema
>;

export const EventsSchemas = {
  SetLibrary: {
    result: SetLibraryResultSchema,
  },
} as const satisfies Record<string, EventEntry>;

export type Events = keyof typeof EventsSchemas;
export type Result<C extends Events> = Schema.Schema.Type<
  (typeof EventsSchemas)[C]["result"]
>;
