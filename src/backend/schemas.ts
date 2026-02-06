import { Schema } from "effect";

export const PhotoSchema = Schema.Struct({
  path: Schema.String,
  content: Schema.Uint8ArrayFromBase64,
});
