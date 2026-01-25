-- Supabase Schema for Pontea School
-- Run this in your Supabase SQL Editor (Database > SQL Editor > New Query)
-- This script is idempotent (safe to run multiple times)

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Student',
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settings JSONB DEFAULT '{"showResultAfterEach": false}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create a function to check if user is admin (bypasses RLS)
-- Using CREATE OR REPLACE so we don't need to drop it first
-- SECURITY DEFINER + SET allows bypassing RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Bypass RLS by explicitly setting role and reading directly
  SELECT role INTO user_role
  FROM public.users
  WHERE id = auth.uid()
  LIMIT 1;

  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users;
DROP POLICY IF EXISTS "Enable read access" ON public.users;
DROP POLICY IF EXISTS "Enable insert access" ON public.users;
DROP POLICY IF EXISTS "Enable update access" ON public.users;

-- RLS Policies for users table (simplified for performance)
-- For a school app, authenticated users can read all profiles
-- This avoids circular dependencies and is appropriate for a closed educational environment
CREATE POLICY "Enable read access"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert their own profile (for signup)
CREATE POLICY "Enable insert access"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
-- Admins should use service role key for bulk updates (bypasses RLS)
CREATE POLICY "Enable update access"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Grant permissions
GRANT ALL ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

-- Safe function for admins to update user roles (bypasses RLS)
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  target_user_id UUID,
  new_role TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Check if caller is admin (this query is OK because it's checking the caller's own row)
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;

  -- Update the target user's role
  UPDATE public.users
  SET role = new_role
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

COMMENT ON TABLE public.users IS 'User profiles for Pontea School';
