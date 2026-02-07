import { Schema } from "effect";

export const FilterOption = Schema.Union(
	Schema.Struct({
		type: Schema.Literal("brightness"),
		value: Schema.Number,
	}),
	Schema.Struct({
		type: Schema.Literal("saturate"),
		value: Schema.Number,
	}),
	Schema.Struct({
		type: Schema.Literal("blur"),
		value: Schema.Number,
	}),
	Schema.Struct({
		type: Schema.Literal("contrast"),
		value: Schema.Number,
	}),
	Schema.Struct({
		type: Schema.Literal("sepia"),
		value: Schema.Number,
	}),
	Schema.Struct({
		type: Schema.Literal("grayscale"),
		value: Schema.Number,
	}),
	Schema.Struct({
		type: Schema.Literal("hue-rotate"),
		value: Schema.Number,
	}),
	Schema.Struct({
		type: Schema.Literal("invert"),
		value: Schema.Number,
	}),
	Schema.Struct({
		type: Schema.Literal("opacity"),
		value: Schema.Number,
	}),
);

export type FilterOption = Schema.Schema.Type<typeof FilterOption>;

export const PhotoConfig = Schema.Struct({
	filters: Schema.optional(Schema.Array(FilterOption)),
	transform: Schema.optional(
		Schema.Struct({
			rotate: Schema.optional(Schema.Number),
			scale: Schema.optional(Schema.Number),
			skewX: Schema.optional(Schema.Number),
			skewY: Schema.optional(Schema.Number),
		}),
	),
});

export const PhotoSchema = Schema.Struct({
	base64: Schema.String,
	id: Schema.String,
	image_path: Schema.String,
	filename: Schema.String,
	sync_status: Schema.optional(Schema.NullOr(Schema.String)),
	author_peer_id: Schema.optional(Schema.NullOr(Schema.String)),
	config: Schema.optional(
		Schema.NullOr(
			Schema.Union(
				PhotoConfig,
				Schema.transform(Schema.String, PhotoConfig, {
					decode: (s) => JSON.parse(s),
					encode: (c) => JSON.stringify(c),
				}),
			),
		),
	),
	favorite: Schema.optional(Schema.Boolean),
	stack_id: Schema.optional(Schema.NullOr(Schema.String)),
	is_stack_primary: Schema.optional(Schema.Boolean),
});

export type PhotoConfig = Schema.Schema.Type<typeof PhotoConfig>;
export type Photo = Schema.Schema.Type<typeof PhotoSchema>;
