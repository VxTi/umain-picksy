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
	image_path: Schema.String,
	filename: Schema.String,
	metadata: Schema.optional(MetadataSchema),
	author_peer_id: Schema.optional(Schema.String),
});

export type Photo = Schema.Schema.Type<typeof PhotoSchema>;

export type PhotoMetadata = Schema.Schema.Type<typeof MetadataSchema>;
