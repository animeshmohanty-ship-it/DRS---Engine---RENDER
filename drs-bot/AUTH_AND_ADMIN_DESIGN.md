# DRS Bot — Login + Admin Dashboard (Design)

Status: **approved, not yet built.** Design-first per project rule.

## Decisions (locked)
- **Auth:** Google SSO, restricted to `@recykal.com` (+ retearn domain).
- **Approval gate:** new sign-ins land as `status = pending`; an **admin must approve** before access. (Explicit requirement.)
- **Visibility:** shared team workspace — everyone sees all projects; each project stamped with `created_by`.
- **Billing:** estimated per-user cost = tokens × model price (Google bills at project level, so exact per-user is impossible; estimate tracks the real bill closely). Labeled "estimated".
- **First admin:** `animesh.mohanty@recykal.com` (hardcoded seed).

## Data model (Supabase)
- `auth.users` — managed by Supabase Auth.
- `profiles` — `id (uuid, = auth.users.id)`, `email`, `name`, `avatar_url`, `role ('admin'|'member')`, `status ('pending'|'active'|'revoked')`, `created_at`, `last_active_at`.
- `projects` (existing) — add `created_by uuid references profiles(id)`.
- `usage_events` — `id`, `user_id`, `project_id`, `kind ('generation'|'copilot')`, `stage`, `model`, `input_tokens`, `output_tokens`, `est_cost_usd numeric`, `created_at`.

RLS: members read all projects + own profile; only admins read `profiles` (all) + `usage_events` (all) + can update `role`/`status`.

## Cost estimation
Capture `usageMetadata` (promptTokenCount / candidatesTokenCount) from each Vertex/Gemini response in the LLM adapters. Multiply by a per-model price table (`lib/pricing.js`) → `est_cost_usd`. Write one `usage_events` row per `/api/generate` and `/api/copilot` call. Groq/Claude adapters return usage too; add as used.

## Build phases (each shippable + reversible)
1. **Auth gate** — Supabase Auth client, Google provider, login screen, session guard wrapping the app. Profile auto-created on first login (`pending`). Domain check. Sign-out.
2. **Approval + attribution** — admin approve/revoke; block `pending` users at the gate; stamp `created_by` on project save; write `usage_events` (with tokens + est. cost) after every LLM call.
3. **Admin dashboard** — `/admin` route (admins only): stat tiles, access table (approve/revoke), spend-by-member, activity feed, spend-over-time.

## PREREQUISITES — only the account owner can do these (blocks Phase 1)
1. **Supabase → Authentication → Providers → Google:** enable it.
2. **Google Cloud (`travel-elry`) → APIs & Services → Credentials → Create OAuth client ID (Web):**
   - Authorized redirect URI: `https://<your-supabase-ref>.supabase.co/auth/v1/callback`
   - Copy the Client ID + Secret into the Supabase Google provider config.
3. **Supabase → Authentication → URL Configuration:** add the Render app URL (and `http://localhost:3002`) to redirect allow-list.
4. (Optional) Restrict Google OAuth consent to the Recykal Workspace org, or we enforce the `@recykal.com` check in-app after login.
5. Run the SQL migration (I'll provide it) to create `profiles` + `usage_events` and add `projects.created_by`, plus seed the first admin row.

Once 1–4 are done, Phase 1 can go live. Phases 2–3 don't need further console work.
