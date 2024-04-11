import { z } from "astro/zod";
import { genericCssFamilySchema } from "./css/parse.js";

export const remoteFontSourceSchema = z.object({
	url: z.string().url(),
	originalURL: z.string().url().optional(),
	format: z.string().optional(),
	tech: z.string().optional(),
});

export const localFontSourceSchema = z.object({
	name: z.string(),
});

export const fontSourceSchema = z.union([
	z.string(),
	localFontSourceSchema,
	remoteFontSourceSchema,
]);

export const fontFamilyOverridesSchema = z.object({
	name: z.string(),
	global: z.boolean().optional(),
});

export const fontFaceDataSchema = z.object({
	src: z.union([fontSourceSchema, z.array(fontSourceSchema)]),
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

export const fontFamilyManualOverrideSchema = z
	.object({
		fallbacks: z.array(z.string()).optional(),
	})
	.merge(fontFamilyOverridesSchema)
	.merge(fontFaceDataSchema);

export const resolveFontFacesOptionsSchema = z.object({
	weights: z.array(z.string()),
	styles: z.array(z.enum(["normal", "italic", "oblique"])),
	subsets: z.array(z.string()),
	fallbacks: z.array(z.string()),
});

export const fontFamilyProviderOverrideSchema = z
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

const awaitableSchema = <T extends z.ZodTypeAny>(schema: T) =>
	z.union([schema, z.promise(schema)]);

export const fontProviderSchema = z.object({
	name: z.string(),
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

export const optionsSchema = z.object({
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
				.record(genericCssFamilySchema, z.array(z.string()).optional())
				.optional(),
		})
		.merge(resolveFontFacesOptionsSchema.pick({ styles: true, subsets: true }))
		.partial()
		.optional(),
	providers: z.array(fontProviderSchema).min(1),
	assets: z
		.object({
			prefix: z.string().optional(),
		})
		.optional(),
	experimental: z
		.object({
			processCSSVariables: z.boolean().default(false),
			addPreloadLinks: z.boolean().default(false),
		})
		.optional(),
});
