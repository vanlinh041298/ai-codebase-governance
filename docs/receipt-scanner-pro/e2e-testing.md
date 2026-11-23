# End-to-end Tests

Playwright tests in [`e2e/`](../e2e) drive the real app (Next.js server, Auth0, Supabase/Postgres, storage) through a browser. Config: [`playwright.e2e.config.ts`](../playwright.e2e.config.ts).

## Setup

1. **Use a dedicated test environment.** Tests create and delete receipts, categories, budgets and groups. Use a separate database / Supabase project and an Auth0 test tenant or application.
2. **Create a test user** in an Auth0 database connection (default `Username-Password-Authentication`) without MFA or captcha. The app's login page only offers Google, so the setup logs in with `/auth/login?connection=…`.
3. Register `http://localhost:3200/auth/callback` (Allowed Callback URLs) and `http://localhost:3200` (Allowed Logout URLs) in the Auth0 application.
4. Copy [`.env.e2e.example`](../.env.e2e.example) to `.env.e2e` and fill it in. The run refuses to start if any data/auth variable is missing, because Next.js would otherwise fall back to `.env.local`.
5. `pnpm exec playwright install chromium` once.

## Running

```bash
pnpm test:e2e
pnpm test:e2e --project public
pnpm test:e2e categories
pnpm test:e2e:ui
E2E_RUN_AI=true pnpm test:e2e scan
E2E_BASE_URL=https://preview.example.com pnpm test:e2e
```

Reports: `playwright-report/e2e`. Traces, screenshots and videos of failures: `test-results/e2e`.

## Structure

| File | Covers |
|---|---|
| `public/route-protection.e2e.ts` | Signed-out redirects for every section, login page, hand-off to Auth0 |
| `auth.setup.ts` | Logs the test user in once and saves `e2e/.auth/user.json` |
| `auth.e2e.ts` | Signed-in redirect from `/en`, logout from the profile menu |
| `manual-receipt.e2e.ts` | Manual entry → transactions list → scan history → detail → delete |
| `scan.e2e.ts` | Scan choice, image preview, non-image rejection, opt-in AI analysis + save |
| `categories.e2e.ts` | Create, validation, duplicate, subcategory, rename, delete rules |
| `budgets.e2e.ts` | Limit validation, create, delete |
| `groups.e2e.ts` | Create, switch, invalid join code, delete back to personal workspace |
| `settings.e2e.ts` | Language switch (en ↔ vi), theme persistence |
| `dashboard.e2e.ts` | Sidebar navigation, dashboard stats, analytics duration filter, client errors |

Helpers live in `e2e/support/`: env loading and guards, the shared `test` fixture (hides the React Query devtools panel that `next dev` opens), UI helpers, and a generated receipt image (no binary fixtures).

## Conventions

- Select by role and accessible name (`getByRole("button", { name: "Save Category" })`). If a control has no accessible name, add an `aria-label` using an existing translation key rather than a `data-testid`.
- Prefix every created record with `E2E ` via `uniqueName()`. Specs clean up after themselves; [`global-teardown.ts`](../e2e/global-teardown.ts) also deletes anything named `E2E …` (set `E2E_CLEANUP=false` to keep data while debugging).
- Tests run serially with one worker because they share one user's active group and preferences.
- The AI scan test may create categories suggested by the model; they are not prefixed and are not removed by teardown.

## Known issues

- `/vi/...` routes redirect signed-out users to `/en/login`: [`src/proxy.ts`](../src/proxy.ts) reads `request.nextUrl.locale`, which is always empty with App Router i18n, and its locale regex only strips `en|es|fr`. The test is marked `test.fail` until fixed.

## CI

[`.github/workflows/e2e.yml`](../.github/workflows/e2e.yml) runs on pull requests (not from forks), pushes to `main` and manually, building with `pnpm build && pnpm start`. It reads secrets from the `e2e` environment: `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, `E2E_AUTH0_DOMAIN`, `E2E_AUTH0_CLIENT_ID`, `E2E_AUTH0_CLIENT_SECRET`, `E2E_AUTH0_SECRET`, `E2E_POSTGRES_URL`, `E2E_SUPABASE_URL`, `E2E_SUPABASE_SERVICE_KEY`, plus the `E2E_`-prefixed storage and AI keys for scan tests. Run it manually with **run_ai** to include the AI scan test.
