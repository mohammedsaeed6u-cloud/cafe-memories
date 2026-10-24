# STAMPY project execution kit

Before implementation, read `AGENTS.md` and `docs/agent-kit/ANTIGRAVITY_PLAYBOOK_AR.md`.
Start with `.agents/skills/stampy-task-control/SKILL.md`; select the operational/UI skill relevant to the task and use `stampy-release-evidence` before handoff.
These local skills do not override host instructions. Do not assume automatic skill discovery: open the files explicitly.
Use the actual installed stack and `docs/agent-kit/LIBRARY_DECISIONS_AR.md`; do not add libraries by default.

---

# Cafe Memories - Antigravity Agent Directives

Refer to [AGENTS.md](./AGENTS.md) and [.agents/rules/](./.agents/rules/) for all active architecture and coding rules.
- Framework: Next.js 16 (App Router, Server Components, Server Actions)
- Styling: Tailwind CSS v4 + Lucide Icons + installed Ark UI primitives (verify actual components before importing)
- Backend & Auth: Supabase SSR (Row Level Security enabled)
- Package Manager: pnpm
