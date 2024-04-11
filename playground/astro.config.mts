import tailwind from "@astrojs/tailwind";
import { createResolver } from "astro-integration-kit";
import { hmrIntegration } from "astro-integration-kit/dev";
import { defineConfig } from "astro/config";

const { default: fonts } = await import("@astrolicious/fonts");

// https://astro.build/config
export default defineConfig({
	integrations: [
		tailwind(),
		fonts(),
		hmrIntegration({
			directory: createResolver(import.meta.url).resolve("../package/dist"),
		}),
	],
});
