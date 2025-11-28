-- Add square_payment_id column to subscriptions table if it doesn't exist
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS square_payment_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_square_payment_id 
ON subscriptions(square_payment_id);
