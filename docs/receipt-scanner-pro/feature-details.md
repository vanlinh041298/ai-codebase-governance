# Receipt Scanner Pro Feature Details

Last updated: 2026-06-09

This document lists each major feature in business terms, application behavior, technical implementation, and known caveats. Use it with `conversation-context.md` when onboarding a future conversation.

## 1. Authentication And Session

Users need a private account so receipts, budgets, preferences, and group membership can be scoped securely.

### User-Facing Behavior

- Unauthenticated users are redirected to login.
- Authenticated users land in the app shell and can access dashboard, scan, transactions, categories, budgets, analytics, groups, settings, and profile.
- The displayed user identity comes from Auth0 session fields such as `name`, `email`, and `sub`.

### Technical Flow

- Auth provider: Auth0 via `@auth0/nextjs-auth0`.
- Server reads use `auth0.getSession()` from `src/lib/auth0.ts`.
- Client hooks can use `useUser` from `@auth0/nextjs-auth0`.
- Canonical user id is `session.user.sub`.

### Key Files

- `src/lib/auth0.ts`
- `src/app/[locale]/page.tsx`
- `src/app/[locale]/(auth)/login/page.tsx`
- `src/proxy.ts`
- `proxy.ts`

### Caveat

New server mutations should derive the acting user from `auth0.getSession()` instead of trusting a client-passed `userId`. Some legacy API routes still have weaker authorization patterns.

## 2. Locale And Internationalization

The app supports English and Vietnamese users. Routes are locale-prefixed under `/[locale]`, UI text is loaded from locale message files, and date labels in history use locale-aware formatting.

### Technical Flow

- `src/app/[locale]/layout.tsx` validates locale and loads messages.
- `NextIntlClientProvider` provides messages to client components.
- Pages call `setRequestLocale(locale)`.
- Client components call `useTranslations(namespace)`.
- `useReceiptFilters` uses `date-fns` locales for date labels.

### Key Files

- `src/i18n/routing.ts`
- `src/i18n/request.ts`
- `src/messages/en.json`
- `src/messages/vi.json`
- `src/app/[locale]/layout.tsx`

### Caveat

Add every new visible string to both `en.json` and `vi.json`. Confirm actual `i18n/request.ts` behavior before relying on `activeLang` for user-specific route locale changes.

## 3. Application Shell And Navigation

Authenticated pages are wrapped in an app shell. Navigation includes Dashboard, Transactions, Scan History, Categories, Budgets, Analytics, Groups, and Settings. The design follows the Cupertino Modern system.

The main content flex item uses `min-w-0` so wide intrinsic content cannot expand the page beyond a mobile viewport. Top-bar search selects Transactions or Scan History and navigates to shareable `?q=` results; it is a full-width second row on mobile and an inline form on desktop.

### Key Files

- `src/components/layout/AppWrapper.tsx`
- `src/components/layout/Navigation.tsx`
- `src/components/layout/ProfileDropdown.tsx`
- `src/components/Header.tsx`
- `src/components/AppShell.tsx`
- `src/app/[locale]/(app)/layout.tsx`

Prefer route-group layout components when extending current app-router UI.

## 4. Dashboard

The dashboard gives users a fast summary of current spending, recent activity, and top categories.

### User-Facing Behavior

- Shows current month spending.
- Shows change from previous month.
- Shows receipts scanned this week.
- Shows recent receipts.
- Shows top spending categories.

### Technical Flow

- RSC page reads Auth0 session.
- Page reads active context via `getUserPreferences(userId)`.
- Page calls `getDashboardStats(userId, activeGroupId)`.
- `DashboardView` renders the resulting stats.

### Key Files

- `src/app/[locale]/(app)/dashboard/page.tsx`
- `src/app/[locale]/(app)/dashboard/_components/DashboardView.tsx`
- `src/services/dbService.ts`
- `docs/receipt-scanner-pro/analytics-dashboard.md`

### Caveat

Category aggregation maps each `categoryPath` row to a top-level category after grouping by full path, so multiple paths sharing a top-level name may appear as separate rows before mapping.

## 5. Receipt Scanning With AI

Users upload or capture a receipt image, Gemini extracts structured data, and the user reviews and saves the result. Non-receipt images produce a `NOT_A_RECEIPT` flow.

### Technical Flow

- Client hook: `useScanReceipt`.
- Server functions: `analyzeReceipt`, `scanReceipt`, `saveReceipt`.
- Gemini model: `gemini-2.5-flash`.
- Prompt builder: `src/utils/prompt.ts`.
- Image storage: Supabase bucket `receipt-scanner`.

1. `handleFileChange` stores the original `File`.
2. HEIC/HEIF files are converted to JPEG for browser preview; the original remains selected.
3. `handleAnalyze` calls `analyzeReceipt(file)`.
4. `scanReceipt(file)` reads the session, fetches categories, builds the prompt, uploads the file to Gemini, calls `generateContent`, and deletes the Gemini file.
5. `saveReceipt(data, selectedFile)` syncs category paths, uploads the image to Supabase, and calls `addReceipt`.
6. On success, receipt/category query caches are invalidated.

### Key Files

- `src/components/ScanView.tsx`
- `src/hooks/useScanReceipt.ts`
- `src/services/scan.ts`
- `src/utils/prompt.ts`
- `src/services/dbService.ts`

### Caveats

- `saveReceipt` currently hardcodes `groupId` to `null`.
- `scanReceipt` currently fetches personal categories only.
- Gemini cached content handling should be revisited if prompt caching behavior changes.

## 6. Manual Receipt Entry

Manual mode is a fallback when AI extraction is unavailable or inaccurate. `ManualEntryForm` collects receipt fields and line items and saves through the same persistence path as scanned receipts.

### Key Files

- `src/components/ManualEntryForm.tsx`
- `src/components/ScanView.tsx`
- `src/hooks/useScanReceipt.ts`
- `src/services/scan.ts`

The same active-group caveat applies if saving through `saveReceipt`.

## 7. Receipt Persistence

Saved receipts appear in transactions, scan history, dashboard, analytics, categories, and budgets. `addReceipt(data)` creates a `rec_<timestamp>` id, inserts the header and line items in a Drizzle transaction, and stores money values as strings in Postgres numeric fields.

### Key Files

- `src/services/dbService.ts`
- `db/schema.ts`
- `src/types/index.ts`

### Caveats

- `uid` is unique, so duplicate receipt numbers can fail inserts.
- Timestamp/index-based ids can theoretically collide under rapid concurrent saves.

## 8. Transactions / History

The transactions page shows saved receipts grouped by date, supports date filtering and indexed substring search, opens receipt details, and allows deletion.

### Technical Flow

- RSC `/transactions` reads session, active group, receipts, and categories.
- `HistoryView` renders the client experience.
- `useReceiptFilters` filters and groups receipts using lodash and date-fns.
- `useHistoryMutations` handles add/delete mutations and invalidates `receipts`.
- `VirtualTransactionList` virtualizes rows and date headers while preserving expanded state.

### Key Files

- `src/app/[locale]/(app)/transactions/page.tsx`
- `src/components/HistoryView.tsx`
- `src/components/history/HistoryFilterPanel.tsx`
- `src/components/history/TransactionDateGroup.tsx`
- `src/components/history/VirtualTransactionList.tsx`
- `src/hooks/useVirtualTransactions.ts`
- `src/hooks/useReceiptFilters.ts`
- `src/hooks/useHistoryMutations.ts`

### Caveat

`useHistoryMutations` infers `userId` and `groupId` from the first existing receipt, which can be fragile for empty history or mixed contexts.

## 9. Receipt Detail

The detail page shows a receipt's full financial summary, line items, metadata, and images. Missing or unauthorized receipts return not found.

### Key Files

- `src/app/[locale]/(app)/transactions/[id]/page.tsx`
- `src/app/[locale]/(app)/transactions/[id]/_components/ReceiptDetailView.tsx`
- `ReceiptDetailHeader.tsx`
- `ReceiptFinancialSummary.tsx`
- `ReceiptLineItems.tsx`
- `ReceiptMetaCard.tsx`
- `ReceiptImages.tsx`
- `src/services/dbService.ts`

The service uses membership-aware authorization for group receipts; route-level checks must preserve that behavior.

## 10. Receipt Images And Signed URLs

Receipt images are uploaded to Supabase Storage bucket `receipt-scanner`; the database stores storage paths rather than public URLs. `getSignedUrls(imagePaths, expiresIn)` creates temporary signed URLs, and `useSignedUrls` caches them for 50 minutes against a one-hour default expiry.

### Key Files

- `src/lib/supabase.ts`
- `src/services/scan.ts`
- `src/services/dbService.ts`
- `src/hooks/useSignedUrls.ts`
- `src/components/transaction/TransactionImages.tsx`
- `src/app/[locale]/(app)/transactions/[id]/_components/ReceiptImages.tsx`

Storage operations must remain server-side or use safe public keys only.

## 11. Categories

Categories provide a hierarchical taxonomy for receipt items. They are created automatically from scanned paths and managed through the category tree UI.

### Technical Flow

- `syncCategoryPath(userId, groupId, path)` splits the path, finds or inserts each segment, and returns the leaf id.
- `getCategories(userId, groupId)` returns the flat category list.
- The UI derives hierarchy client-side.

### Key Files

- `src/app/[locale]/(app)/categories/page.tsx`
- `src/components/CategoryManager.tsx`
- `src/services/dbService.ts`
- `src/hooks/useCategories.ts`
- `docs/receipt-scanner-pro/categories.md`

AI primarily outputs Vietnamese category paths. Duplicate names can exist under different parents; translation support should be preserved.

## 12. Budgets

Budgets allow users or groups to set monthly category limits. The budget page shows progress bars, alert indicators, and add/edit/delete controls.

### Technical Flow

- RSC `/budget` reads active group and calls `getBudgets(userId, groupId)`.
- `getBudgets` aggregates current-month item spend by top-level `receiptItems.categoryPath`.
- `BudgetView` renders and calls budget mutations.

### Key Files

- `src/app/[locale]/(app)/budget/page.tsx`
- `src/app/[locale]/(app)/budget/_components/BudgetView.tsx`
- `src/services/dbService.ts`
- `docs/receipt-scanner-pro/budgets.md`

Only monthly budgets are supported. Matching is by lowercased top-level category name.

## 13. Analytics

Analytics shows monthly spending for the last six months, category composition, total spent, and monthly average.

### Technical Flow

- RSC `/analytics` reads active context and calls `getAnalyticsData`.
- Monthly data groups receipts by `SUBSTRING(date, 1, 7)`.
- Results are reversed oldest-to-newest for charting.
- Category data sums item totals by category path.

### Key Files

- `src/app/[locale]/(app)/analytics/page.tsx`
- `src/app/[locale]/(app)/analytics/_components/AnalyticsView.tsx`
- `src/components/AnalyticsDashboard.tsx`
- `src/services/dbService.ts`
- `docs/receipt-scanner-pro/analytics-dashboard.md`

Month labels are currently formatted with English locale in service logic. Category color assignment is tied to pre-sort row index rather than rank.

## 14. Scan History

Scan history gives users a history-focused view of saved receipts separate from transaction management. It reads receipts for the active context and renders scan-history-specific rows and sidebar stats.

### Key Files

- `src/app/[locale]/(app)/scan-history/page.tsx`
- `src/app/[locale]/(app)/scan-history/_components/ScanHistoryView.tsx`
- `ScanHistoryRow.tsx`
- `ScanHistoryStatsSidebar.tsx`

## 15. Groups

Groups support shared expense tracking for families, housemates, teams, or trips.

### User-Facing Behavior

- Create a group; creator becomes owner and admin.
- Join by invite code.
- Switch active group context.
- Manage members, roles, names, and membership.
- Delete the group as owner.

### Technical Flow

- RSC `/groups` reads groups and active group id.
- `GroupsView` manages switching and join state.
- `CreateGroupModal` uses Radix Dialog and Tabs.
- `GroupManagePanel` handles management actions.
- Authenticated server functions in `dbService.ts` perform authorization.

### Key Files

- `src/app/[locale]/(app)/groups/page.tsx`
- `src/app/[locale]/(app)/groups/_components/GroupsView.tsx`
- `CreateGroupModal.tsx`
- `GroupManagePanel.tsx`
- `src/hooks/useGroups.ts`
- `src/hooks/useCreateGroup.ts`
- `src/services/dbService.ts`
- `docs/receipt-scanner-pro/groups.md`

Email/contact invite UI is local/mock and no outbound invitation system is implemented.

## 16. Group Create Page

The richer group setup page provides a group name form, suggested contacts, contact chips, and email invite UI. Selected contacts and invite emails are not persisted or sent.

### Key Files

- `src/app/[locale]/(app)/groups/create/page.tsx`
- `CreateGroupPageView.tsx`
- `ContactSelectRow.tsx`
- `DesktopInfoSidebar.tsx`
- `src/hooks/useCreateGroup.ts`

## 17. User Preferences

Preferences persist the active workspace, language, and finance theme. `setActiveGroupId` validates membership before storing a non-null group id; appearance is normalized against supported theme ids.

### Key Files

- `src/services/dbService.ts`
- `src/hooks/useUserPreferences.ts`
- `src/app/[locale]/(app)/settings/page.tsx`
- `src/app/[locale]/(app)/settings/_components/SettingsView.tsx`
- `docs/user-preferences.md`

Confirm active language and route locale behavior before extending language switching.

## 18. Settings

Settings exposes language switching, account/system status, finance themes, and API key management for REST/MCP integrations. API secrets are shown once; keys can be listed and revoked.

### Key Files

- `src/app/[locale]/(app)/settings/page.tsx`
- `src/app/[locale]/(app)/settings/_components/SettingsView.tsx`
- `src/app/[locale]/(app)/settings/_components/apiKeys/*`
- `src/hooks/useApiKeys.ts`
- `src/services/apiKeyService.ts`
- `src/services/dbService.ts`

Preference writes use authenticated server actions and refresh the App Router tree when themes change.

## 19. Profile

The profile route shows Auth0 user details and may include stats, notifications, theme/security toggles, and account actions.

### Key Files

- `src/app/[locale]/(app)/profile/page.tsx`
- `src/app/[locale]/(app)/profile/_components/ProfileView.tsx`
- `src/components/profile/ProfilePageClient.tsx`
- `src/components/profile/EditGroup.tsx`

## 20. Supabase Storage

Receipt image upload paths use `receipts/<random>_<timestamp>.<ext>` in the `receipt-scanner` bucket. Stored values are paths; signed URLs are generated on demand.

### Key Files

- `src/lib/supabase.ts`
- `src/services/scan.ts`
- `src/services/dbService.ts`
- `src/hooks/useSignedUrls.ts`

## 21. Gemini Prompt Template / AI Taxonomy

The prompt builder in `src/utils/prompt.ts` improves extraction consistency and category assignment. Existing categories influence future output, and `RECEIPT_TEMPLATE_CACHE_KEY` is used for Gemini cached content.

Cache deletion and recreation should use actual cache names returned by Gemini where applicable.

## 22. Legacy API Routes (Removed)

The project migrated internal operations to Server Actions and Server Components. The old route list included `/api/analyze`, `/api/analyze-template`, `/api/categories`, `/api/categories/sync`, `/api/groups`, `/api/groups/join`, `/api/groups/manage`, `/api/preferences/active-group`, `/api/receipts`, and `/api/receipts/[id]`.

Prefer App Router server functions for internal behavior. Some historical route documentation and implementation may be mismatched or incomplete.

## 23. Testing And Verification Feature Surface

Playwright component tests live in `tests/components`, with configuration in `playwright-ct.config.ts` and mocks under `tests/__mocks__`.

## Cross-Feature Business Rules

- Active context drives almost all reads:
  - `activeGroupId === null`: personal mode.
  - `activeGroupId !== null`: group mode.
- Categories and budgets are context-scoped.
- Receipts and receipt items are the source of truth for dashboard, analytics, budgets, history, and scan history.
- The owner can delete a group; owners/admins can manage members.
- Receipt image paths are stored and signed URLs are generated on demand.
- AI category output grows the category tree automatically.

## Current High-Value Gaps

- Make scan save flow honor `userPreferences.activeGroupId`.
- Add membership-aware authorization for group receipt detail pages.
- Improve category aggregation to merge same top-level category totals.
- Normalize category names/paths to reduce duplicate categories.
- Clean lint config to exclude generated Playwright cache assets.
