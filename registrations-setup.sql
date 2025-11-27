-- Registration Table Setup for Atomic Labs
-- Run this in your Supabase SQL Editor

-- Create registrations table
CREATE TABLE IF NOT EXISTS registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    age INTEGER NOT NULL,
    location TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at);
CREATE INDEX IF NOT EXISTS idx_registrations_phone ON registrations(phone);

-- Disable Row Level Security (RLS) for full access
ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Allow anonymous inserts" ON registrations;
DROP POLICY IF EXISTS "Allow authenticated reads" ON registrations;
DROP POLICY IF EXISTS "Enable insert for anon" ON registrations;
DROP POLICY IF EXISTS "Enable read for all" ON registrations;

-- Create permissive policies for full access
CREATE POLICY "Allow all operations" ON registrations
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Grant all permissions to anon and authenticated users
GRANT ALL ON registrations TO anon, authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_registrations_updated_at ON registrations;
CREATE TRIGGER update_registrations_updated_at
    BEFORE UPDATE ON registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
