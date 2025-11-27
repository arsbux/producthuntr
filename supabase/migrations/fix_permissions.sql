-- Grant permissions to service_role
GRANT ALL ON TABLE subscriptions TO service_role;

-- Ensure RLS is enabled
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Re-create the service role policy to be sure
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON subscriptions;

CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
