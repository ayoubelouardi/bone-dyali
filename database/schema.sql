-- Bone Dyali - Supabase Database Schema v2
-- Run this in Supabase SQL Editor

-- STEP 1: Create workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  data JSONB DEFAULT '{"books": []}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_owner UNIQUE (owner_id)
);

-- STEP 2: Create workspace_members table (for viewers)
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'viewer' CHECK (role = 'viewer'),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id),
  UNIQUE(user_id)
);

-- STEP 3: Create invite_codes table
CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_by UUID REFERENCES auth.users(id) DEFAULT NULL,
  used_at TIMESTAMPTZ DEFAULT NULL
);

-- STEP 4: Enable Row Level Security
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- STEP 5: Helper function to check workspace ownership without triggering RLS
-- Using SECURITY DEFINER bypasses RLS on the inner query, breaking the recursion cycle
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

-- STEP 6: Create RLS Policies for workspaces
CREATE POLICY "Admin full access - workspaces" 
  ON workspaces 
  FOR ALL 
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Viewers can read their workspace: look up membership directly (workspace_members
-- does NOT reference workspaces in its RLS policies, so no cycle here)
CREATE POLICY "Viewers can read workspaces" 
  ON workspaces 
  FOR SELECT 
  USING (
    id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- STEP 7: Create RLS Policies for workspace_members
-- Use the SECURITY DEFINER function to check ownership, avoiding the recursion cycle
CREATE POLICY "Admin manage members" 
  ON workspace_members 
  FOR ALL 
  USING (is_workspace_owner(workspace_id))
  WITH CHECK (is_workspace_owner(workspace_id));

CREATE POLICY "Members can read own membership"
  ON workspace_members
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Members can delete own membership"
  ON workspace_members
  FOR DELETE
  USING (user_id = auth.uid());

-- STEP 8: Create RLS Policies for invite_codes
-- Same fix: use the SECURITY DEFINER function instead of subquery into workspaces
CREATE POLICY "Admin manage invite codes"
  ON invite_codes
  FOR ALL
  USING (is_workspace_owner(workspace_id))
  WITH CHECK (is_workspace_owner(workspace_id));

CREATE POLICY "Anyone can read unused invite codes"
  ON invite_codes
  FOR SELECT
  USING (used_by IS NULL);

-- STEP 8: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_workspace_id ON invite_codes(workspace_id);
