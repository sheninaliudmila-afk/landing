# FINCONSULT — static adaptation

The active application is assembled in `src/Landing.tsx`, mounted by `src/main.tsx` and built with `vite.config.ts`. Original TanStack routes/server modules, `package.lovable.json` and `vite.lovable.config.ts` are reference code; they are not part of the static bundle.

Preserve the consultant’s current copy and local media. Do not invent client evidence or replace demo testimonials with unverified claims.

Pricing and quiz logic are in `src/lib/discount-model.ts` and `src/lib/quiz-model.ts`. Preserve the agreed 25% total discount cap, one-time diagnostics/strategy and monthly support rules unless the owner requests a change.

The advanced navigator is a separate app at `public/navigator/start.html`; preserve its separate window and BASE_URL-aware entry link. `public/navigator/index.html` is a backwards-compatible redirect.

The contact form defaults to a clearly labelled local TXT download. Never claim a lead was sent without a confirmed backend receipt. Keep all server credentials out of public VITE variables.

After implementation run `npm run typecheck`, `npm test`, `npm run build` and, for repository landing, `npm run build:pages`. Never overwrite existing Git history. Update the published root from the built files and keep editable source in `source/`.
