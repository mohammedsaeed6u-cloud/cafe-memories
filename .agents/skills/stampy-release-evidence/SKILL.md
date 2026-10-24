---
name: stampy-release-evidence
description: Use before declaring a STAMPY task complete or handing off a release. Require regression tests, type/lint checks, a clean scoped diff and an honest evidence ledger.
---
# Release evidence
- Review the final diff after all edits. Run clean-code-guard and test-guard as applicable by reading their instructions; these are guidance, not test executables.
- For fixes add a regression test that fails on old behavior and passes on new behavior when feasible. Test public behavior and negative cases, not only source substrings.
- Run the repository's actual pinned package manager and scripts. Verify available scripts rather than inventing `typecheck` or `db:test` commands.
- Baseline commands after installation: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`, `git diff --check`. Run production build for runtime/build/deployment changes or release approval.
- Capture command, exit code, commit/worktree context and relevant results. Warnings are not errors, but do not describe warning output as pristine.
- A local build does not prove the deployed artifact contains API routes. Static export needs an explicitly verified separate backend/functions deployment.
- PGlite is not hosted Supabase; mocks are not provider tests; HTTP 200 is not functional correctness; local browser is not a real Apple/Android wallet device.
- Do not change tests just to preserve a green count, disable auth under NODE_ENV=test, hide errors with catch-success, or suppress type/lint errors to ship.
- No push, merge, migration application or deployment without appropriate authorization. Follow the session's fixed branch constraints.
- Final handoff: what changed, files, evidence, known limitations, deployment prerequisites and rollback/mitigation when applicable. Keep the Linear task open if its acceptance needs staging or device checks not yet performed.
