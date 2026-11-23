# Groups

## Overview

Groups enable shared receipt tracking between multiple users (e.g., families, housemates, teams). When a user operates in group context, all scanned receipts and categories are shared with all group members.

## Group Lifecycle

```
User creates group
      │
      ├── Group record inserted with unique invite CODE
      ├── Creator added as group member with role ADMIN
      └── activeGroupId set in userPreferences

Other users join via CODE
      │
      └── groupMembers row inserted with role MEMBER

Group owner can:
      ├── Update group name
      ├── Change member roles (ADMIN / MEMBER)
      ├── Remove members (leave action)
      └── Delete group (cascades members)
```

## Roles

| Role | Capabilities |
|---|---|
| `ADMIN` | Full management (rename, manage members, delete group) |
| `MEMBER` | View shared receipts and categories; scan into group |

Only the group owner (`ownerId`) can delete the group. Role management is handled by authenticated server functions in `src/services/dbService.ts`.

## Invite Code

Each group has a 6-character uppercase alphanumeric code (e.g., `A3B7XZ`). This code is shared out-of-band. Any authenticated user who knows the code can join.

**Code generation:**
```typescript
Math.random().toString(36).substring(2, 8).toUpperCase()
```

## Data Scoping in Group Context

Once a user has an `activeGroupId`, all data reads/writes use group context:

- `getReceipts(userId, groupId)` → `WHERE group_id = ?`
- `getCategories(userId, groupId)` → `WHERE group_id = ?`
- `addReceipt(data)` → inserts with `groupId` set
- `getBudgets(userId, groupId)` → `WHERE group_id = ?`

A user can switch back to personal context by setting `activeGroupId = null` in preferences.

## Service Functions

All in `src/services/dbService.ts`:

| Function | Description |
|---|---|
| `createGroup(name, user)` | Creates group + adds creator as ADMIN |
| `getGroupsForUser(uid)` | Lists all groups the user belongs to |
| `getCurrentActiveGroupDetail(groupId)` | Gets group + its members |
| `joinGroup(code, user)` | Looks up group by code, inserts member with `onConflictDoNothing` |
| `updateGroupName(groupId, name)` | Renames the group |
| `deleteGroup(groupId)` | Deletes members then the group |
| `leaveGroup(groupId, userId)` | Removes a single member |
| `updateMemberRole(groupId, userId, role)` | Changes a member's role |
| `getGroupsForCurrentUser()` | Authenticated server function for the current user's groups |
| `createGroupForCurrentUser(name)` | Authenticated server function that creates a group and makes it active |
| `joinGroupForCurrentUser(code)` | Authenticated server function that joins by invite code and makes it active |
| `setActiveGroupForCurrentUser(groupId)` | Authenticated server function for switching group context |
| `updateGroupNameForCurrentUser(groupId, name)` | Authenticated admin/owner group rename action |
| `updateMemberRoleForCurrentUser(groupId, userId, role)` | Authenticated admin/owner role update action |
| `removeGroupMemberForCurrentUser(groupId, userId)` | Authenticated admin/owner member removal action |
| `leaveGroupForCurrentUser(groupId)` | Authenticated self-service leave action |
| `deleteGroupForCurrentUser(groupId)` | Authenticated owner-only group deletion action |

## Hooks

| Hook | Description |
|---|---|
| `useGroups(userId)` | TanStack Query, key: `['groups', userId]` |
| `useCreateGroup()` | `src/hooks/useCreateGroup.ts` — mutation |

## Server Function Flow

Client components call server functions directly:

- `GroupsView` calls `getGroupsForCurrentUser`, `getActiveGroupIdForCurrentUser`, and `setActiveGroupForCurrentUser`.
- `CreateGroupModal` and the create page call `createGroupForCurrentUser` and `joinGroupForCurrentUser`.
- `GroupManagePanel` calls the authenticated rename, role, remove, leave, and delete functions.

The current user is read from the Auth0 session inside these functions, so the client does not pass an acting user id for authorization.

## UI

Route: `/groups`
Components: `src/app/[locale]/(app)/groups/_components/GroupsView.tsx` and `GroupManagePanel.tsx`

Displays:
- List of groups the user belongs to
- Join/create group forms
- Member list with roles
- Management actions for ADMIN members

Client components call the authenticated server functions above instead of calling group API routes directly.
