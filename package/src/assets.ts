import { definePlugin } from "astro-integration-kit";
import type {
	FontFaceData,
	IntegrationOptions,
	NormalizedFontFaceData,
} from "./types.js";
import { formatToExtension, parseFont } from "./css/render.js";
import { hasProtocol, joinRelativeURL, joinURL } from "ufo";
import { filename } from "pathe/utils";
import { hash } from "ohash";
import { extname } from "pathe";

export const assetsPlugin = definePlugin({
	name: "assetsPlugin",
	setup() {
		let assetsBaseURL: string;
		const renderedFontURLs = new Map<string, string>();

		return {
			"astro:config:setup": (params) => {
				const { config, command } = params;
				return {
					setupPublicAssetsStrategy: (
						options: IntegrationOptions["assets"],
					) => {
						assetsBaseURL = options?.prefix ?? "/_fonts";

						function normalizeFontData(
							faces: FontFaceData | FontFaceData[],
						): NormalizedFontFaceData[] {
							const data: NormalizedFontFaceData[] = [];
							for (const face of Array.isArray(faces) ? faces : [faces]) {
								data.push({
									...face,
									unicodeRange:
										face.unicodeRange === undefined ||
										Array.isArray(face.unicodeRange)
											? face.unicodeRange
											: [face.unicodeRange],
									src: (Array.isArray(face.src) ? face.src : [face.src]).map(
										(src) => {
											const source =
												typeof src === "string" ? parseFont(src) : src;
											if (
												"url" in source &&
												hasProtocol(source.url, {
													acceptRelative: true,
												})
											) {
												source.url = source.url.replace(/^\/\//, "https://");
												const file = [
													filename(source.url.replace(/\?.*/, "")),
													hash(source) +
														(extname(source.url) ||
															formatToExtension(source.format) ||
															""),
												]
													.filter(Boolean)
													.join("-");

												renderedFontURLs.set(file, source.url);
												source.originalURL = source.url;
												source.url =
													command === "dev"
														? joinRelativeURL(config.base, assetsBaseURL, file)
														: joinURL(assetsBaseURL, file);
											}
											return source;
										},
									),
								});
							}
							return data;
						}

						return { normalizeFontData };
					},
				};
			},
			"astro:server:setup": () => {
                // const { server } = params
				return {
                    registerFontsMiddleware: () => {}
                };
			},
		};
	},
});
