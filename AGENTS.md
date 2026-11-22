# AI Engineering Rules

- Read relevant code and tests before editing.
- Search for and reuse existing helpers and patterns.
- Keep changes scoped to the requested behavior.
- Validate all external input at trust boundaries.
- Never commit credentials, tokens, private keys, or production connection strings.
- Do not add dependencies without confirming they are real and necessary.
- Add focused tests for new or corrected behavior.
- Run the repository formatter, linter, type checker, and relevant tests before review.
- Work on a feature branch or isolated worktree; never edit `main` directly.
- Keep commits atomic and do not bypass branch protections.
