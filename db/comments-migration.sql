-- Migration: Add task comments support
-- Run this in Supabase SQL Editor

-- Create task_comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created ON task_comments(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_comments
-- Drop existing policies first
DROP POLICY IF EXISTS "Board members can view task comments" ON task_comments;
DROP POLICY IF EXISTS "Board members can create task comments" ON task_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON task_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON task_comments;

-- Board members can view all comments on tasks in their boards
CREATE POLICY "Board members can view task comments"
  ON task_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      INNER JOIN board_members ON board_members.board_id = tasks.board_id
      WHERE tasks.id = task_comments.task_id
      AND board_members.user_id = auth.uid()
    )
  );

-- Board members can create comments on tasks in their boards
CREATE POLICY "Board members can create task comments"
  ON task_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM tasks
      INNER JOIN board_members ON board_members.board_id = tasks.board_id
      WHERE tasks.id = task_comments.task_id
      AND board_members.user_id = auth.uid()
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON task_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM tasks
      INNER JOIN board_members ON board_members.board_id = tasks.board_id
      WHERE tasks.id = task_comments.task_id
      AND board_members.user_id = auth.uid()
    )
  );

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON task_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Done! Task comments are now ready
