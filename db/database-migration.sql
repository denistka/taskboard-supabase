-- Migration: Add multi-board support with membership and join requests
-- Run this in Supabase SQL Editor

-- 1. Rename created_by to owner_id in boards table (if exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'boards' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE boards RENAME COLUMN created_by TO owner_id;
  END IF;
END $$;

-- If owner_id doesn't exist and created_by doesn't exist, add owner_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'boards' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE boards ADD COLUMN owner_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- 2. Create board_members table
CREATE TABLE IF NOT EXISTS board_members (
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'member')) NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (board_id, user_id)
);

-- 3. Create join_requests table
CREATE TABLE IF NOT EXISTS join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(board_id, user_id, status)
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_board_members_user ON board_members(user_id);
CREATE INDEX IF NOT EXISTS idx_board_members_board ON board_members(board_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_board ON join_requests(board_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_user ON join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON join_requests(status);

-- 5. Migrate existing boards - add owners as members (only if owner_id exists and is not null)
INSERT INTO board_members (board_id, user_id, role)
SELECT id, owner_id, 'owner'
FROM boards
WHERE owner_id IS NOT NULL
ON CONFLICT (board_id, user_id) DO NOTHING;

-- 6. Enable RLS (Row Level Security)
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for board_members
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own memberships" ON board_members;
DROP POLICY IF EXISTS "Board owners can manage members" ON board_members;

CREATE POLICY "Users can view their own memberships"
  ON board_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Board owners can manage members"
  ON board_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM boards 
      WHERE boards.id = board_members.board_id 
      AND boards.owner_id = auth.uid()
    )
  );

-- 8. RLS Policies for join_requests
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own requests" ON join_requests;
DROP POLICY IF EXISTS "Users can create join requests" ON join_requests;
DROP POLICY IF EXISTS "Board owners can view and manage requests" ON join_requests;

CREATE POLICY "Users can view their own requests"
  ON join_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create join requests"
  ON join_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Board owners can view and manage requests"
  ON join_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM boards 
      WHERE boards.id = join_requests.board_id 
      AND boards.owner_id = auth.uid()
    )
  );

-- 9. Update boards RLS to include members
-- Drop all existing policies on boards
DROP POLICY IF EXISTS "Enable read access for all users" ON boards;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON boards;
DROP POLICY IF EXISTS "Enable update for users based on created_by" ON boards;
DROP POLICY IF EXISTS "Enable delete for users based on created_by" ON boards;
DROP POLICY IF EXISTS "Users can view boards they are members of" ON boards;
DROP POLICY IF EXISTS "Authenticated users can create boards" ON boards;
DROP POLICY IF EXISTS "Board owners can update their boards" ON boards;
DROP POLICY IF EXISTS "Board owners can delete their boards" ON boards;

CREATE POLICY "Users can view boards they are members of"
  ON boards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = boards.id
      AND board_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create boards"
  ON boards FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Board owners can update their boards"
  ON boards FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Board owners can delete their boards"
  ON boards FOR DELETE
  USING (auth.uid() = owner_id);

-- 10. Update tasks RLS to include board members
-- Drop all existing policies on tasks
DROP POLICY IF EXISTS "Enable read access for all users" ON tasks;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON tasks;
DROP POLICY IF EXISTS "Enable update for users based on created_by" ON tasks;
DROP POLICY IF EXISTS "Enable delete for users based on created_by" ON tasks;
DROP POLICY IF EXISTS "Board members can view tasks" ON tasks;
DROP POLICY IF EXISTS "Board members can create tasks" ON tasks;
DROP POLICY IF EXISTS "Board members can update tasks" ON tasks;
DROP POLICY IF EXISTS "Board members can delete tasks" ON tasks;

CREATE POLICY "Board members can view tasks"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = tasks.board_id
      AND board_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Board members can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = tasks.board_id
      AND board_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Board members can update tasks"
  ON tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = tasks.board_id
      AND board_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Board members can delete tasks"
  ON tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = tasks.board_id
      AND board_members.user_id = auth.uid()
    )
  );

-- Done! Your database is now ready for multi-board collaboration
