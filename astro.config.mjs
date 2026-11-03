// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";
import preact from "@astrojs/preact";

// https://astro.build/config
export default defineConfig({
  site: "https://epochpedia.com",
  trailingSlash: "always",
  adapter: cloudflare({
    configPath: "./wrangler.jsonc",
  }),
  integrations: [sitemap(), preact()],
  redirects: {
    "/news/": "/en/news/",
    "/news/relaunch/": "/en/news/relaunch/",
  },
});
