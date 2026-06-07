# Group Divider

Event tool: an **owner** pre-registers members, then a **staffer** just checks people in, splits them into teams, and shares the result (for LINE). Single-event utility — keep it simple, do not over-engineer.

## Stack
- React 19 + TypeScript (strict) + Vite 8
- Tailwind CSS 3 (`@tailwind` directives in `src/index.css`; `tailwind.config.js`)
- vite-plugin-pwa (PWA) · lz-string (share-link compression) · sonner (toasts)
- ESLint flat config (`eslint.config.js`)
- Deploy: **Vercel** (Vite preset, output `dist`, SPA — no `vercel.json` needed unless routing is added)
- Dev container: Docker, `node:20`, `npm run dev -- --host` on `:5173`

## Commands
- `npm run dev` — dev server (HMR)
- `npm run build` — type-check + prod build (`tsc -b && vite build`)
- `npm run lint` — ESLint
- `npm run preview` — serve the prod build
Run `npm run build` before calling any change done — it type-checks the whole project.
- **All package installs must run inside the container** — `docker compose exec frontend npm install <pkg>`. Never run `npm install` on the host; the container's `node_modules` is an isolated Docker volume and host-side installs won't be visible inside.

## Layout
- `src/App.tsx` — tab shell (registration / checkin / division); localStorage persistence (key `group-divider-v4`); imports members from the URL on load, then cleans the URL.
- `src/components/` — one component per tab: `RegistrationTab`, `CheckInTab`, `DivisionTab`.
- `src/core/divider.ts` — **pure** team-splitting logic (`shuffle`, `getTeamSizes`, `divide`). No React, no DOM. Keep pure and unit-testable.
- `src/utils/share.ts` — encode/decode members to/from the URL via lz-string.
- `src/types/index.ts` — shared types (`Member`, `Gender`, `DivOptions`, `DivResult`).
- `docs/group-divider-deploy-spec.md` — product/requirements spec (background only). **The code is authoritative wherever it differs from this doc** (e.g. the share link uses `?data=` + lz-string, not the doc's `#d=` + base64).

## Domain model
`Member = { id, name, gender: 'male'|'female'|'other', core, checkedIn }`. Division runs **only on `checkedIn` members**. `divide(members, teamCount, { useCore, balG })`: if `useCore`, place core members round-robin across teams first; if `balG`, balance genders across teams; otherwise fill the emptiest team. Invariants: each member in exactly one team; team-size difference ≤ 1.

## Conventions
- `verbatimModuleSyntax` is on → type-only imports MUST use the `type` modifier: `import { type Member } from '../types'`. Omitting it breaks the build.
- `erasableSyntaxOnly` is on → no `enum`, no namespaces, no class parameter properties. Use unions + plain objects (as the code already does).
- Avoid `any` / `as any`; prefer precise types and discriminated unions. (`src/types/vite-ambient.d.ts` widens vite/react to `any` and there are a few `as any` casts — do not extend that pattern; the real `@types` are installed.)
- Keep pure logic in `src/core`; keep side effects (localStorage, clipboard, URL, toasts) in components/utils. Don't mix.
- Match the existing Tailwind utility style; keep components small and single-purpose. Don't refactor working code unless asked.

## Share link & privacy
- Members are shared by compressing `[name, genderCode, coreFlag]` with lz-string into a `?data=` query param (`src/utils/share.ts`); `id` and `checkedIn` are not encoded.
- Member names are personal data: keep them in localStorage / the share URL only. **Never hardcode real names into source.** This keeps the repo safe to deploy/publish on any host.
- The copied share text lists **team + names only — no ★ / core marker** (the on-screen result may show ★).

## Definition of done
- `npm run build` passes (no TS or ESLint errors).
- 15 people / 3 teams → 5·5·5; core-distribution and gender-balance both work; invariants hold.
- Share URL round-trips on another device (Japanese names not garbled); URL is cleaned after import.
- Members + check-in state survive a reload.

## Workflow
- For non-trivial changes, propose a short plan before editing; split large work into steps.
- When you have to correct the same thing twice, add a one-line rule to this file.