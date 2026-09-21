# APIs and MCP Servers Guide for Agents

This project (`cafe-memories`) is configured with full access to external APIs, databases, and Model Context Protocol (MCP) servers.

---

## 1. Model Context Protocol (MCP) Servers
Configured in `mcp.json` in the project root:

1. **Supabase MCP** (`supabase`):
   - Project Reference: `rflyenjmzgssxzcockss`
   - Features: Database schema inspection, running SQL queries, migrations, RLS policies, table debugging, and Edge Functions.
   
2. **Cloudflare Suite** (`cloudflare`, `cloudflare-docs`, `cloudflare-bindings`, `cloudflare-builds`, `cloudflare-observability`):
   - Access to Cloudflare Workers, Pages, D1, KV, R2, builds, and official documentation.

3. **Gemini API Docs** (`gemini-api-docs`):
   - Real-time search and retrieval of Google Gemini API and SDK documentation.

4. **Chrome DevTools** (`chrome-devtools`):
   - Direct browser automation, inspecting network requests, console logs, and rendering.

---

## 2. Project APIs & Environment Configuration
Configured in `.env` and `.env.local`:

- **Database / Backend:** Supabase
  - `NEXT_PUBLIC_SUPABASE_URL`: Connected Supabase project instance.
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Client-side safe Supabase key.
  - `SUPABASE_SERVICE_ROLE_KEY`: Admin server-side key (bypasses RLS when needed).
- **Authentication:** Google OAuth
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
- **Application URL:**
  - `NEXT_PUBLIC_APP_URL`

---

## 3. Usage Guidelines
- Always use the Supabase MCP or client library (`@supabase/supabase-js` / `@supabase/ssr`) for database operations.
- Ensure all database queries respect Row Level Security (RLS) policies unless running administrative scripts with the service role key.
- Refer to `AGENTS.md` for coding style, Next.js App Router rules, and architectural standards.
