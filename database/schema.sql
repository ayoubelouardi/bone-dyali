-- =============================================================================
-- Bone Dyali — Supabase Database Schema (relational, v3)
-- =============================================================================
-- Run the entire file in the Supabase SQL Editor.
-- It is safe to re-run: drops everything first then rebuilds from scratch.
-- WARNING: running this will permanently delete all existing data.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- STEP 0 — Nuke the old schema (reverse dependency order)
-- -----------------------------------------------------------------------------

DROP TABLE IF EXISTS line_items         CASCADE;
DROP TABLE IF EXISTS purchase_orders    CASCADE;
DROP TABLE IF EXISTS books              CASCADE;
DROP TABLE IF EXISTS invite_codes       CASCADE;
DROP TABLE IF EXISTS workspace_members  CASCADE;
DROP TABLE IF EXISTS workspaces         CASCADE;

DROP FUNCTION IF EXISTS is_workspace_owner(UUID);

-- -----------------------------------------------------------------------------
-- STEP 1 — workspaces
-- One row per admin user. Viewers join via workspace_members.
-- -----------------------------------------------------------------------------

CREATE TABLE workspaces (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL DEFAULT 'My Workspace',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_owner UNIQUE (owner_id)
);

-- -----------------------------------------------------------------------------
-- STEP 2 — books
-- A workspace contains many books (order books / carnets).
-- -----------------------------------------------------------------------------

CREATE TABLE books (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  owner_name    TEXT        NOT NULL DEFAULT '',
  color         TEXT        NOT NULL DEFAULT '#6366f1',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- STEP 3 — purchase_orders
-- workspace_id is denormalized (also reachable via book) for RLS simplicity:
-- Supabase RLS policies cannot join across tables efficiently.
-- -----------------------------------------------------------------------------

CREATE TABLE purchase_orders (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id         UUID        NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  workspace_id    UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  po_number       INT         NOT NULL,
  type            TEXT        NOT NULL CHECK (type IN ('O', 'OR', 'P')),
  date            DATE        NOT NULL,
  client_name     TEXT        NOT NULL DEFAULT '',
  client_address  TEXT        NOT NULL DEFAULT '',
  client_extra    TEXT        NOT NULL DEFAULT '',
  locked          BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_po_number_per_book UNIQUE (book_id, po_number)
);

-- -----------------------------------------------------------------------------
-- STEP 4 — line_items
-- One row per line in a purchase order.
-- O/OR type: description, quantity, unit_price, code
-- P type:    payment_type, amount, n_serie, item_name
-- workspace_id is denormalized for RLS (same reason as purchase_orders).
-- -----------------------------------------------------------------------------

CREATE TABLE line_items (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id   UUID        NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  workspace_id        UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  sort_order          INT         NOT NULL DEFAULT 0,

  -- O / OR fields
  description         TEXT        NOT NULL DEFAULT '',
  quantity            NUMERIC     NOT NULL DEFAULT 0,
  unit_price          NUMERIC     NOT NULL DEFAULT 0,
  code                TEXT        NOT NULL DEFAULT '',

  -- P fields
  payment_type        TEXT        CHECK (payment_type IN ('Cash', 'Check', 'Etra')),
  amount              NUMERIC     NOT NULL DEFAULT 0,
  n_serie             TEXT        NOT NULL DEFAULT '',
  item_name           TEXT        NOT NULL DEFAULT ''
);

-- -----------------------------------------------------------------------------
-- STEP 5 — workspace_members (viewers)
-- -----------------------------------------------------------------------------

CREATE TABLE workspace_members (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT        NOT NULL DEFAULT 'viewer' CHECK (role = 'viewer'),
  invited_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_member UNIQUE (workspace_id, user_id),
  CONSTRAINT unique_user_membership UNIQUE (user_id)
);

-- -----------------------------------------------------------------------------
-- STEP 6 — invite_codes
-- -----------------------------------------------------------------------------

CREATE TABLE invite_codes (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  code          TEXT        NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_by       UUID        REFERENCES auth.users(id) DEFAULT NULL,
  used_at       TIMESTAMPTZ DEFAULT NULL
);

-- -----------------------------------------------------------------------------
-- STEP 7 — Indexes
-- -----------------------------------------------------------------------------

CREATE INDEX idx_books_workspace_id               ON books(workspace_id);
CREATE INDEX idx_po_book_id                        ON purchase_orders(book_id);
CREATE INDEX idx_po_workspace_id                   ON purchase_orders(workspace_id);
CREATE INDEX idx_po_book_id_po_number              ON purchase_orders(book_id, po_number);
CREATE INDEX idx_line_items_po_id                  ON line_items(purchase_order_id);
CREATE INDEX idx_line_items_workspace_id           ON line_items(workspace_id);
CREATE INDEX idx_workspace_members_workspace_id    ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user_id         ON workspace_members(user_id);
CREATE INDEX idx_invite_codes_code                 ON invite_codes(code);
CREATE INDEX idx_invite_codes_workspace_id         ON invite_codes(workspace_id);

-- -----------------------------------------------------------------------------
-- STEP 8 — Enable Row Level Security
-- -----------------------------------------------------------------------------

ALTER TABLE workspaces        ENABLE ROW LEVEL SECURITY;
ALTER TABLE books             ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders   ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes      ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- STEP 9 — Helper function (breaks RLS recursion on workspace_members /
--           invite_codes policies that need to check workspace ownership)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION is_workspace_owner(ws_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspaces WHERE id = ws_id AND owner_id = auth.uid()
  );
$$;

-- -----------------------------------------------------------------------------
-- STEP 10 — RLS Policies: workspaces
-- Admin: full access on own row
-- Viewer: read-only access via workspace_members
-- -----------------------------------------------------------------------------

CREATE POLICY "workspaces: admin full access"
  ON workspaces FOR ALL
  USING  (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "workspaces: viewer read"
  ON workspaces FOR SELECT
  USING (
    id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- STEP 11 — RLS Policies: books
-- -----------------------------------------------------------------------------

CREATE POLICY "books: admin full access"
  ON books FOR ALL
  USING  (is_workspace_owner(workspace_id))
  WITH CHECK (is_workspace_owner(workspace_id));

CREATE POLICY "books: viewer read"
  ON books FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- STEP 12 — RLS Policies: purchase_orders
-- -----------------------------------------------------------------------------

CREATE POLICY "purchase_orders: admin full access"
  ON purchase_orders FOR ALL
  USING  (is_workspace_owner(workspace_id))
  WITH CHECK (is_workspace_owner(workspace_id));

CREATE POLICY "purchase_orders: viewer read"
  ON purchase_orders FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- STEP 13 — RLS Policies: line_items
-- -----------------------------------------------------------------------------

CREATE POLICY "line_items: admin full access"
  ON line_items FOR ALL
  USING  (is_workspace_owner(workspace_id))
  WITH CHECK (is_workspace_owner(workspace_id));

CREATE POLICY "line_items: viewer read"
  ON line_items FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- STEP 14 — RLS Policies: workspace_members
-- -----------------------------------------------------------------------------

CREATE POLICY "workspace_members: admin full access"
  ON workspace_members FOR ALL
  USING  (is_workspace_owner(workspace_id))
  WITH CHECK (is_workspace_owner(workspace_id));

CREATE POLICY "workspace_members: member read own"
  ON workspace_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "workspace_members: member delete own"
  ON workspace_members FOR DELETE
  USING (user_id = auth.uid());

-- Allow inserting own membership (needed when joining via invite code)
CREATE POLICY "workspace_members: member insert own"
  ON workspace_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- STEP 15 — RLS Policies: invite_codes
-- -----------------------------------------------------------------------------

CREATE POLICY "invite_codes: admin full access"
  ON invite_codes FOR ALL
  USING  (is_workspace_owner(workspace_id))
  WITH CHECK (is_workspace_owner(workspace_id));

CREATE POLICY "invite_codes: anyone read unused"
  ON invite_codes FOR SELECT
  USING (used_by IS NULL);
