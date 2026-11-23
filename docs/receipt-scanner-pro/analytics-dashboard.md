# Analytics & Dashboard

## Dashboard Stats

**Service:** `getDashboardStats(userId, groupId)` in `dbService.ts`
**Route:** `/dashboard`
**Component:** `DashboardView`

The dashboard provides a quick spending summary. All queries are scoped to the user/group context.

### Computed Metrics

| Metric | How it's computed |
|---|---|
| `currentMonthTotal` | `SUM(amountPaid)` where `date LIKE 'YYYY-MM%'` |
| `previousMonthTotal` | Same for the previous calendar month |
| `changePercent` | `((current - prev) / prev) × 100` |
| `receiptCountThisWeek` | `COUNT(*)` where `createdAt >= now - 7 days` |
| `recentReceipts` | Latest 5 receipts ordered by `date DESC, createdAt DESC` |
| `topCategories` | Top 5 categories by `SUM(totalPerItem)` (current period, no date filter) |

### Top Categories Logic

```sql
SELECT categoryPath, SUM(totalPerItem) as total
FROM receipt_items
JOIN receipts ON ...
WHERE <user/group filter>
GROUP BY categoryPath
```

The `categoryPath` top-level segment is extracted (`split('>')[0].trim()`) and results are sorted descending by total spend, returning the top 5.

---

## Analytics

**Service:** `getAnalyticsData(userId, groupId)` in `dbService.ts`
**Route:** `/analytics`
**Component:** `AnalyticsView`

Date-range queries convert empty or whitespace-only receipt dates to SQL `NULL`
before casting to `date`. These undated receipts remain saved but are excluded
from date-based analytics instead of causing the entire query to fail.

### Monthly Spending Chart

```sql
SELECT SUBSTRING(date, 1, 7) AS monthYear, SUM(amountPaid)
FROM receipts
WHERE <user/group filter>
GROUP BY SUBSTRING(date, 1, 7)
ORDER BY monthYear DESC
LIMIT 6
```

Results are reversed to show oldest → newest (chronological order for chart rendering).

Month labels are formatted as short month names (`Jan`, `Feb`, etc.) using
`toLocaleString('en', { month: 'short' })`.

### Category Breakdown

Same aggregation as dashboard top categories, but includes:

- `amount` — total spent
- `percent` — `(amount / totalCategorySpend) × 100`, rounded
- `color` — a cycling set of Tailwind color classes:
  ```
  ['bg-primary', 'bg-emerald-500', 'bg-blue-400', 'bg-amber-400', 'bg-slate-300']
  ```

Returns top 5 categories sorted by amount descending.

### Category Spending by Month

**Component:** `CategoryMonthlyBarChart` (below the pie and time-series charts)
**Hook:** `useCategoryMonthlyBars` · **Helper:** `buildCategoryMonthlyBars` in `src/lib/analyticsMonthlyBars.ts`

A bar chart with one bar per calendar month for a single parent category.

- **Months** follow the page's duration filter (`analyticsData.range.startDate` → `endDate`): one bar for a single month, three for "Last 3 months", and so on. Months without spending show as `0`, so gaps stay visible.
- **Data** is the duration's filtered entries (`filteredEntries` from `useAnalyticsChartData`); no extra server query.
- **Category picker** lists the parent categories in the duration, highest spending first, and defaults to the top one. If the chosen category has no spending after the filter changes, it falls back to the top category.
- The card header shows the category's total for the duration. Value labels are drawn on top of the bars when there are 12 months or fewer.

### Summary Figures

| Metric | Formula |
|---|---|
| `totalSpent` | Sum of all monthly amounts (last 6 months) |
| `avgMonthly` | `totalSpent / monthlySpending.length` |

### `AnalyticsData` Shape

```typescript
interface AnalyticsData {
  monthlySpending: { month: string; amount: number }[];
  topCategories: {
    name: string;
    amount: number;
    percent: number;
    color: string;
  }[];
  totalSpent: number;
  avgMonthly: number;
}
```

---

## Data Scoping

Both dashboard and analytics respect the same `(userId, groupId)` dual-context scoping. The active group (from `userPreferences.activeGroupId`) is passed from the page's RSC down to the service functions.
