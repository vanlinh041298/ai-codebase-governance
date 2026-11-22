# Source Code

Manage reusable and additional source-code modules in this directory. Keep standalone applications at the repository root.

## Structure

- Add one subfolder per independently maintained module.
- Place shared source code used across modules here.
- Keep the root `runbook/` application as a sibling rather than moving it into `src`.

Keep generated output, caches, and installed dependencies out of version control. For convenient access, a Windows shortcut or directory junction may point to this folder, but maintain the real files here.
