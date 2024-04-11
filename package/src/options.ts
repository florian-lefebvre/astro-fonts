import type { IntegrationOptions } from "./types.js";
import type { GenericCSSFamily } from "./css/parse.js";

const DEFAULT_VALUES = {
	weights: [400],
	styles: ["normal", "italic"] as const,
	subsets: [
		"cyrillic-ext",
		"cyrillic",
		"greek-ext",
		"greek",
		"vietnamese",
		"latin-ext",
		"latin",
	],
	fallbacks: {
		serif: ["Times New Roman"],
		"sans-serif": ["Arial"],
		monospace: ["Courier New"],
		cursive: [],
		fantasy: [],
		"system-ui": [
			"BlinkMacSystemFont",
			"Segoe UI",
			"Roboto",
			"Helvetica Neue",
			"Arial",
		],
		"ui-serif": ["Times New Roman"],
		"ui-sans-serif": ["Arial"],
		"ui-monospace": ["Courier New"],
		"ui-rounded": [],
		emoji: [],
		math: [],
		fangsong: [],
	},
} satisfies IntegrationOptions["defaults"];

export const normalizeOptions = (options: IntegrationOptions) => {
	const normalizedDefaults = {
		weights: (options.defaults?.weights ?? DEFAULT_VALUES.weights).map((v) =>
			String(v),
		),
		styles: options.defaults?.styles ?? DEFAULT_VALUES.styles,
		subsets: options.defaults?.subsets ?? DEFAULT_VALUES.subsets,
		fallbacks: Object.fromEntries(
			Object.entries(DEFAULT_VALUES.fallbacks).map(([key, value]) => [
				key,
				Array.isArray(options.defaults?.fallbacks)
					? options.defaults.fallbacks
					: options.defaults?.fallbacks?.[key as GenericCSSFamily] ?? value,
			]),
		) as Record<GenericCSSFamily, string[]>,
	};

	if (
		!options.defaults?.fallbacks ??
		!Array.isArray(options.defaults.fallbacks)
	) {
		options.defaults ??= {};
		options.defaults.fallbacks ??= {};
		const fallbacks = options.defaults.fallbacks;
		for (const _key in DEFAULT_VALUES.fallbacks) {
			const key = _key as keyof typeof DEFAULT_VALUES.fallbacks;
			fallbacks[key] ??= DEFAULT_VALUES.fallbacks[key];
		}
	}

	return { normalizedDefaults };
};
