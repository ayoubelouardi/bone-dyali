-- Bone Dyali - Supabase Database Schema

-- STEP 1: Create workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  data JSONB DEFAULT '{"books": [], "purchaseOrders": {}}',
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
  UNIQUE(workspace_id, user_id)
);

-- STEP 3: Enable Row Level Security
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create RLS Policies
-- Admin (owner) has full access to their workspace
CREATE POLICY "Admin full access - workspaces" 
  ON workspaces 
  FOR ALL 
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Viewers can read the workspace they're members of
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

-- Admin can manage workspace members
CREATE POLICY "Admin manage members" 
  ON workspace_members 
  FOR ALL 
  USING (
    workspace_id IN (
      SELECT id 
      FROM workspaces 
      WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id 
      FROM workspaces 
      WHERE owner_id = auth.uid()
    )
  );

-- STEP 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id);
