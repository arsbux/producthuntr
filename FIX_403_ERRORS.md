# 🔧 Fix 403 Permission Errors - Step by Step

## The Problem
You're seeing "403 Forbidden" and "permission denied for schema public" errors because Supabase's Row Level Security (RLS) is blocking anonymous access.

## Solution Options (Try in Order)

### ✅ Option 1: Use the Test Page (Recommended)

1. Open `test-tracking.html` in your browser
2. Click each test button in order
3. The page will tell you exactly what's wrong
4. Follow the instructions it provides

### ✅ Option 2: Run Nuclear Fix

If `fix-permissions.sql` didn't work, try the nuclear option:

1. Go to Supabase Dashboard → **SQL Editor**
2. Copy ALL of `nuclear-fix.sql`
3. Paste and click **RUN**
4. Wait for "✅ NUCLEAR FIX COMPLETE!" message
5. Hard refresh your browser (Ctrl+Shift+R)

### ✅ Option 3: Manual Fix via Supabase Dashboard

1. Go to **Authentication** → **Policies**
2. Find `visitors` table
3. Click **Disable RLS**
4. Repeat for `page_views` table
5. Go to **Table Editor** → `visitors` → **...** → **Edit Table**
6. Scroll to **Enable Row Level Security** and turn it OFF
7. Repeat for `page_views`

### ✅ Option 4: Check API Settings

Sometimes the issue is with Supabase API settings:

1. Go to **Settings** → **API**
2. Scroll to **API Settings**
3. Make sure **Enable anonymous sign-ins** is ON
4. Click **Save**

## Verify It Worked

### Method 1: Test Page
Open `test-tracking.html` and run all tests - they should all pass ✅

### Method 2: Browser Console
1. Open your website
2. Press F12 → Console tab
3. You should see NO red errors
4. You might see: "Supabase not configured" (that's okay if you haven't set it up yet)

### Method 3: Supabase Dashboard
1. Go to **Table Editor** → `visitors`
2. Try to manually insert a row
3. If it works, permissions are correct

## Still Not Working?

### Check 1: Verify Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('visitors', 'page_views');
```
Should return 2 rows.

### Check 2: Verify RLS is OFF
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('visitors', 'page_views');
```
Both should show `rowsecurity = false`.

### Check 3: Verify Permissions
```sql
SELECT 
    tablename,
    has_table_privilege('anon', 'public.'||tablename, 'SELECT') as can_select,
    has_table_privilege('anon', 'public.'||tablename, 'INSERT') as can_insert
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('visitors', 'page_views');
```
All should be `true`.

## Common Mistakes

### ❌ Mistake 1: Using Service Role Key
Make sure you're using the **anon public** key, NOT the service_role key.

**Where to find it:**
- Supabase Dashboard → Settings → API
- Copy the key under "anon public" (starts with `eyJ...`)

### ❌ Mistake 2: Not Hard Refreshing
After making changes, you MUST hard refresh:
- Windows/Linux: Ctrl + Shift + R
- Mac: Cmd + Shift + R

### ❌ Mistake 3: Wrong Project
Make sure you're editing the correct Supabase project!
- Check the URL in your browser
- Verify it matches `js/config.js`

### ❌ Mistake 4: Tables Don't Exist
If you get "relation does not exist":
1. Run `supabase-setup.sql` first
2. Then run `nuclear-fix.sql`

## Emergency Reset

If nothing works, start completely fresh:

```sql
-- WARNING: This deletes ALL data!
DROP TABLE IF EXISTS page_views CASCADE;
DROP TABLE IF EXISTS visitors CASCADE;
DROP VIEW IF EXISTS visitor_analytics CASCADE;
DROP VIEW IF EXISTS page_analytics CASCADE;

-- Then run supabase-setup.sql
-- Then run nuclear-fix.sql
```

## Get Help

If you're still stuck:

1. Open `test-tracking.html`
2. Run all tests
3. Take a screenshot of the results
4. Check what error code you're getting:
   - `42501` = Permission denied
   - `42P01` = Table doesn't exist
   - `403` = Forbidden (RLS issue)

## Success Checklist

- [ ] Ran `nuclear-fix.sql` in Supabase
- [ ] Hard refreshed browser (Ctrl+Shift+R)
- [ ] Verified `js/config.js` has correct credentials
- [ ] Opened `test-tracking.html` - all tests pass
- [ ] No 403 errors in browser console
- [ ] Can see data in Supabase Table Editor

Once all checked, tracking should work! 🎉
