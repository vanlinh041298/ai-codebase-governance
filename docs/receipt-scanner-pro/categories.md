# Categories

## Overview

Categories provide a hierarchical taxonomy for classifying receipt line items. They are generated automatically during receipt scanning and can also be managed manually.

## Category Tree Structure

Categories form a **self-referential tree** using the `parentId` column:

```
Thực phẩm (root, parentId = null)
  └── Hải sản (parentId = "cat_abc")
        └── Cá (parentId = "cat_xyz")

Đồ uống (root, parentId = null)
  └── Nước ngọt
```

The depth is unlimited. Top-level categories have `parentId = null`.

## Data Scoping

Categories belong to either a **user** or a **group**:

| Condition | Scope |
|---|---|
| `groupId != null` | Shared across all group members |
| `groupId == null` | Personal to `userId` |

This mirrors the same dual-scoping pattern used for receipts. When a user is in group context (has `activeGroupId` set), all category reads and writes use the group's category tree.

## Auto-Sync from AI (`syncCategoryPath`)

The primary way categories are created is through the `syncCategoryPath` function called during receipt save.

**Function:** `src/services/dbService.ts` → `syncCategoryPath(userId, groupId, path, language?)`

```
Input path: "Thực phẩm > Hải sản > Cá"

Step 1: Split → ["Thực phẩm", "Hải sản", "Cá"]
Step 2: For each segment:
  - Query the scoped tree and compare against the requested localized name when `language` is provided.
  - If found: use that ID as the next parentId
  - If not found: INSERT new category, upsert the localized translation, and use the new ID as next parentId
Step 3: Return the leaf category ID
```

This means the category tree grows organically from receipt data. No seed data or manual setup is required.

## Reading Categories

**Service:** `getCategories(userId, groupId, language?)` in `dbService.ts`

Returns a flat list of all categories for the given context. If `language` is omitted, the service reads the user's preferred `activeLang` from `user_preferences`. `Category.name` is always the translated label for the requested/preferred language, with `categories.name` as fallback.

Default display reads return only the requested language in the `translations` map so view components do not accidentally render all language variants. Internal service calls can opt into all translations for duplicate detection and RAG/category-sync matching.

**Hook:** `useCategories(userId, groupId, language)` — TanStack Query wrapper with cache key `['categories', userId, groupId, language]`.

Transactions prefetches the scoped list before rendering category badges. An empty array is only cached when the category service returns one; seeding the cache with `[]` would skip the first fetch during the five-minute freshness window.

## Manual Category Management

Manual category changes use server functions in `src/services/dbService.ts`; the App Router page does not call category API routes.

| Function | Purpose |
|---|---|
| `createCategory({ groupId, name, parentId, language, translations })` | Creates a root category or subcategory in the active scope and upserts localized names. |
| `updateCategory({ groupId, categoryId, name, parentId, language, translations })` | Renames or reparents a category, upserts localized names, then refreshes stored receipt item `categoryPath` values for the category and its descendants. |
| `deleteCategory({ groupId, categoryId })` | Deletes only unused leaf categories. Categories with children or linked receipt items are protected. |

The mutations read the user from the Auth0 session and delegate to `core/categoryMutations.ts` (shared with the REST/MCP API, which passes the API key owner).

Validation rules:

- Category names are trimmed and required.
- Sibling categories cannot share the same name in the same scope and requested language.
- A category cannot be moved under itself or one of its descendants.
- Group-scoped mutations verify that the user is a member of the target group.
- Deletes are intentionally conservative so existing receipt history is not orphaned.

## Category Translations

The `categoryTranslations` table stores translated names per language (`en`, `vi`). `categories.name` remains the canonical fallback, while `category_translations` powers localized reads and writes.

Service behavior:

- `getCategories(..., "vi")` returns Vietnamese labels where available.
- `getCategories(..., "en")` returns English labels where available.
- `getCategories(userId, groupId)` falls back to the user's preferred language from `user_preferences`.
- Create/update calls always upsert all supported language rows (`en`, `vi`). Known category aliases such as `Food` and `Thực phẩm` are normalized into the same translation set.
- Optional `translations` input can write multiple language labels at once.
- `syncCategoryPath(..., language)` matches existing categories by every stored sibling translation before creating new rows. This prevents duplicate categories that differ only by language.
- Receipt, analytics, dashboard, budget, transaction, and scan reads rebuild display paths from `categoryIdsPath` plus translated category rows instead of trusting stored `categoryPath` text.
- Receipt analysis prompts use `getCategoryDisplayPaths(userId, groupId, language)` so the AI receives translated hierarchical paths, not raw category IDs or canonical fallback names.

## UI — Category Manager

Route: `/categories`
Component: `src/components/CategoryManager.tsx`

Displays the category tree with hierarchy, spending totals per category, receipt item counts, and management options. Data is fetched via `getCategories()` and `getReceipts()` directly in the RSC page, then passed as props.

Supported UI actions:

- Create a root category.
- Create a subcategory from any existing category row.
- Rename a category.
- Move a category to a new parent.
- Delete an unused leaf category.

The UI disables delete for categories that have subcategories or linked receipt items. Server-side validation repeats the same constraints for safety.
