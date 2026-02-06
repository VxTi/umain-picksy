import { Schema } from "effect";
import { PhotoSchema } from "./schemas";

type EventEntry = {
  result: Schema.Schema<any, any, any>;
};

const SetPhotosResultSchema = Schema.Struct({
  photos: Schema.Array(PhotoSchema),
});
export const EventsSchemas = {
  set_photos: {
    result: SetPhotosResultSchema,
  },
} as const satisfies Record<string, EventEntry>;

export type Events = keyof typeof EventsSchemas;
export type Result<C extends Events> = Schema.Schema.Type<
  (typeof EventsSchemas)[C]["result"]
>;
