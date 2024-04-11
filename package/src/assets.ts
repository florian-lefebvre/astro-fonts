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
import { extname, join } from "pathe";
import { cacheBase, storage } from "./cache.js";
import fs from "node:fs";
import type { AstroConfig } from "astro";
import { fileURLToPath } from "node:url";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export const assetsPlugin = definePlugin({
	name: "assetsPlugin",
	setup() {
		let assetsBaseURL: string;
		let config: AstroConfig;
		const renderedFontURLs = new Map<string, string>();

		return {
			"astro:config:setup": (params) => {
				config = params.config;
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
													params.command === "dev"
														? joinRelativeURL(
																params.config.base,
																assetsBaseURL,
																file,
															)
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
			"astro:server:setup": (params) => {
				const { server } = params;
				return {
					registerFontsMiddleware: () => {
						server.middlewares.use(assetsBaseURL, async (req, res, next) => {
							if (!req.url) {
								return next();
							}
							const filename = req.url.slice(1);
							const url = renderedFontURLs.get(filename);
							if (!url) {
								return next();
							}
							const key = `data:fonts:${filename}`;
							let storageRes = await storage.getItemRaw(key);
							if (!storageRes) {
								storageRes = await fetch(url)
									.then((r) => r.arrayBuffer())
									.then((r) => Buffer.from(r));
								await storage.setItemRaw(key, storageRes);
							}
							res.setHeader("Cache-Control", `max-age=${ONE_YEAR_IN_SECONDS}`);
							res.end(storageRes);
						});
					},
				};
			},
			"astro:build:done": (params) => {
				const { logger } = params;
				const cacheDir = join(fileURLToPath(config.root), cacheBase);

				return {
					buildFonts: async () => {
						fs.rmSync(cacheDir, { recursive: true, force: true });
						fs.mkdirSync(cacheDir, { recursive: true });
						let banner = false;
						for (const [filename, url] of renderedFontURLs) {
							const key = `data:fonts:${filename}`;
							// Use storage to cache the font data between builds
							let res = await storage.getItemRaw(key);
							if (!res) {
								if (!banner) {
									banner = true;
									logger.info("Downloading fonts...");
								}
								logger.info(`  ├─ ${url}`);
								res = await fetch(url)
									.then((r) => r.arrayBuffer())
									.then((r) => Buffer.from(r));
								await storage.setItemRaw(key, res);
							}
							fs.writeFileSync(join(cacheDir, filename), res);
						}
						if (banner) {
							logger.info("Fonts downloaded and cached.");
						}
					},
				};
			},
		};
	},
});
