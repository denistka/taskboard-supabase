-- Add editing task and fields tracking to user_presence table
DO $$ 
BEGIN
    -- Check if table exists first
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_presence' 
        AND table_schema = 'public'
    ) THEN
        -- Add editing_task_id column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_presence' 
            AND column_name = 'editing_task_id'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE user_presence 
            ADD COLUMN editing_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE;
        END IF;
        
        -- Add editing_fields column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_presence' 
            AND column_name = 'editing_fields'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE user_presence 
            ADD COLUMN editing_fields TEXT[];
        END IF;
    END IF;
END $$;

-- Add indexes for better performance when querying by editing_task_id
DO $$ 
BEGIN
    -- Check if table exists first
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_presence' 
        AND table_schema = 'public'
    ) THEN
        -- Add editing_task_id index if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = 'idx_user_presence_editing_task_id'
        ) THEN
            CREATE INDEX idx_user_presence_editing_task_id ON user_presence(editing_task_id);
        END IF;
        
        -- Add board_editing_task index if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = 'idx_user_presence_board_editing_task'
        ) THEN
            CREATE INDEX idx_user_presence_board_editing_task ON user_presence(board_id, editing_task_id);
        END IF;
    END IF;
END $$;
