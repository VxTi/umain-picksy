import { Schema } from "effect";

export const PhotoConfig = Schema.Struct({
	brightness: Schema.optional(Schema.Number),
	saturation: Schema.optional(Schema.Number),
	blur: Schema.optional(Schema.Number),
});

export const PhotoSchema = Schema.Struct({
	base64: Schema.String,
	id: Schema.String,
	image_path: Schema.String,
	filename: Schema.String,
	sync_status: Schema.optional(Schema.NullOr(Schema.String)),
	author_peer_id: Schema.optional(Schema.NullOr(Schema.String)),
	config: Schema.optional(Schema.NullOr(PhotoConfig)),
	favorite: Schema.optional(Schema.Boolean),
	stack_id: Schema.optional(Schema.NullOr(Schema.String)),
	is_stack_primary: Schema.optional(Schema.Boolean),
});

export type PhotoConfig = Schema.Schema.Type<typeof PhotoConfig>;
export type Photo = Schema.Schema.Type<typeof PhotoSchema>;
