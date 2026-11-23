# Architecture

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Auth | Auth0 (`@auth0/nextjs-auth0`) |
| Database | PostgreSQL via Drizzle ORM |
| BaaS / Storage | Supabase (Storage only) |
| AI | Google Gemini 2.5 Flash (`@google/genai`) |
| Server State | TanStack Query v5 |
| UI Components | Radix UI + TailwindCSS |
| i18n | next-intl (EN, VI) |
| Form handling | react-hook-form |

## Folder Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── (app)/          # Authenticated shell (layout with navigation)
│   │   │   ├── dashboard/
│   │   │   ├── transactions/
│   │   │   ├── scan/       # incl. scan/bulk
│   │   │   ├── scan-jobs/  # bulk scan job list + results
│   │   │   ├── budget/
│   │   │   ├── analytics/
│   │   │   ├── categories/
│   │   │   ├── groups/
│   │   │   ├── settings/
│   │   │   └── profile/
│   │   └── (auth)/         # Unauthenticated pages (login)
│   └── api/                # Next.js Route Handlers
│       ├── analyze/
│       ├── categories/
│       ├── groups/
│       │   ├── join/
│       │   └── manage/
│       └── receipts/
│           └── [id]/
├── components/             # Globally reusable UI components
├── hooks/                  # TanStack Query hooks
├── lib/                    # Auth0 / Supabase / utility clients
├── services/               # Server-side data access layer
│   ├── dbService.ts        # All DB queries (Drizzle ORM)
│   └── scan.ts             # Receipt scanning orchestration
│   └── core/               # Session-free logic shared by server actions and workflows
├── workflows/              # Vercel Workflow definitions (scanJob.ts)
├── types/                  # Shared TypeScript types
└── utils/
    └── prompt.ts           # Gemini prompt builder
```

## Request Lifecycle

### Server Components (reads)
```
page.tsx (RSC)
  └── calls dbService.ts function directly (Server Action)
        └── Drizzle ORM → Postgres
```

### Client Mutations (writes)
```
Component (client)
  └── calls hook (useMutation)
        └── calls Server Action in services/
              ├── auth0.getSession() — validates auth
              ├── Drizzle ORM → Postgres
              └── supabase.storage — file uploads
```

### AI Scan Flow
```
ScanView (client)
  └── useScanReceipt hook
        ├── analyzeReceipt() → scan.ts (Server Action)
        │     ├── Gemini 2.5 Flash (vision)
        │     └── returns structured ReceiptData[]
        └── saveReceipt() → scan.ts (Server Action)
              ├── syncCategoryPath() — ensure categories exist
              ├── supabase.storage.upload() — store image
              └── addReceipt() → dbService.ts
```

### Bulk Scan (background)
```
BulkScanView → useBulkScanUpload → upload to Blob → createScanJob (Server Action)
  └── start(scanJobWorkflow) → per image: analyzeReceiptImages + saveReceiptForUser (services/core)
        └── notifyUser → Knock workflow (in-app feed, via Vercel Connect token) + Web Push
```
See [scan-jobs.md](./scan-jobs.md) and [notifications.md](./notifications.md).

## Authentication

Auth0 is the identity provider. The session is accessed on the server via `auth0.getSession()` from `@/lib/auth0`. All API routes and Server Actions verify the session before processing requests.

The `user.sub` (Auth0 subject ID) is used as the primary `userId` across all tables.

## Data Isolation

All data queries are scoped by **either** `userId` (personal) **or** `groupId` (shared). When a user has an `activeGroupId` set in their preferences, they operate in group context — data belongs to the group rather than the individual.

```
groupId != null  →  group-scoped data
groupId == null  →  user-scoped data (personal)
```
