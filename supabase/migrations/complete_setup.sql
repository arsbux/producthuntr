-- Complete Database Setup for Product Huntr with Whop Integration
-- Run this in your Supabase SQL Editor

-- 1. Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  
  -- Whop subscription tracking
  whop_user_id TEXT,
  whop_membership_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  subscription_created_at TIMESTAMP WITH TIME ZONE,
  last_payment_at TIMESTAMP WITH TIME ZONE,
  
  -- Admin access
  is_admin BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_whop_user_id ON public.users(whop_user_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users(subscription_status);

-- 2. Create subscriptions table for detailed tracking
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  whop_user_id TEXT NOT NULL,
  whop_membership_id TEXT UNIQUE NOT NULL,
  whop_product_id TEXT NOT NULL,
  status TEXT NOT NULL, -- active, past_due, canceled, trialing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
);

-- Create indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_whop_user_id ON public.subscriptions(whop_user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_whop_membership_id ON public.subscriptions(whop_membership_id);

-- 3. Create webhook_events table to log all webhook events
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  whop_user_id TEXT,
  whop_membership_id TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON public.webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.webhook_events(processed);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies

-- Users can read their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Only admins can view webhook events
CREATE POLICY "Admins can view webhook events" ON public.webhook_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 6. Create function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger to auto-create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create triggers for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.users;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.subscriptions;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 10. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.subscriptions TO anon, authenticated;
GRANT ALL ON public.webhook_events TO anon, authenticated;

-- Done! Your database is ready.
-- Next: Set yourself as admin with this query:
-- UPDATE public.users SET is_admin = true WHERE email = 'your@email.com';
