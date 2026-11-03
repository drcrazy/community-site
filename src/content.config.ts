import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const localizedString = z.object({
  en: z.string(),
  de: z.string().optional(),
  fr: z.string().optional(),
  ru: z.string().optional(),
  es: z.string().optional(),
});

const news = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/news" }),
  schema: z.object({
    title: localizedString,
    summary: localizedString,
    date: z.coerce.date(),
  }),
});

const guides = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/guides" }),
  schema: z.object({
    title: localizedString,
    summary: localizedString,
    category: z.enum([
      "core-elements",
      "layouts",
      "buildings",
      "tier-lists",
      "tips-and-tricks",
      "goddess",
      "events",
      "grand-voyage",
    ]),
    position: z.number().int().positive(),
  }),
});

const events = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/events" }),
  schema: z.object({
    title: localizedString,
    summary: localizedString,
    category: z.enum(["main-event", "routine-event", "ranking-challenge"]),
    position: z.number().int().positive(),
    icon: z.string().optional(),
  }),
});

export const collections = { news, guides, events };
