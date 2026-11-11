<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Landing page is React sections in `src/components/site/`, assembled in `src/routes/index.tsx`; shared contact-form text lives in `ContactContext` so quiz/calculator/dialogs can prefill the request.
- Pricing and quiz logic live in pure modules `src/lib/discount-model.ts` and `src/lib/quiz-model.ts`; keep UI free of business rules and keep `discount-model.test.ts` in sync when rules change.
- The advanced-analysis navigator is a standalone static app in `public/navigator/` (entry `start.html`, not `index.html`, because Vite dev intercepts `index.html` in public folders).
- Contact form submissions go through `submitContactRequest` into insert-only `contact_submissions` before fixed-recipient notifications in `contact-notifications.server.ts`; email failures must not discard a saved lead. Managed email templates and synchronous sending live in `src/lib/email-templates/`, without email queues or tables.
