import { z } from "astro/zod";

const remoteFontSourceSchema = z.object({
	url: z.string().url(),
	originalURL: z.string().url().optional(),
	format: z.string().optional(),
	tech: z.string().optional(),
});

const localFontSourceSchema = z.object({
	name: z.string(),
});

const fontSourceSchema = z.union([
	z.string(),
	localFontSourceSchema,
	remoteFontSourceSchema,
]);

const fontFamilyOverridesSchema = z.object({
	name: z.string(),
	global: z.boolean().optional(),
});

const fontFaceDataSchema = z.object({
	src: z.union([fontSourceSchema, z.array(fontSourceSchema)]),
	// .transform((src) => (Array.isArray(src) ? src : [src])),
	display: z
		.enum(["auto", "block", "swap", "fallback", "optional"])
		.default("swap"),
	weight: z
		.union([z.string(), z.number(), z.tuple([z.number(), z.number()])])
		.optional(),
	stretch: z.string().optional(),
	style: z.string().optional(),
	unicodeRange: z.union([z.string(), z.array(z.string())]).optional(),
	featureSettings: z.string().optional(),
	variationSettings: z.string().optional(),
});

const fontFamilyManualOverrideSchema = z
	.object({
		fallbacks: z.array(z.string()).optional(),
	})
	.merge(fontFamilyOverridesSchema)
	.merge(fontFaceDataSchema);

const resolveFontFacesOptionsSchema = z.object({
	weights: z.array(z.string()),
	styles: z.array(z.enum(["normal", "itatlic", "oblique"])),
	subsets: z.array(z.string()),
	fallbacks: z.array(z.string()),
});

const fontFamilyProviderOverrideSchema = z
	.object({
		provider: z.string().optional(),
	})
	.merge(fontFamilyOverridesSchema)
	.merge(
		resolveFontFacesOptionsSchema
			.omit({ weights: true })
			.merge(z.object({ weights: z.array(z.union([z.string(), z.number()])) }))
			.partial(),
	);

const genericCssFamiliesSchema = z.enum([
	"serif",
	"sans-serif",
	"monospace",
	"cursive",
	"fantasy",
	"system-ui",
	"ui-serif",
	"ui-sans-serif",
	"ui-monospace",
	"ui-rounded",
	"emoji",
	"math",
	"fangsong",
]);

const awaitableSchema = <T extends z.ZodTypeAny>(schema: T) =>
	z.union([schema, z.promise(schema)]);

const fontProviderSchema = z.object({
	setup: z
		.function()
		.args(z.record(z.string(), z.unknown()))
		.returns(awaitableSchema(z.void()))
		.optional(),
	resolveFontFaces: z
		.function()
		.args(z.string(), resolveFontFacesOptionsSchema)
		.returns(
			awaitableSchema(
				z.union([
					z.void(),
					z.object({
						fonts: z.union([fontFaceDataSchema, z.array(fontFaceDataSchema)]),
						fallbacks: z.array(z.string()).optional(),
					}),
				]),
			),
		)
		.optional(),
});

export const optionsSchema = z
	.object({
		families: z
			.array(
				z.union([
					fontFamilyManualOverrideSchema,
					fontFamilyProviderOverrideSchema,
				]),
			)
			.optional(),
		defaults: z
			.object({
				weights: z.array(z.union([z.string(), z.number()])),
				fallbacks: z
					.record(genericCssFamiliesSchema, z.array(z.string()).optional())
					.optional(),
			})
			.merge(
				resolveFontFacesOptionsSchema.pick({ styles: true, subsets: true }),
			)
			.partial()
			.optional(),
		providers: z.array(fontProviderSchema).optional(),
		assets: z
			.object({
				prefix: z.string().default("/_fonts"),
			})
			.optional(),
		experimental: z
			.object({
				processCSSVariables: z.boolean().default(false),
				addPreloadLinks: z.boolean().default(false),
			})
			.optional(),
	})
	.default({});
