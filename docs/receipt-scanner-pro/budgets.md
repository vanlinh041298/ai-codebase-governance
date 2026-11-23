# Budgets

## Overview

Budgets let users (or groups) set monthly spending limits per category. The app tracks actual spending against these limits using current-month receipt data.

## Budget Model

```typescript
interface Budget {
  id: string;          // "bgt_<timestamp>"
  userId: string;
  groupId: string | null;
  categoryName: string; // matched against receiptItems.categoryPath top-level
  limitAmount: number;
  period: string;       // "monthly" (default, only option currently)
  createdAt: number;    // Unix ms
}

interface BudgetWithSpending extends Budget {
  spent: number; // actual spend this month
}
```

## How Spending is Calculated

**Service:** `getBudgets(userId, groupId)` in `dbService.ts`

1. Fetch all budget rows for the user/group.
2. Aggregate current-month item spending by top-level category:
   ```sql
   SELECT categoryPath, SUM(totalPerItem)
   FROM receipt_items
   JOIN receipts ON ...
   WHERE <user/group filter>
     AND receipts.date LIKE '<YYYY-MM>%'
   GROUP BY categoryPath
   ```
3. Build a spending map: extract the top-level segment from each `categoryPath` (everything before the first `>`), lowercased.
4. For each budget row, look up `spendingMap[budget.categoryName.toLowerCase()]`.
5. Return `BudgetWithSpending` with the calculated `spent` value.

### Example

If `categoryName = "Thực phẩm"` and item paths include:
- `Thực phẩm > Hải sản > Cá` → contributes to `thực phẩm`
- `Thực phẩm > Rau củ` → contributes to `thực phẩm`

All items with a `categoryPath` starting with `Thực phẩm` will count toward this budget.

## Period

Currently only `monthly` is supported. The spending calculation always uses the
current calendar month (`YYYY-MM` prefix match on `receipts.date`).

## CRUD Operations

All in `src/services/dbService.ts`:

| Function | Description |
|---|---|
| `getBudgets(userId, groupId)` | Returns budgets with current-month spending |
| `createBudget(data)` | Inserts a new budget row |
| `updateBudget(id, limitAmount)` | Updates the limit for an existing budget |
| `deleteBudget(id)` | Removes a budget |

## UI

Route: `/budget`
Component: `src/app/[locale]/(app)/budget/_components/BudgetView.tsx`

Displays:
- Budget cards per category with a progress bar (spent / limit).
- Visual alert indicators when spending approaches or exceeds the limit.
- Controls to add, edit, and delete budgets.

## Data Scoping

Budgets follow the same dual-scoping as receipts:

- Personal budgets: `WHERE user_id = ? AND group_id IS NULL`
- Group budgets: `WHERE group_id = ?`

A user's `activeGroupId` in `userPreferences` determines which context is active when the budget page loads.
