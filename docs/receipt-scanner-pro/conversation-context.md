# Receipt Scanner Pro Conversation Context

Last scanned: 2026-06-09

Use this file as a compact handoff for future agent conversations. It summarizes the app's business purpose, application flows, technical architecture, data model, and important implementation conventions.

## Product Summary

Receipt Scanner Pro is a localized expense and receipt management app. Users scan receipt images, let AI extract structured receipt data, review/save transactions, browse transaction history, inspect analytics, manage categories and budgets, and collaborate in shared groups.

Primary business domains:

- Receipt scanning and extraction.
- Personal and group expense tracking.
- Category hierarchy management.
- Budget monitoring by category.
- Analytics and dashboard summaries.
- Group collaboration with roles and invite codes.
- User preferences for active group, language, and appearance.

## Tech Stack

- Framework: Next.js App Router, currently `next@16.1.6`.
- Language: TypeScript, strict mode.
- Auth: Auth0 via `@auth0/nextjs-auth0`.
- Database: PostgreSQL through Drizzle ORM.
- Storage: Supabase Storage for receipt images.
- AI: Google Gemini via `@google/genai`.
- Server state: TanStack Query v5.
- UI: Radix UI primitives, TailwindCSS, lucide-react icons.
- Forms: `react-hook-form`.
- i18n: `next-intl` with `en` and `vi`.
- Utilities: lodash, date-fns, tailwind-merge.

## Design System

Source of truth: `DESIGN.md`.

Design language:

- "Cupertino Modern": clean, premium, high contrast, native-feeling.
- Standard card/container: `bg-white rounded-2xl shadow-sm border border-slate-200/50`.
- Primary color: `#0058BC`.
- Background: `#F9F9FE`.
- Text primary: `#1A1C1F`.
- Text secondary: `#5D5E63`.
- Radius: standard components use 16px / `rounded-2xl`.
- Financial data should use `tabular-nums`.
- Navigation items: Dashboard, Transactions, Scan History, Categories, Budgets, Analytics, Groups, Settings.

Project-level style rules:

- Prefer arrow functions.
- Prefer Radix UI primitives and enhance existing UI components.
- Use TailwindCSS for styling.
- Use `date-fns` for dates.
- Use lodash/trusted libraries instead of ad hoc utilities.
- Never use `any` in new TypeScript work.
- Use Next Image instead of raw `img`.
- Page components should stay RSC unless client interaction is required; put client behavior in colocated `_components`.
- Use `react-hook-form` for forms.
- Define translations for both `en` and `vi`.

## Application Routing

Locale root:

- `src/app/[locale]/layout.tsx`
  - Loads globals, Auth0 provider, `NextIntlClientProvider`, React Query providers, and Vercel Analytics.
- `src/app/[locale]/page.tsx`
  - Redirects unauthenticated users to `/login`; authenticated users to `/dashboard`.

Authenticated app shell:

- `src/app/[locale]/(app)/layout.tsx`
  - Wraps pages in `AppWrapper`, which provides navigation/shell.

Main pages:

- `/dashboard` — RSC reads Auth0 session, active group preference, and `getDashboardStats`; renders `DashboardView`.
- `/transactions` — RSC reads receipts and categories for active personal/group context; renders `HistoryView`.
- `/transactions/[id]` — RSC reads one receipt via `getReceiptById`.
- `/scan` — Client `ScanView` uses `useScanReceipt`.
- `/scan-history` — RSC reads receipts for active context.
- `/categories` — RSC reads active group id, receipts, and categories.
- `/budget` — RSC reads budgets with current spending.
- `/analytics` — RSC reads analytics data for active context.
- `/groups` — RSC reads groups and active group id; client `GroupsView` handles switching and management.
- `/settings` — RSC reads user preferences.
- `/profile` — RSC reads Auth0 session.

Auth:

- `/login` lives under `src/app/[locale]/(auth)/login/page.tsx`.

## Core Data Model

Schema source: `db/schema.ts`.

Important tables:

- `categories` — hierarchical category tree with `id`, `name`, `parentId`, `groupId`, and `userId`.
- `categoryTranslations` — category name translations by `categoryId` and `lang`.
- `groups` — collaboration groups with unique six-character invite codes.
- `groupMembers` — membership and roles.
- `receipts` — receipt headers and summaries.
- `receiptItems` — receipt line items and category fields.
- `userPreferences` — `userId`, `activeGroupId`, `activeLang`, `appearance`, and `updatedAt`.
- `budgets` — category budget limits.

Data scoping rule:

- If `groupId` is non-null, read/write group-scoped records.
- If `groupId` is null, read/write records where `userId` matches and `groupId` is null.
- This applies to receipts, categories, budgets, dashboard stats, and analytics.

Numeric and time conventions:

- Money is stored as Postgres `numeric`, inserted as strings, read as numbers with `Number()`.
- Timestamps are Unix milliseconds via `Date.now()` in `bigint` columns.

## Service Layer

Main service file: `src/services/dbService.ts`.

Receipt functions include `getReceipts`, `addReceipt`, `deleteReceipt`, and `getReceiptById`.

Category functions include `getCategories` and `syncCategoryPath`.

Group functions include authenticated current-user operations for creating, joining, switching, renaming, deleting, leaving, and managing members.

Preferences include `getActiveGroupId`, `getUserPreferences`, `setActiveGroupId`, `updateLanguage`, and `updateAppearance`.

Dashboard and analytics:

- `getDashboardStats(userId, groupId)` — current/previous month totals, change percent, weekly receipt count, recent receipts, and top categories.
- `getAnalyticsData(userId, groupId)` — monthly spending, top categories, total spent, and average monthly.

Budgets:

- `getBudgets(userId, groupId)` — budgets with current-month spending.
- `createBudget`, `updateBudget`, and `deleteBudget`.

Storage:

- `getSignedUrls(imagePaths, expiresIn)` creates Supabase signed URLs.

## AI Scan Flow

Main file: `src/services/scan.ts`.

Functions:

- `analyzeReceipt(file)` calls `scanReceipt`, parses JSON, and throws `NOT_A_RECEIPT` for non-receipts.
- `scanReceipt(file)` requires `GEMINI_API_KEY`, reads Auth0 session, builds a prompt, uses Gemini Files API and `gemini-2.5-flash`, and cleans up the uploaded Gemini file.
- `saveReceipt(data, file)` reads Auth0 session, syncs category paths, uploads the image to Supabase, and calls `addReceipt`.
- `uploadReceiptImages(files)` uploads files to Supabase storage and returns paths.

Current caveat: `saveReceipt` hardcodes `groupId` to `null`; scan saves currently default to personal context.

## Hooks And Client State

Important TanStack Query hooks include `useReceipts`, `useCategories`, `useGroups`, `useUserPreferences`, `useSignedUrls`, `useAddReceipt`, `useDeleteReceipt`, `useHistoryMutations`, `useReceiptFilters`, `useCreateGroup`, and `useScanReceipt`.

Important query keys:

- `['receipts', userId, groupId]`
- `['categories', userId, groupId]`
- `['groups', userId]`
- `['userPreferences', userId]`
- `['signedUrls', imagePaths]`

## Groups Feature

Groups allow multiple users to share receipts, categories, budgets, and analytics. The creator becomes `ADMIN` and `ownerId`; users join by invite code. The current UI uses authenticated server functions rather than legacy API routes.

Current caveats:

- Email/contact invite UI is mostly local/mock state.
- Legacy API group routes still exist but are not the preferred path.

## Route Handlers

The preferred current app-router pattern is:

- RSC pages call `dbService.ts` directly for reads.
- Client mutations call server functions from `src/services`.
- Avoid adding new group behavior through API routes unless there is a specific external API need.

## Auth And Authorization

Auth0 session helper: `src/lib/auth0.ts`.

Conventions:

- `user.sub` is the canonical user id.
- Server Components read sessions with `auth0.getSession()`.
- Authenticated server functions derive the acting user from the session.
- Do not trust client-passed acting user ids.

## Internationalization

Locale setup:

- `src/i18n/routing.ts` defines locales.
- `src/i18n/request.ts` configures message loading.
- Messages are in `src/messages/en.json` and `src/messages/vi.json`.

Add every new visible string to both languages and call `setRequestLocale(locale)` in route components.

## Build, Test, And Tooling

Scripts:

- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm test:ct`
- `pnpm db:generate`
- `pnpm db:push`
- `pnpm db:pull`

Known verification notes:

- Full `pnpm lint` reports unrelated/pre-existing issues, including generated Playwright cache files and older app code.
- Focused ESLint and TypeScript checks are more useful for touched files.
- `tsc --noEmit` can pick up stale `.next` validator files unless `.next` is cleaned or a focused temp tsconfig is used.

## High-Risk Areas

- Group authorization and active-group membership validation.
- Receipt detail access for group receipts.
- AI scan save flow currently not honoring active group id.
- Category path normalization and duplicate category creation.
- Monetary values are numeric in the DB but string-on-insert/number-on-read.
- Generated files/cache directories can confuse lint and type checks.

## Quick Mental Model

```
Auth0 user
  -> userPreferences.activeGroupId
  -> data context:
       activeGroupId null: personal receipts/categories/budgets
       activeGroupId set: group receipts/categories/budgets

RSC page
  -> auth0.getSession()
  -> getUserPreferences(user.sub)
  -> dbService read by user/group context
  -> client view component

Client mutation
  -> hook or component action
  -> authenticated server function in dbService/scan
  -> Drizzle/Postgres and optional Supabase/Gemini
  -> invalidate TanStack Query keys
```
