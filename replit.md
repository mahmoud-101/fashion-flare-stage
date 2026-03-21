# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── fashion-flare/      # Fashion Flare React app (from GitHub)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Fashion Flare App (`artifacts/fashion-flare`)

React + Vite app for Arabic fashion brands. Imported from GitHub: `https://github.com/mahmoud-101/fashion-flare-stage.git`

### Tech Stack
- React 19 + Vite 7
- Tailwind CSS v3 (pinned, not using catalog v4)
- Supabase (auth + database)
- React Router DOM v6
- shadcn/ui components
- framer-motion animations
- `@imgly/background-removal` + `onnxruntime-web` for image processing

### Environment Variables Required
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/public key
- `VITE_SUPABASE_PROJECT_ID` — Supabase project ID

### Implemented Features
- **Google Login**: Supabase OAuth via `supabase.auth.signInWithOAuth({ provider: "google" })` in AuthPage.tsx. Requires Google provider enabled in Supabase Dashboard → Authentication → Providers.
- **SEO**: `react-helmet-async` installed. `HelmetProvider` wraps the app in App.tsx. `SEOHead` component at `src/components/SEOHead.tsx`. Per-page SEO on: `Index`, `AuthPage`, `TermsPage`, `PrivacyPage`.
- **CSS fixes**: Smooth scroll, `overflow-x: hidden` on html/body, proper `line-height` for headings/paragraphs, `focus-visible` styles for accessibility, `prefers-reduced-motion` support, GPU-hinted animations with `will-change`, better tap targets on mobile.
- **React Router v7 flags**: Added `v7_startTransition` and `v7_relativeSplatPath` future flags to suppress warnings.
- **Background removal**: Already lazy-loaded via dynamic import — no changes needed.

### Key Note on Tailwind
This artifact uses Tailwind CSS v3 (pinned to `^3.4.17`), unlike the workspace catalog which uses v4.
The `vite.config.ts` intentionally does NOT use `@tailwindcss/vite` — PostCSS handles Tailwind via `postcss.config.js`.

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only `.d.ts` files during typecheck

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build`
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly`
