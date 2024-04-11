import { z } from "astro/zod";

export const genericCssFamilySchema = z.enum([
	"serif",
	"sans-serif",
	"monospace",
	"cursive",
	"fantasy",
	"system-ui",
	"ui-serif",
	"ui-sans-serif",
	"ui-monospace",
	"ui-rounded",
	"emoji",
	"math",
	"fangsong",
]);

export type GenericCSSFamily = z.infer<typeof genericCssFamilySchema>