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

### Hidden / Disabled Tools
The following tools are hidden from the sidebar and mobile nav (routes redirect to `/dashboard`). Pages still exist in the codebase but are inaccessible to users:
- **Reels Maker** (`/dashboard/reels`) — generates storyboard only, not actual video; misleading UX
- **Sketch to Image** (`/dashboard/sketch-to-image`) — mouse drawing impractical, no eraser
- **Face Swap** (`/dashboard/face-swap`) — legal friction + niche use case
- **Virtual Try-On** (`/dashboard/virtual-tryon`) — missing garment category selector, AI confusion

### AI Reliability Layer
- **`callEdgeFunction` utility** (`src/lib/callEdgeFunction.ts`): wraps all Supabase Edge Function calls with:
  - 2 automatic retries with exponential backoff
  - 60-second timeout per attempt via `Promise.race`
  - Arabic-classified error messages (6 categories: network, timeout, rate-limit, subscription, server, unknown)
- **All AI pages now use `callEdgeFunction`**: HashtagGenerator, ABTesting, CompetitorSpy, AdCreativeGenerator, AIWriter, CreatorStudio, ImageStudio, PhotoshootPage.

### Billing Page
- Shows active subscription end date (`current_period_end`) with Arabic locale formatting
- Trust badges grid: secure payment, 1-hour activation, cancel anytime, WhatsApp support
- Green active-subscription status indicator
- Free plan nudge shows "تضاعف إمكانياتك 16 ضعف"
- **7-day money-back guarantee section** added (WhatsApp link to request refund)
- `Phone` icon properly imported from lucide-react

### Bug Fixes Applied (Session 3)
- **og-image**: Fixed `/og-image.png` → `/opengraph.jpg` in `index.html`
- **w-4.5 Tailwind classes**: Fixed `w-4.5 h-4.5` → `w-5 h-5` in Navbar, Footer, MobileBottomNav
- **Footer contacts**: Real email (`support@moda-ai.com`), WhatsApp (`01020876934`), social links (`instagram.com/moda.ai.eg`, `twitter.com/modaai_eg`)
- **NotificationBell**: Unique realtime channel `notifications-${user.id}` to avoid cross-user collisions
- **PWAInstallPrompt**: `dismissed` state persisted in `localStorage` (`moda_pwa_dismissed`)
- **Dashboard query**: `.limit(4)` on recent content + 4 separate count queries for stats
- **HeroSection**: Hardcoded "+120 براند" (removed live DB query on every page load)
- **GlobalSearch**: "صانع الريلز" marked `comingSoon: true` — shows "قريباً" badge and disables click
- **CompareSection**: Fixed inaccurate claims ("Brand Bible تلقائي" → "إعدادات هوية البراند التلقائية", "جدولة تلقائية" → "تقويم جدولة المحتوى")
- **FeaturesSection**: "صانع الريلز" badge set to "قريباً"; schedule desc fixed; analytics desc fixed
- **SettingsPage**: Delete account confirmation dialog added; password section hidden for Google OAuth users
- **AIWriter**: `onGenerateIdeaImage` wrapped in `checkAndProceed("image_generation", ...)` 
- **AuthPage**: Already-logged-in users redirect to `/dashboard` via `useEffect`
- **HashtagGenerator**: "حفظ" button saves all tags to `saved_content` table; `DashboardLayout` title added
- **CreatorStudio + PhotoshootPage**: Fixed TypeScript `{} | null` type errors with explicit casts

### Implemented Features
- **Auth**: Email/password only. Google OAuth removed. `/login` and `/register` redirect to `/auth`.
- **Onboarding Wizard**: `WelcomeModal.tsx` replaced with a full 5-step wizard (Welcome → Brand Name → Dialect+Tone → Audience → Done). Checks Supabase for existing brand, saves data on completion. Uses framer-motion for step transitions. Keyed per user via localStorage.
- **Store Integrations**: Three platforms in `StoreConnect.tsx`:
  - **Salla** — via Supabase Edge Function `salla-proxy`
  - **Shopify** — via Express API `/api/shopify/store` and `/api/shopify/products` (private app token)
  - **Zid** — via Express API `/api/zid/store` and `/api/zid/products` (manager token)
  - WooCommerce, Wix still "coming soon"
- **CORS**: API server restricted to Replit domains only (no wildcard).
- **SEO**: `react-helmet-async` + `SEOHead` component.
- **CSS fixes**: Smooth scroll, `overflow-x: hidden`, focus-visible, reduced-motion support.
- **React Router v7 flags**: `v7_startTransition` and `v7_relativeSplatPath`.

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
