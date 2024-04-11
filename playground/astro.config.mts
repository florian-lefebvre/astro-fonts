import tailwind from "@astrojs/tailwind";
import { createResolver } from "astro-integration-kit";
import { hmrIntegration } from "astro-integration-kit/dev";
import { defineConfig } from "astro/config";

const { default: fonts } = await import("@astrolicious/fonts");
const { googleProvider } = await import("@astrolicious/fonts/providers");

// https://astro.build/config
export default defineConfig({
	integrations: [
		tailwind(),
		fonts({
			providers: [googleProvider],
			families: [
				{
					name: "Poppins",
					provider: "google",
					global: true,
				},
			],
		}),
		hmrIntegration({
			directory: createResolver(import.meta.url).resolve("../package/dist"),
		}),
	],
});
