import { defineIntegration, withPlugins } from "astro-integration-kit";
import { optionsSchema } from "./schemas.js";
import { normalizeOptions } from "./options.js";
import { assetsPlugin } from "./assets.js";

export const integration = defineIntegration({
	name: "@astrolicious/fonts",
	optionsSchema,
	setup({ options, name }) {
		const { normalizedDefaults } = normalizeOptions(options);

		console.dir({ options, normalizedDefaults }, { depth: null });

		const { providers } = options;

		return withPlugins({
			name,
			plugins: [assetsPlugin],
			hooks: {
				"astro:config:setup": async ({ setupPublicAssetsStrategy }) => {
					await Promise.all(providers.map((p) => p.setup));

					setupPublicAssetsStrategy(options.assets);
				},
				"astro:server:setup": ({ registerFontsMiddleware }) => {
					registerFontsMiddleware();
				},
			},
		});
	},
});
