---
description: How to set up Square payments and subscriptions
---

# Square Payment Setup Guide

To enable payments for the Growth Workbench, follow these steps:

## 1. Get Square Credentials
1. Go to [Square Developer Dashboard](https://developer.squareup.com/apps).
2. Create a new App.
3. In the **Credentials** tab, copy your **Application ID** and **Access Token**.
4. In the **Locations** tab, copy your **Location ID**.

## 2. Configure Environment Variables
Update your `.env.local` file with these values:

```bash
NEXT_PUBLIC_SQUARE_APP_ID=sandbox-sq0idb-...
NEXT_PUBLIC_SQUARE_LOCATION_ID=L...
SQUARE_ACCESS_TOKEN=EAAAl...
```

> **Note:** Start with Sandbox credentials to test without charging real money. Switch to Production credentials when ready to launch.

## 3. Create Database Table
Run this SQL in your Supabase SQL Editor to create the subscriptions table:

```sql
create table if not exists subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null unique,
  status text not null,
  plan text not null,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table subscriptions enable row level security;

create policy "Users can view own subscription"
  on subscriptions for select
  using ( auth.uid() = user_id );
```

## 4. Testing
1. Go to the **Growth Workbench** tab.
2. You should see the "Upgrade" modal.
3. Use a [Square Sandbox Test Card](https://developer.squareup.com/docs/devtools/sandbox/payments/test-cards) to complete the payment.
   - **Card Number:** `4111 1111 1111 1111`
   - **CVV:** `123`
   - **Exp:** `12/26`
   - **Zip:** `12345`
