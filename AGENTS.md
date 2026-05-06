# AGENTS.md — ArenaOS

ArenaOS is a React/Vite/Tailwind/Supabase CMMS web app for sports arena facility management.

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Supabase Auth/Postgres/Storage/Edge Functions
- Vercel serverless functions
- Existing local UI components, progressively migrating toward HeroUI-style components

## Core rules

- Do not change Supabase schema unless explicitly requested.
- Do not change routes, roles, auth logic, RLS policies or protected route behavior.
- Do not rewrite hooks unless strictly necessary.
- Preserve existing data logic, cache invalidation and audit logging.
- Keep existing module behavior intact.
- Implement redesign step by step.
- Run build/typecheck after changes.

## Design documentation

Before implementing any UI redesign task, read only the files relevant to the task.

Design system:
- docs/design/01_ARENAOS_DESIGN_SYSTEM.md

App shell:
- docs/design/02_ARENAOS_APP_SHELL.md

Core screens:
- docs/design/03_ARENAOS_CORE_SCREENS.md

Secondary screens:
- docs/design/04_ARENAOS_SECONDARY_SCREENS.md

Implementation plan:
- docs/design/05_ARENAOS_IMPLEMENTATION_GUIDE.md

## Visual direction

- Inter is the only global font.
- Use a warm light content area.
- Use a dark premium sidebar.
- Primary accent is green, not blue.
- Avoid generic dashboard aesthetics.
- Keep UI premium, compact, technical and B2B SaaS-oriented.

## Implementation behavior

For each redesign task:
1. Read the relevant docs/design files.
2. Identify affected files before editing.
3. Make minimal, focused changes.
4. Preserve data hooks and business logic.
5. Run `npm run build`.
6. Report what changed and what was intentionally not touched.