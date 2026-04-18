---
name: Agent Task
about: Scoped task for the GitHub Claude Agent (Executor). Planner fills this out; Executor implements.
title: "[AGENT] "
labels: ["agent-task"]
assignees: []
---

<!--
  GOVERNANCE RULES (do not delete):
  - Planner (Cowork conversation) writes this issue. Executor (GitHub Claude Agent) implements it.
  - Executor DOES NOT start work on anything that isn't a scoped issue using this template.
  - All work lands via PR against the target branch named below. No direct pushes to main.
  - If the Executor discovers the spec is wrong, STOP and comment on the issue. Do not reinterpret.
-->

## 1. Context

<!-- Why are we doing this? What prompted it? Link to prior audit, decision, or conversation. Keep to 3-6 sentences. -->

## 2. Spec

<!--
  Exactly what needs to happen. Be precise. Use a checklist of concrete actions, not goals.
  Good:  - Delete `docs/OLD.md`
  Bad:   - Clean up the docs folder
-->

- [ ] 
- [ ] 
- [ ] 

## 3. Acceptance criteria

<!--
  Objective, verifiable. How does the PR reviewer confirm it's done?
  Each line should be a statement that is either TRUE or FALSE after the work.
-->

- [ ] 
- [ ] 
- [ ] 

## 4. Files to touch

<!--
  Explicit whitelist. If a file isn't here, the Executor does not touch it.
  Format: `path/to/file.ts` — (create | modify | delete | rename-to NEW_PATH)
-->

- `` — 
- `` — 

## 5. Do NOT

<!--
  Explicit negative scope. This is where we prevent the Agent from veering off.
  Always include stack invariants if the task touches the API or DB layer.
-->

- Do not modify files outside the whitelist above.
- Do not introduce Express, Mongo, or any alternative to the canonical stack. **Stack of record: Fastify 5 + Drizzle ORM + Postgres (prod) / SQLite (dev) + Next.js 14 + pnpm monorepo.**
- Do not rebase, force-push, or modify `main`.
- Do not add new dependencies without explicit approval in Section 7.
- Do not squash commits on a shared branch.

## 6. Out of scope (defer to follow-up)

<!-- List work that is tempting to include but belongs in a separate issue. Prevents scope creep. -->

- 

## 7. New dependencies (if any)

<!-- Package name, version, why needed, is it in the allowlist? If no new deps, write "None." -->

None.

## 8. Testing

<!--
  What tests must pass, what new tests must be added.
  "pnpm typecheck && pnpm build" is the minimum bar for any code change.
-->

- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` passes
- [ ] `pnpm test` passes (if tests exist for touched modules)
- [ ] New tests for: 

## 9. Branch + PR convention

- **Branch name:** `agent/<short-slug>` (e.g., `agent/postgres-migration-cleanup`)
- **Base branch for PR:** <!-- usually `main`, but could be a feature branch being polished -->
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`). One logical change per commit.
- **PR title:** Mirror the issue title, minus the `[AGENT]` prefix.
- **PR body:** Link this issue (`Closes #N`), paste the acceptance-criteria checklist with each box checked + evidence.

## 10. Definition of done

- [ ] All Spec items complete.
- [ ] All Acceptance criteria verifiable TRUE.
- [ ] No files modified outside Section 4.
- [ ] `pnpm typecheck && pnpm build` pass locally in CI.
- [ ] PR opened against the correct base branch.
- [ ] Ron (Planner) has reviewed and approved.

---

<!--
  If anything in this issue is ambiguous, STOP and ask in a comment before coding.
  Unscoped work is reverted on sight.
-->
