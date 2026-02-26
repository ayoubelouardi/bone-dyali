-- Fix for RLS recursion between workspaces and workspace_members/invite_codes
-- Run this in Supabase SQL Editor to create a SECURITY DEFINER helper and
-- replace the policies that caused "infinite recursion detected in policy".

-- Create or replace helper function that checks workspace ownership
-- SECURITY DEFINER ensures the inner query bypasses RLS, breaking the recursion
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

-- Remove old policies that may reference workspaces/workspace_members in a cyclic way
DROP POLICY IF EXISTS "Admin manage members" ON workspace_members;
DROP POLICY IF EXISTS "Admin manage invite codes" ON invite_codes;

-- Recreate policies using the helper function (non-recursive)
CREATE POLICY "Admin manage members"
  ON workspace_members
  FOR ALL
  USING (is_workspace_owner(workspace_id))
  WITH CHECK (is_workspace_owner(workspace_id));

CREATE POLICY "Admin manage invite codes"
  ON invite_codes
  FOR ALL
  USING (is_workspace_owner(workspace_id))
  WITH CHECK (is_workspace_owner(workspace_id));

-- Keep existing read policy for workspaces (viewers) intact
-- CREATE POLICY "Viewers can read workspaces" ON workspaces FOR SELECT
--   USING (id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- Note: This file is safe to re-run (uses CREATE OR REPLACE and DROP POLICY IF EXISTS)
