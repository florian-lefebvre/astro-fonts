import {
	addVirtualImports,
	addVitePlugin,
	defineIntegration,
	withPlugins,
} from "astro-integration-kit";
import { optionsSchema } from "./schemas.js";
import { normalizeOptions } from "./options.js";
import { assetsPlugin } from "./assets.js";
import type {
	FontFamilyManualOverride,
	FontFamilyProviderOverride,
} from "./types.js";
import type { GenericCSSFamily } from "./css/parse.js";
import {
	FontFamilyInjectionPlugin,
	type FontFaceResolution,
} from "./plugins/transform.js";
import { generateFontFace } from "./css/render.js";

export const integration = defineIntegration({
	name: "@astrolicious/fonts",
	optionsSchema,
	setup({ options, name }) {
		const { normalizedDefaults } = normalizeOptions(options);

		const { providers } = options;

		return withPlugins({
			name,
			plugins: [assetsPlugin],
			hooks: {
				"astro:config:setup": async ({
					setupPublicAssetsStrategy,
					...params
				}) => {
					const { logger, command, injectScript } = params;
					await Promise.all(providers.map((p) => p.setup?.({}, logger)));

					const { normalizeFontData } = setupPublicAssetsStrategy(
						options.assets,
					);

					async function resolveFontFaceWithOverride(
						fontFamily: string,
						override?: FontFamilyManualOverride | FontFamilyProviderOverride,
						fallbackOptions?: {
							fallbacks: string[];
							generic?: GenericCSSFamily;
						},
					): Promise<FontFaceResolution | undefined> {
						const fallbacks =
							override?.fallbacks ||
							normalizedDefaults.fallbacks[
								fallbackOptions?.generic || "sans-serif"
							];

						if (override && "src" in override) {
							const fonts = normalizeFontData({
								src: override.src,
								display: override.display,
								weight: override.weight,
								style: override.style,
							});
							return {
								fallbacks,
								fonts,
							};
						}

						// Respect fonts that should not be resolved through `@nuxt/fonts`
						if (override?.provider === "none") {
							return;
						}

						// Respect custom weights, styles and subsets options
						const defaults = { ...normalizedDefaults, fallbacks };
						for (const key of ["weights", "styles", "subsets"] as const) {
							const value = override?.[key];
							if (value) {
								defaults[key as "weights"] = value.map((v) => String(v));
							}
						}

						// Handle explicit provider
						if (override?.provider) {
							const foundProvider = providers.find(
								(p) => p.name === override.provider,
							);
							if (foundProvider) {
								const result = await foundProvider.resolveFontFaces?.(
									fontFamily,
									defaults,
									logger,
								);
								// Rewrite font source URLs to be proxied/local URLs
								const fonts = normalizeFontData(result?.fonts || []);
								if (!fonts.length || !result) {
									logger.warn(
										`Could not produce font face declaration from \`${override.provider}\` for font family \`${fontFamily}\`.`,
									);
									return;
								}
								return {
									fallbacks: result.fallbacks || defaults.fallbacks,
									fonts,
								};
							}

							// If not registered, log and fall back to default providers
							logger.warn(
								`Unknown provider \`${override.provider}\` for font family \`${fontFamily}\`. Falling back to default providers.`,
							);
						}
						return;
					}

					const virtualImportId = "virtual:@astrolicious/fonts/main.css";

					const virtualImportContent = await (async () => {
						let css = "";
						for (const family of options.families || []) {
							if (!family.global) continue;
							const result = await resolveFontFaceWithOverride(
								family.name,
								family,
							);
							for (const font of result?.fonts || []) {
								// We only inject basic `@font-face` as metrics for fallbacks don't make sense
								// in this context unless we provide a name for the user to use elsewhere as a
								// `font-family`.
								css += `${generateFontFace(family.name, font)}\n`;
							}
						}
						return css;
					})();

					addVirtualImports(params, {
						name,
						imports: {
							[virtualImportId]: virtualImportContent,
						},
					});

					injectScript(
						"page-ssr",
						`import ${JSON.stringify(virtualImportId)};`,
					);

					const fontMap = new Map<string, Set<string>>();
					addVitePlugin(params, {
						plugin: FontFamilyInjectionPlugin({
							dev: command === "dev",
							fontMap,
							processCSSVariables:
								options.experimental?.processCSSVariables ?? false,
							async resolveFontFace(fontFamily, fallbackOptions) {
								const override = options.families?.find(
									(f) => f.name === fontFamily,
								);

								// This CSS will be injected in a separate location
								if (override?.global) {
									return;
								}

								return resolveFontFaceWithOverride(
									fontFamily,
									override,
									fallbackOptions,
								);
							},
						}).vite(),
					});
				},
				"astro:server:setup": ({ registerFontsMiddleware }) => {
					registerFontsMiddleware();
				},
				"astro:build:done": async ({ buildFonts }) => {
					await buildFonts();
				},
			},
		});
	},
});
