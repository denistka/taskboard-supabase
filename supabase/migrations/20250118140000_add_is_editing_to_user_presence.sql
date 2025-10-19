-- Add is_editing column to user_presence table if it doesn't exist
DO $$ 
BEGIN
    -- Check if table exists first
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_presence' 
        AND table_schema = 'public'
    ) THEN
        -- Check if column doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_presence' 
            AND column_name = 'is_editing'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.user_presence 
            ADD COLUMN is_editing boolean DEFAULT false;
        END IF;
    END IF;
END $$;
