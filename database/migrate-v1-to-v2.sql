-- Bone Dyali - Migration from v1 to v2
-- Run this ONLY if you already ran schema.sql v1 before
-- This adds the new invite_codes table and updates constraints

-- Add unique constraint on workspace_members.user_id (one workspace per user)
ALTER TABLE workspace_members 
ADD CONSTRAINT workspace_members_user_id_unique UNIQUE (user_id);

-- Create invite_codes table
CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_by UUID REFERENCES auth.users(id) DEFAULT NULL,
  used_at TIMESTAMPTZ DEFAULT NULL
);

-- Enable RLS on invite_codes
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Helper function to check workspace ownership without triggering RLS recursion
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

-- Drop old recursive policies on workspace_members if they exist
DROP POLICY IF EXISTS "Admin manage members" ON workspace_members;

-- Recreate with the non-recursive security definer function
CREATE POLICY "Admin manage members" 
  ON workspace_members 
  FOR ALL 
  USING (is_workspace_owner(workspace_id))
  WITH CHECK (is_workspace_owner(workspace_id));

-- RLS Policies for invite_codes (using non-recursive function)
CREATE POLICY "Admin manage invite codes"
  ON invite_codes
  FOR ALL
  USING (is_workspace_owner(workspace_id))
  WITH CHECK (is_workspace_owner(workspace_id));

CREATE POLICY "Anyone can read unused invite codes"
  ON invite_codes
  FOR SELECT
  USING (used_by IS NULL);

-- Additional policies for workspace_members
CREATE POLICY "Members can read own membership"
  ON workspace_members
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Members can delete own membership"
  ON workspace_members
  FOR DELETE
  USING (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_workspace_id ON invite_codes(workspace_id);
