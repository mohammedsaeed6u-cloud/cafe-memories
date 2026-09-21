---
name: freebuff-delegate
description: >-
  Delegate a coding task to Freebuff (`freebuff`) as an autonomous implementer, then review its diff,
  verify builds/tests, and land the changes. Use this whenever the user wants to hand implementation
  work to Freebuff, run tasks through Freebuff, or connect Freebuff with Antigravity.
license: MIT
compatibility: Requires Node.js 18+, git, and the freebuff CLI (`npm install -g freebuff`).
metadata:
  version: 1.0.0
---

# Freebuff Delegate Skill & Connector

You are the **orchestrator and lead reviewer**. Hand a structured coding task to **Freebuff** (the implementer agent), capture the diff, verify the changes with tests and builds, and provide expert review.

## The Relay Bridge
The connector script is located at:
`scripts/relay.mjs`

To run the relay:
```bash
node scripts/relay.mjs --brief TASK_FOR_FREEBUFF.md --cd .
```

## Workflow
1. **Prepare Task Brief**: Write an explicit task specification file (e.g. `TASK_FOR_FREEBUFF.md`).
2. **Execute via Relay**: Invoke Freebuff using the relay connector script.
3. **Capture Diff**: Relay captures git status and diff before and after the run.
4. **Expert Review**: Run quality gates (`npm run build`, `npm test`), inspect the code for architectural integrity, and approve or refine the changes.
