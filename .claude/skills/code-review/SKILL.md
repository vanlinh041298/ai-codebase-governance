---
name: code-review
description: Review a non-empty branch diff against repository standards and its originating spec or ticket, reporting evidence-based findings on both axes.
---

# Code Review

Review a change without modifying it. Require a fixed comparison point such as a commit, branch, or tag; ask the user if none is supplied. Validate that the reference resolves and that the diff is non-empty before proceeding.

## Workflow

1. Capture the merge-base diff (`git diff <fixed-point>...HEAD`) and commit list. State the exact range being reviewed.
2. Find the originating spec or ticket from commit references, a user-provided path, or matching repository documentation. If none is available, ask; if the user confirms there is no spec, skip the spec axis rather than inventing requirements.
3. Identify the repository's applicable standards, including `CONTRIBUTING.md` and any dedicated coding-standards document. Repository rules override generic heuristics. Skip issues already enforced by tooling.
4. Assess two independent questions, using separate reviewers or isolated passes when available:
   - **Standards:** Does the diff violate a documented rule or introduce a concrete maintainability concern?
   - **Spec:** Is any requested behavior missing, partial, incorrect, or expanded beyond scope?
5. Report the two axes separately. Each finding must identify the affected diff hunk and cite the applicable standard or requirement. Distinguish confirmed defects from judgment calls. Do not claim a finding without checking its evidence.
6. End with the finding count and most serious issue on each axis. Do not merge the axes into a single score or verdict.

When no spec exists, say so plainly and report only the standards review. A review is advisory; do not change code or repeatedly rerun it seeking a permanently empty report.

Source: https://www.aihero.dev/skills-code-review
