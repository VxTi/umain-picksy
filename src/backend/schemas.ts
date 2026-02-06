import { Schema } from "effect";

export const OrientationSchema = Schema.String;

export const MetadataSchema = Schema.Struct({
  width: Schema.Int,
  height: Schema.Int,
  focalLength: Schema.String,
  orientation: OrientationSchema,
  cameraModel: Schema.String,
  creationDate: Schema.Date,
  modificationDate: Schema.Date,
}).pipe(
  Schema.extend(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
);

export const PhotoSchema = Schema.Struct({
  base64: Schema.String,
  id: Schema.String,
  filename: Schema.String,
  path: Schema.String,
  preview: Schema.optional(Schema.Uint8ArrayFromBase64),
  metadata: Schema.optional(MetadataSchema),
  sync_status: Schema.String,
});
