-- Add version field to tasks table for conflict resolution
DO $$ 
BEGIN
    -- Check if table exists first
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'tasks' 
        AND table_schema = 'public'
    ) THEN
        -- Check if column doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'tasks' 
            AND column_name = 'version'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.tasks 
            ADD COLUMN version integer DEFAULT 1;
            
            -- Add unique constraint on id and version for conflict detection
            CREATE UNIQUE INDEX IF NOT EXISTS tasks_id_version_unique 
            ON public.tasks (id, version);
        END IF;
    END IF;
END $$;
