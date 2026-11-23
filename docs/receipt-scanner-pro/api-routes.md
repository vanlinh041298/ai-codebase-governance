# API Routes (Deprecated)

> **Current routes:** the only route handlers are the public, API-key authenticated `/api/v1/*` REST endpoints and the `/api/mcp` MCP server for third-party integrations. See [public-api.md](./public-api.md). Everything below describes the removed internal routes.

> **Status: Removed.** The project has migrated to **Server Components** for data fetching and **Server Actions** for mutations, as per the design guidelines. Direct HTTP API routes are no longer maintained or present in `src/app/api/`.

The following documentation is kept for reference of the logic that was migrated to `src/services/dbService.ts` and `src/services/scan.ts`.

## Receipts

### `GET /api/receipts`

Returns receipts for the authenticated user.

**Query params:**
- `groupId` (optional) — if provided, returns receipts for that group; otherwise returns personal receipts.

**Response:** `ReceiptData[]` (items array is empty in this route; fetch `GET /api/receipts/[id]` for full details).

---

### `POST /api/receipts`

Creates a new receipt record.

**Body:** `ReceiptData` JSON
**Notes:** The `userId` is always overridden with the session user's `sub`, ignoring any client-provided value.

---

### `GET /api/receipts/[id]`

Returns a single receipt by ID including its items.

**Response:** `SavedReceipt` with populated `items[]`.

## Categories

### `GET /api/categories`

Returns categories for the authenticated user.

**Query params:**
- `groupId` (optional) — group categories if provided, else personal.

**Response:** `Category[]`

## Receipt Analysis (AI)

### `POST /api/analyze`

Sends a receipt image to Gemini for analysis.

**Body:**
```json
{
  "img": "<base64 data URL>",
  "type": "image/jpeg",
  "userId": "<user sub>"
}
```

**Response:**
- `200`: `{ receipts: ReceiptData[] }`
- `400`: `{ error: "NOT_A_RECEIPT" }`
- `500`: `{ error: "<message>" }`

**Notes:** This route fetches the user's existing categories and injects them into the Gemini prompt. Uses the model `gemini-2.5-flash`. References cached content `receipt_analysis_template`.

> The preferred path for scanning is the Server Action `analyzeReceipt()` in `src/services/scan.ts`, which also handles prompt caching logic. This route exists as an alternative HTTP endpoint.

## Groups

### `GET /api/groups`

Returns all groups the authenticated user belongs to.

**Response:** `Group[]` (members array is empty in this response).

---

### `POST /api/groups`

Creates a new group.

**Body:** `{ name: string }`
**Response:** Created `Group` object with the generated invite `code`.

---

### `POST /api/groups/join`

Joins a group by invite code.

**Body:** `{ code: string }`
**Response:** `Group` object for the joined group.
**Errors:** `404` if no group matches the code.

---

### `POST /api/groups/manage`

Multipurpose group management.

**Body:**
```json
{
  "action": "update_role" | "leave" | "delete" | "update_name",
  "groupId": "string",
  "userId": "string",
  "role": "ADMIN" | "MEMBER",
  "name": "string"
}
```

| Action | Authorization | Effect |
|---|---|---|
| `update_role` | Any member | Updates target user's role in group |
| `leave` | Self | Removes requesting user from group |
| `delete` | Owner only | Deletes all members then group |
| `update_name` | Any member | Renames group |

**Response:** `{ success: true }` or error.

## Error Responses

All routes follow the same error shape:

```json
{ "error": "<message>" }
```

With HTTP status codes:
- `400` — Bad request / validation error
- `401` — Unauthenticated
- `403` — Forbidden (authorization failed)
- `404` — Resource not found
- `500` — Internal server error
