import { defineIntegration } from "astro-integration-kit";
import { optionsSchema } from "./options.js";

export const integration = defineIntegration({
	name: "@astrolicious/fonts",
	optionsSchema,
	setup({ options }) {
		console.dir({ options }, { depth: null })
		return {};
	},
});
