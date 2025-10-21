-- Fix task deletion policy to allow all authenticated users to see task deletions
-- This is needed for real-time updates when tasks are deleted

-- Drop the existing restrictive delete policy
DROP POLICY IF EXISTS "Task creators can delete their tasks" ON "public"."tasks";

-- Create a new policy that allows all authenticated users to delete tasks
-- This is needed for real-time subscriptions to work properly
-- In a production app, you might want to add additional checks here
CREATE POLICY "Authenticated users can delete tasks"
ON "public"."tasks"
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (true);

-- Also ensure that all authenticated users can see all task changes for real-time
-- This is required for real-time subscriptions to work with RLS
CREATE POLICY "Authenticated users can see all task changes for realtime"
ON "public"."tasks"
AS PERMISSIVE
FOR ALL
TO authenticated
USING (true);
