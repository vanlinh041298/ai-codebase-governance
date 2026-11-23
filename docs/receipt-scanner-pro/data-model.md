# Data Model

## Entity Relationship Diagram

```
users (Auth0)
  │
  ├──< userPreferences (1:1)
  │         └── activeGroupId ──> groups.id
  │
  ├──< categories (1:N)
  │         ├── parentId ──> categories.id (self-ref hierarchy)
  │         └── groupId  ──> groups.id (optional: group-owned)
  │
  ├──< receipts (1:N)
  │         ├── groupId ──> groups.id (optional)
  │         └──< receiptItems (1:N)
  │                   ├── categoryId ──> categories.id
  │                   └── categoryPath (denormalized text)
  │
  └──< groupMembers (N:M via groups)

groups
  ├──< groupMembers (members with roles)
  └──< budgets (group-scoped budgets)

budgets (1:N per user or group)

scanJobs (1:N per user)
  └──< scanJobItems (1:N, cascade delete)

pushSubscriptions (1:N per user, endpoint PK)
```

## Tables

Receipt search adds generated `search_text` columns on `receipts` and
`receipt_items`, plus `pg_trgm` GIN indexes on those columns, `categories.name`
and `category_translations.translated_name`. See
[transaction-search.md](./transaction-search.md).

### `categories`
Hierarchical product/expense categories. Supports both personal and group-shared trees.

| Column | Type | Description |
|---|---|---|
| `id` | text PK | `cat_<random>` |
| `name` | text | Category label |
| `parentId` | text | Self-ref parent (null = root) |
| `groupId` | text | Group ownership (null = personal) |
| `userId` | text | Owner user sub |

**Index:** `idx_categories_parent_id` on `parentId`

### `categoryTranslations`
Optional multilingual names for categories.

| Column | Type | Description |
|---|---|---|
| `categoryId` | text FK | → `categories.id` |
| `lang` | text | Language code (`en`, `vi`) |
| `translatedName` | text | Translated label |

**PK:** `(categoryId, lang)`

### `groups`
Collaboration groups (family, team, etc.). Each group has a unique shareable `code`.

| Column | Type | Description |
|---|---|---|
| `id` | text PK | `grp_<timestamp>` |
| `name` | text | Display name |
| `code` | text UNIQUE | 6-char uppercase invite code |
| `ownerId` | text | Creator's user sub |
| `createdAt` | bigint | Unix timestamp (ms) |

### `groupMembers`
Membership and role assignments.

| Column | Type | Description |
|---|---|---|
| `groupId` | text FK | → `groups.id` |
| `userId` | text | Member's user sub |
| `nickname` | text | Display name within group |
| `role` | text | `ADMIN` or `MEMBER` |
| `joinedAt` | bigint | Unix timestamp (ms) |

**PK:** `(groupId, userId)`

### `receipts`
A single scanned receipt (the header/summary record).

| Column | Type | Description |
|---|---|---|
| `id` | text PK | `rec_<timestamp>` |
| `uid` | text UNIQUE | Invoice/receipt number extracted from image |
| `date` | text | `YYYY-MM-DD` from receipt |
| `address` | text | Store name and address |
| `totalBilled` | numeric | Subtotal before discounts |
| `totalDiscount` | numeric | Total discount applied |
| `amountPaid` | numeric | Final amount paid |
| `groupId` | text | Group context (null = personal) |
| `userId` | text | Owner user sub |
| `createdAt` | bigint | Unix timestamp (ms) |
| `images` | jsonb | Array of Supabase storage paths |

**Indexes:** `idx_receipts_group_id`, `idx_receipts_user_id`

### `receiptItems`
Individual line items within a receipt.

| Column | Type | Description |
|---|---|---|
| `receiptId` | text FK | → `receipts.id` |
| `itemId` | text PK | `<receiptId>_item_<index>` |
| `name` | text | Product name |
| `amount` | numeric | Quantity |
| `pricePerUnit` | numeric | Unit price |
| `totalPerItem` | numeric | `amount × pricePerUnit` (after discount) |
| `discounted` | numeric | Discount per item (nullable) |
| `categoryId` | text FK | Category (resolved) |
| `categoryPath` | text | Denormalized path, e.g. `Thực phẩm > Hải sản > Cá` |

**Indexes:** `idx_receipt_items_receipt_id`, `idx_receipt_items_category_id`, `idx_receipt_items_category_path`

### `receiptsCategories`
Junction table linking receipts to their top-level categories (for broad filtering).

| Column | Type |
|---|---|
| `receiptId` | text FK |
| `categoryId` | text FK |

**PK:** `(receiptId, categoryId)`

### `userPreferences`
Per-user application preferences (1:1).

| Column | Type | Description |
|---|---|---|
| `userId` | text PK | Auth0 sub |
| `activeGroupId` | text FK | Currently active group context (null = personal) |
| `activeLang` | text | `en` or `vi` (default: `en`) |
| `appearance` | text | Finance theme id such as `cupertino-blue` or `midnight-ledger` |
| `updatedAt` | bigint | Unix timestamp (ms) |

### `budgets`
Spending limits by category for a given period.

| Column | Type | Description |
|---|---|---|
| `id` | text PK | `bgt_<timestamp>` |
| `userId` | text | Owner |
| `groupId` | text FK | Group context (nullable) |
| `categoryName` | text | Matched against `categoryPath` top-level segment |
| `limitAmount` | numeric | Spending limit |
| `period` | text | `monthly` (default) |
| `createdAt` | bigint | Unix timestamp (ms) |

**Indexes:** `idx_budgets_user_id`, `idx_budgets_group_id`

### `scanJobs` / `scanJobItems`
Bulk scan jobs, see [scan-jobs.md](./scan-jobs.md).

| Column | Type | Description |
|---|---|---|
| `scan_jobs.id` | text PK | `job_<uuid>` |
| `userId`, `groupId` | text | Owner and group context at creation |
| `status` | text | `queued`, `running`, `completed`, `completed_with_errors`, `failed` |
| `language`, `scanFlow` | text | Fixed at creation (`activeLang`, `scan-flow-type` flag) |
| `totalCount`, `succeededCount`, `failedCount` | integer | Progress counters |
| `workflowRunId` | text | Vercel Workflow run id |
| `scan_job_items.id` | text PK | `<jobId>_<position>` |
| `image` | jsonb | Uploaded Blob `{ url, pathname, contentType, … }` |
| `status` | text | `queued`, `processing`, `succeeded`, `failed` |
| `receipts` | jsonb | `ScanJobReceiptResult[]` per detected receipt (`receiptId` or `errorCode`/`errorDetails`) |
| `errorCode`, `errorMessage` | text | Item-level failure |

### `apiKeys`
`api_keys` stores personal API keys for the REST/MCP integration (see [public-api.md](./public-api.md)).

| Column | Type | Description |
|---|---|---|
| `id` | text PK | `key_<uuid>` |
| `userId` | text | Key owner |
| `name` | text | User-given label |
| `prefix` | text | First 12 characters of the secret, for display |
| `keyHash` | text unique | SHA-256 of the secret (plaintext is never stored) |
| `createdAt`, `lastUsedAt`, `revokedAt` | bigint | Epoch ms; `revokedAt` set on revoke |
| `scopes` | text[] | Granted scopes, e.g. `transactions:read` (see `API_KEY_SCOPES`) |
| `groupAccess` | text | `personal`, `all` or `selected` |
| `groupIds` | text[] | Allowed groups when `groupAccess = 'selected'` |

### `pushSubscriptions`
`push_subscriptions` stores a Web Push `endpoint` (PK) with its `p256dh` and
`auth` keys per user. The in-app notification feed lives in Knock, not in this
database (see [notifications.md](./notifications.md)).

## Key Design Decisions

- **Dual-context scoping:** Every query accepts `(userId, groupId)`. When `groupId` is non-null, queries filter by group; otherwise they filter by `userId WHERE groupId IS NULL`. This prevents personal and group data from mixing.
- **Denormalized `categoryPath`:** Item category is stored as a full text path (e.g., `Thực phẩm > Hải sản`) so aggregations can be done without joining through the category tree. The leaf `categoryId` FK is also stored for relational integrity.
- **Numeric as text in DB:** All monetary values (`totalBilled`, `amountPaid`, etc.) are stored as Postgres `numeric` but cast to `string` on insert and back to `number` on read via `Number()`.
- **Unix milliseconds for timestamps:** All time columns (`createdAt`, `joinedAt`, `updatedAt`) use `bigint` with millisecond precision, matching `Date.now()`.
