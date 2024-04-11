import { defineIntegration } from "astro-integration-kit";
import { optionsSchema } from "./schemas.js";
import { normalizeOptions } from "./options.js";

export const integration = defineIntegration({
	name: "@astrolicious/fonts",
	optionsSchema,
	setup({ options }) {
		const { normalizedDefaults } = normalizeOptions(options)

		console.dir({ options, normalizedDefaults }, { depth: null });

		const { providers } = options;

		return {
			"astro:config:setup": async () => {
				await Promise.all(providers.map((p) => p.setup));
			},
		};
	},
});
