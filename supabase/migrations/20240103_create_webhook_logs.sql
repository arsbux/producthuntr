create table if not exists webhook_logs (
  id uuid default uuid_generate_v4() primary key,
  event_id text,
  event_type text not null,
  payload jsonb,
  status text not null, -- 'success', 'error', 'processing'
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Allow public access for now to ensure the webhook handler (service role) can write, 
-- though service role bypasses RLS anyway.
alter table webhook_logs disable row level security;
