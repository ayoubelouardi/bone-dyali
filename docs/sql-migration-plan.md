# SQL Migration Plan — JSON blob → Relational SQL

**Branch:** `feature/sql-migration`  
**Goal:** Replace the localStorage + JSONB blob sync architecture with a proper
relational Supabase SQL schema. Every read and write goes directly to the
database — no local cache, no sync service, no `updated_at` timestamp
comparison.

---

## Why

The current architecture stores the entire workspace as one JSONB blob in
`workspaces.data` and syncs it to localStorage via a polling service every 10
minutes. This causes cross-device data loss when the timestamp comparison logic
misjudges which side is newer, and adds significant complexity (sync state,
retry logic, push vs. pull decisions).

Moving to direct SQL calls eliminates all of that: every mutation is immediately
durable in Postgres, and every read fetches live data. There is nothing to sync.

---

## Decisions

| Topic | Decision |
|---|---|
| Offline / no-Supabase mode | **Remove** — app always requires Supabase |
| Export / Import feature | **Keep** — rewrite to use DB instead of localStorage |
| P-type line item redundant fields | **Clean up** — proper columns, no aliases |
| `po_number` generation | **Application-side** — `SELECT MAX(po_number) + 1` before INSERT |

---

## Step 0 — Git

1. Commit current sync fixes on `feature/auth`
2. Create and checkout `feature/sql-migration`
3. Save this plan to `docs/sql-migration-plan.md` and commit

---

## Step 1 — New Database Schema (`database/schema.sql`)

Single file. Opens with `DROP TABLE IF EXISTS … CASCADE` on every old table in
dependency order, then rebuilds from scratch.

### Tables

#### `workspaces`
```sql
id          UUID  PK  DEFAULT gen_random_uuid()
owner_id    UUID  FK → auth.users  NOT NULL  UNIQUE
name        TEXT  NOT NULL  DEFAULT 'My Workspace'
created_at  TIMESTAMPTZ  DEFAULT NOW()
```

#### `books`
```sql
id            UUID  PK  DEFAULT gen_random_uuid()
workspace_id  UUID  FK → workspaces  ON DELETE CASCADE  NOT NULL
name          TEXT  NOT NULL
owner_name    TEXT  NOT NULL  DEFAULT ''
color         TEXT  NOT NULL  DEFAULT '#6366f1'
created_at    TIMESTAMPTZ  DEFAULT NOW()
```
> `nextPoNumber` is removed — computed application-side via `MAX(po_number)+1`.

#### `purchase_orders`
```sql
id              UUID  PK  DEFAULT gen_random_uuid()
book_id         UUID  FK → books  ON DELETE CASCADE  NOT NULL
workspace_id    UUID  FK → workspaces  ON DELETE CASCADE  NOT NULL
po_number       INT   NOT NULL
type            TEXT  NOT NULL  CHECK (type IN ('O','OR','P'))
date            DATE  NOT NULL
client_name     TEXT  NOT NULL  DEFAULT ''
client_address  TEXT  NOT NULL  DEFAULT ''
client_extra    TEXT  NOT NULL  DEFAULT ''
locked          BOOLEAN  NOT NULL  DEFAULT false
created_at      TIMESTAMPTZ  DEFAULT NOW()
updated_at      TIMESTAMPTZ  DEFAULT NOW()
```
> `workspace_id` is denormalized for RLS simplicity (avoids join in policy expression).

#### `line_items`
```sql
id                  UUID  PK  DEFAULT gen_random_uuid()
purchase_order_id   UUID  FK → purchase_orders  ON DELETE CASCADE  NOT NULL
workspace_id        UUID  FK → workspaces  ON DELETE CASCADE  NOT NULL
sort_order          INT   NOT NULL  DEFAULT 0

-- O / OR type fields
description   TEXT     NOT NULL  DEFAULT ''
quantity      NUMERIC  NOT NULL  DEFAULT 0
unit_price    NUMERIC  NOT NULL  DEFAULT 0
code          TEXT     NOT NULL  DEFAULT ''

-- P type fields
payment_type  TEXT     CHECK (payment_type IN ('Cash','Check','Etra'))
amount        NUMERIC  NOT NULL  DEFAULT 0
n_serie       TEXT     NOT NULL  DEFAULT ''
item_name     TEXT     NOT NULL  DEFAULT ''
```
> `workspace_id` denormalized for RLS. P-type redundant aliases (`description=name`,
> `quantity=1`, `unitPrice=amount`, `code=nSerie`) are removed — clean columns only.

#### `workspace_members` — unchanged
#### `invite_codes` — unchanged

### RLS Pattern

All four new tables follow the same pattern:
- Admin (workspace owner via `is_workspace_owner()`) — full CRUD
- Viewers (member via `workspace_members`) — SELECT only

The `is_workspace_owner(ws_id UUID)` SECURITY DEFINER helper is kept.

---

## Step 2 — New Data Layer (`src/lib/db.js`)

Replaces `src/lib/storage.js`. All functions are `async` and call Supabase
directly.

| Function | Description |
|---|---|
| `getBooks(workspaceId)` | SELECT books ordered by created_at |
| `getBook(bookId)` | SELECT single book |
| `createBook(workspaceId, {name, ownerName, color})` | INSERT, returns new row |
| `updateBook(bookId, updates)` | UPDATE, returns updated row |
| `deleteBook(bookId)` | DELETE (cascades to POs and line_items) |
| `getPurchaseOrders(bookId)` | SELECT POs with nested line_items, ordered by po_number |
| `getPurchaseOrder(bookId, poId)` | SELECT single PO with line_items |
| `createPurchaseOrder(bookId, workspaceId, {client, lineItems, date, type})` | MAX(po_number)+1 → INSERT PO → bulk INSERT line_items |
| `updatePurchaseOrder(poId, updates)` | UPDATE PO + DELETE old line_items + INSERT new line_items |
| `togglePOLock(poId)` | UPDATE locked = NOT locked, returns updated PO |
| `nukeWorkspace(workspaceId)` | DELETE FROM books WHERE workspace_id=… (cascades everything) |

---

## Step 3 — Hooks (`useBooks.js`, `usePurchaseOrders.js`)

- Replace `storage.*` calls with `await db.*`
- Add `loading` + `error` state
- `workspaceId` injected from `useAuth()`
- State set from returned DB rows (no re-read step)
- Fetch on mount from Supabase

---

## Step 4 — `AuthContext.jsx`

Remove:
- `syncStatus`, `forceSyncNow`, `startSync`, `stopSync` imports and state
- `nukeDatabase` import
- `isSupabaseConfigured()` guards (Supabase always required)

Keep:
- Google OAuth sign-in / sign-out
- `resolveWorkspace` (checks ownership + membership)
- `setWorkspaceInfo`
- `leaveWorkspace` (DB delete only, no localStorage)

---

## Step 5 — Pages

| Page | Key changes |
|---|---|
| `WorkspaceChoice.jsx` | No localStorage reads/writes; workspace create inserts row only (no blob); join removes localStorage data copy |
| `Dashboard.jsx` | Async hooks → loading spinner; Export from DB; Import to DB; Nuke calls `nukeWorkspace()` |
| `BookForm.jsx` | `await addBook(...)` before navigate |
| `BookDetail.jsx` | Async hooks → loading state; `await removeBook(...)` |
| `PurchaseOrder.jsx` | `await addOrder/updateOrder` before navigate; submit loading state |
| `Facture.jsx` | `await toggleLock(...)` |
| `Settings.jsx` | Remove sync UI (sync status, Sync Now button) |

---

## Step 6 — `exportImport.js`

Rewrite both `exportAllData` and `importAllData` to use `db.js` instead of
localStorage. Export produces the same JSON shape for backward compatibility.
Import reads the JSON and bulk-inserts into Supabase.

---

## Step 7 — Cleanup

### Files deleted
- `src/lib/storage.js`
- `src/lib/storage.test.js`
- `src/lib/syncService.js`
- `src/hooks/useBooks.test.js`
- `src/hooks/usePurchaseOrders.test.js`
- `database/rls-fix.sql`
- `database/migrate-v1-to-v2.sql`

### Files updated
- `src/App.jsx` — remove offline guards
- `src/components/Auth/UserMenu.jsx` — remove sync status section

---

## Step 8 — Build Check

`npm run build` must pass with zero errors before committing.

---

## Execution Order

1. `database/schema.sql` (nuke + rebuild)
2. `src/lib/db.js` (new data layer)
3. `src/hooks/useBooks.js` + `usePurchaseOrders.js`
4. `src/contexts/AuthContext.jsx`
5. `src/pages/WorkspaceChoice.jsx`
6. `src/pages/Dashboard.jsx`
7. `src/pages/BookForm.jsx`
8. `src/pages/BookDetail.jsx`
9. `src/pages/PurchaseOrder.jsx`
10. `src/pages/Facture.jsx`
11. `src/pages/Settings.jsx`
12. `src/lib/exportImport.js`
13. `src/components/Auth/UserMenu.jsx`
14. `src/App.jsx`
15. Delete old files
16. `npm run build` — fix errors
17. Commit
