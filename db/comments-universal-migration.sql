-- Migration: Make comments universal (rename task_comments to comments, task_id to entity_id)
-- Run this in Supabase SQL Editor

-- Step 1: Rename the table
ALTER TABLE IF EXISTS task_comments RENAME TO comments;

-- Step 2: Rename the column
ALTER TABLE comments RENAME COLUMN task_id TO entity_id;

-- Step 3: Rename indexes
ALTER INDEX IF EXISTS idx_task_comments_task RENAME TO idx_comments_entity;
ALTER INDEX IF EXISTS idx_task_comments_user RENAME TO idx_comments_user;
ALTER INDEX IF EXISTS idx_task_comments_created RENAME TO idx_comments_created;

-- Step 4: Update RLS policies to use new table/column names
-- Drop existing policies
DROP POLICY IF EXISTS "Board members can view task comments" ON comments;
DROP POLICY IF EXISTS "Board members can create task comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

-- Board members can view all comments on tasks in their boards
-- Note: This policy assumes entity_id refers to task_id for now
-- Future: This can be expanded to support other entity types
CREATE POLICY "Board members can view comments"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      INNER JOIN board_members ON board_members.board_id = tasks.board_id
      WHERE tasks.id = comments.entity_id
      AND board_members.user_id = auth.uid()
    )
  );

-- Board members can create comments on tasks in their boards
CREATE POLICY "Board members can create comments"
  ON comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM tasks
      INNER JOIN board_members ON board_members.board_id = tasks.board_id
      WHERE tasks.id = comments.entity_id
      AND board_members.user_id = auth.uid()
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM tasks
      INNER JOIN board_members ON board_members.board_id = tasks.board_id
      WHERE tasks.id = comments.entity_id
      AND board_members.user_id = auth.uid()
    )
  );

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- Step 5: Add entity_type column for future extensibility (optional)
-- This allows supporting comments on different entity types (tasks, boards, etc.)
ALTER TABLE comments ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50) DEFAULT 'task';

-- Create index on entity_type for better query performance
CREATE INDEX IF NOT EXISTS idx_comments_entity_type ON comments(entity_type, entity_id);

-- Done! Comments are now universal

