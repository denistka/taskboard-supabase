# Database Setup and Migration Guide

This directory contains database schema and migration files for the Taskboard application.

## Files

- `dump.sql` - Complete database schema dump
- `migration_add_user_trigger.sql` - Migration to fix missing profile trigger

## Initial Setup

### 1. Apply Base Schema

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the contents of `dump.sql`
5. Execute the query

This will create:
- All necessary tables (boards, tasks, comments, profiles, etc.)
- Row Level Security (RLS) policies
- Foreign key constraints
- Indexes for performance
- Triggers for automatic timestamp updates

### 2. Apply Migration

After applying the base schema, run the migration to fix the missing profile trigger:

1. In SQL Editor, create another new query
2. Copy and paste the contents of `migration_add_user_trigger.sql`
3. Execute the query

This migration will:
- Create a helper function to safely query auth.users
- Add a trigger to automatically create profiles for new users
- Backfill missing profiles for existing users

## Why the Migration is Needed

The base schema includes a `handle_new_user()` function that should automatically create a profile when a new user signs up. However, the trigger that connects this function to `auth.users` was not included in the original schema.

Without this trigger:
- New users won't automatically get profiles created
- Existing users who didn't get profiles during signup will cause foreign key errors
- The application will fail when trying to create boards or tasks

The migration fixes all of these issues by:
1. Creating the missing trigger
2. Backfilling profiles for any existing users who don't have one

## Verifying the Setup

After running the migration, verify everything is working:

```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check if all users have profiles
SELECT COUNT(*) as auth_users FROM auth.users;
SELECT COUNT(*) as profiles FROM public.profiles;

-- These counts should match after the migration
```

## Troubleshooting

### Error: "Already exists"

If you see an error about the trigger or function already existing, you can safely skip that part. The migration uses `CREATE OR REPLACE` for functions and checks before creating the trigger.

### Error: "Cannot coerce the result to a single JSON object"

This error means you have users in `auth.users` but not in `profiles`. The migration should fix this, but if it persists:

1. Check which users are missing profiles
2. Manually create profiles for them
3. Or run the backfill query again

### Error: Foreign key violations

If you're getting foreign key violations when creating boards or tasks, it means some users still don't have profiles. Run the backfill query again:

```sql
INSERT INTO public.profiles (id, email, full_name)
SELECT 
  id, 
  email,
  COALESCE(
    raw_user_meta_data->>'full_name',
    split_part(email, '@', 1),
    'Unknown User'
  ) as full_name
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
```

## Production Deployment

When deploying to production:

1. Always apply the base schema first
2. Then apply the migration
3. Verify triggers and data integrity
4. Monitor logs for any profile-related errors

If you encounter issues, the application includes automatic profile creation as a fallback in the PresenceManager and ProfileManager classes, but it's much better to have the trigger working properly.

