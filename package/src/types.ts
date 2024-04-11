import type { z } from "astro/zod";
import type {
	fontFaceDataSchema,
	fontFamilyManualOverrideSchema,
	fontFamilyOverridesSchema,
	fontFamilyProviderOverrideSchema,
	fontProviderSchema,
	fontSourceSchema,
	localFontSourceSchema,
	remoteFontSourceSchema,
	resolveFontFacesOptionsSchema,
	optionsSchema,
} from "./schemas.js";

export type RemoteFontSource = z.infer<typeof remoteFontSourceSchema>;
export type LocalFontSource = z.infer<typeof localFontSourceSchema>;
export type FontSource = z.infer<typeof fontSourceSchema>;
export type FontFamilyOverrides = z.infer<typeof fontFamilyOverridesSchema>;
export type FontFaceData = z.infer<typeof fontFaceDataSchema>;
export type FontFamilyManualOverride = z.infer<
	typeof fontFamilyManualOverrideSchema
>;
export type ResolveFontFacesOptions = z.infer<
	typeof resolveFontFacesOptionsSchema
>;
export type FontFamilyProviderOverride = z.infer<
	typeof fontFamilyProviderOverrideSchema
>;
export type FontProvider = z.infer<typeof fontProviderSchema>;
export type IntegrationOptions = z.infer<typeof optionsSchema>;
export type NormalizedFontFaceData = Omit<
	FontFaceData,
	"src" | "unicodeRange"
> & {
	src: Array<LocalFontSource | RemoteFontSource>;
	unicodeRange?: string[] | undefined;
};
