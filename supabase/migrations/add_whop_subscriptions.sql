-- Add subscription tracking to users table
-- Run this in your Supabase SQL Editor

-- Add columns to track Whop subscriptions
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS whop_user_id TEXT,
ADD COLUMN IF NOT EXISTS whop_membership_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_created_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_whop_user_id ON users(whop_user_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- Create subscriptions table for detailed tracking
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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

-- Create index for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_whop_user_id ON subscriptions(whop_user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Create webhook_events table to log all webhook events
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  whop_user_id TEXT,
  whop_membership_id TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);
