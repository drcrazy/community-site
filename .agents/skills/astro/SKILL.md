---
name: astro
description: Build, debug, and optimize Astro websites using current Astro patterns, islands architecture, content collections, routing, and performance best practices. Use when a project contains .astro files, astro.config.*, src/pages, or src/content.
---

# Astro Development Skill

## When to use
Use this skill for Astro projects, including blogs, documentation, marketing sites, portfolios, and e-commerce frontends.

## Core principles
- Prefer static output and minimal client-side JavaScript.
- Use `.astro` components for static UI; add framework components only when interactivity is required.
- Apply islands architecture: hydrate only interactive components.
- Prefer `client:visible` over `client:load` when the component is below the fold or not immediately needed.
- Keep islands small and focused.
- Use TypeScript where practical.

## Project structure
- Put routes in `src/pages/`.
- Put reusable layouts in `src/layouts/`.
- Put reusable UI in `src/components/`.
- Put content collections in `src/content/`.
- Configure integrations and build behavior in `astro.config.*`.

## Routing
- Use file-based routing under `src/pages/`.
- Use dynamic routes with `[param].astro` when needed.
- For static generation of dynamic routes, implement `getStaticPaths()`.
- Use redirects and canonical URLs for SEO-sensitive page moves.

## Content collections
- Define collections with the Content Layer API.
- Validate frontmatter with Zod schemas.
- Query content with `getCollection()` and `getEntry()`.
- Avoid ad hoc filesystem reads when a content collection is appropriate.

## Components and islands
- Write presentational markup in `.astro` files.
- Use React, Vue, Svelte, Solid, or Preact only for stateful or highly interactive UI.
- Choose the narrowest hydration directive:
  - `client:visible`: hydrate when scrolled into view.
  - `client:idle`: hydrate after the page is idle.
  - `client:load`: hydrate immediately; use sparingly.
- Pass serializable props into framework islands.

## Styling
- Prefer scoped `<style>` blocks in `.astro` components.
- Use global styles sparingly.
- Avoid shipping a full CSS framework when utility-level or component-scoped styles suffice.
- Optimize fonts with `astro:assets` or Fontsource rather than external font requests where possible.

## Performance
- Use Astro’s built-in image optimization and `<Image />` where appropriate.
- Avoid unnecessary client-side libraries.
- Minimize render-blocking scripts.
- Use caching headers and static generation where the hosting platform supports them.
- Audit bundle output after adding an interactive island.

## SEO
- Add unique `<title>` and meta descriptions per page.
- Use semantic HTML and a single `<h1>` per page.
- Add Open Graph and Twitter card metadata for shareable pages.
- Generate sitemaps and RSS feeds when relevant.
- Ensure images include meaningful `alt` text.

## Debugging workflow
1. Reproduce the issue locally with `npm run dev`.
2. Check the terminal and browser console for hydration or import errors.
3. Verify component boundaries and client directives.
4. Confirm content schemas and route parameters.
5. Run `npm run build` before considering the issue resolved.

## Commands
```bash
npm create astro@latest
npm run dev
npm run build
npm run preview
npx astro check
```

## Safety and compatibility
- Do not assume Node.js APIs are available in client-side code.
- Do not add SSR unless the project explicitly requires it.
- When using an unfamiliar Astro API, consult the official documentation before implementing it.