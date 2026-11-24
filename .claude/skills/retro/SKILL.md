---
name: retro
description: Examine a coding session that was unusually difficult and propose evidence-based improvements to the repository's agent environment without changing it automatically.
disable-model-invocation: true
---

# Retro

Review the current session or a user-specified session record. Improve the environment that supports future work, not the code produced by the session. Do not make changes until the user selects a proposal.

## Workflow

1. Read the available session record and project instructions, checks, CI configuration, and relevant standards. If a session is specified, use that record; otherwise use the current session.
2. Find concrete moments of friction, missed checks, repeated searches, unavailable information, or review misses. Tie every proposal to evidence from the session; omit generic advice.
3. Classify each candidate and suggest the smallest appropriate destination:
   - Navigation friction: add a concise pointer in an already-read guide.
   - Mechanically detectable mistakes: improve an existing test, linter, type check, hook, or CI gate rather than adding prose.
   - Judgment-based review misses: propose a focused rule in the repository's coding standards.
   - Missing information or inefficient tools: propose a targeted access or tooling improvement.
   - No-op or misplaced instructions: propose removal or relocation when supported by evidence.
4. Prioritize candidates by impact and likelihood. For each, cite the session moment, proposed change, destination, and why existing controls are insufficient.
5. Present recommendations only. Ask which, if any, the user wants applied. Do not edit files, add hooks, or install automation without explicit approval.

Keep `AGENTS.md` focused on essential navigation and behavior. Do not turn a single session's unusual event into a permanent rule without evidence that it will recur.

Source: https://www.aihero.dev/skills-retro
