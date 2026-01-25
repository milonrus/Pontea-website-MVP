# Database Migration Guide

## What's Changing

Your current database has **circular dependency issues** in RLS policies that cause 30-second timeouts. This clean schema fixes that.

## Key Improvements

### 1. **Removed Circular Dependencies**
- ❌ Old: `is_admin()` function queries `users` table → triggers RLS → calls `is_admin()` again → infinite loop
- ✅ New: Simple RLS policies with no function calls

### 2. **Simplified RLS for Development**
- All authenticated users can read all data (appropriate for a school environment)
- Users can only modify their own data (progress, exercise sets)
- Admin checks handled in application layer (faster, simpler)

### 3. **Optimized Indexes**
- Added indexes for all common queries
- Better performance for large datasets

### 4. **Clean Table Structure**
All 8 tables with proper relationships:
- `users` - User profiles
- `subjects` - Subjects (Math, Science, etc.)
- `topics` - Topics within subjects
- `questions` - Question bank
- `question_reports` - Student issue reports
- `student_progress` - Progress tracking
- `exercise_sets` - Practice sessions
- `exercise_responses` - Individual answers

## How to Apply

### Step 1: Backup Current Data (Optional)

If you have important data, export it first:
1. Go to https://supabase.com/dashboard/project/jfypqwmtrmleiyxxnlfv/editor
2. Click "Export" for each table

### Step 2: Run the Clean Schema

1. Open Supabase SQL Editor:
   https://supabase.com/dashboard/project/jfypqwmtrmleiyxxnlfv/sql

2. Click "New Query"

3. Copy and paste the entire contents of `supabase-schema-clean.sql`

4. Click "Run" or press `Ctrl+Enter`

### Step 3: Verify

After running, you should see:
- ✅ 8 tables created
- ✅ All indexes created
- ✅ RLS enabled on all tables
- ✅ `submit_answer` function created

### Step 4: Test Authentication

1. Refresh your app
2. Sign in
3. Profile should load instantly (no 30s timeout)

## What This Doesn't Change

- ✅ Your Supabase project URL/keys stay the same
- ✅ All existing code works without changes
- ✅ Auth users (login credentials) are preserved
- ✅ Storage buckets unchanged

## Rollback

If something goes wrong, you can:
1. Run the old `supabase-schema.sql` file
2. Or restore from Supabase's automatic backups (Projects > Settings > Database > Backups)

## Admin Role Assignment

The new schema doesn't auto-assign admin roles. After migration:

1. Your app still checks `ADMIN_EMAILS` in `AuthContext.tsx`
2. On first login, it will create/update your role to 'admin'
3. This is handled in the application layer (simpler, faster)

## Questions?

- The clean schema is in: `supabase-schema-clean.sql`
- The old schema is in: `supabase-schema.sql` (kept for reference)
