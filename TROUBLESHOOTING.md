# Troubleshooting Guide

## Quick Fix for 403 Permission Errors

If you're seeing "permission denied for schema public" errors:

### Step 1: Run the Fix Script

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `fix-permissions.sql`
4. Click **Run**

This will:
- Disable Row Level Security
- Remove all restrictive policies
- Grant full permissions to anonymous users
- Create permissive policies

### Step 2: Verify Configuration

Make sure `js/config.js` has your actual Supabase credentials:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://xxxxx.supabase.co', // Your actual URL
    anonKey: 'eyJxxx...' // Your actual anon key
};
```

### Step 3: Clear Browser Cache

1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

## Common Errors and Solutions

### Error: "Failed to load resource: 403"

**Cause**: Database permissions not set correctly

**Solution**: 
1. Run `fix-permissions.sql` in Supabase SQL Editor
2. Verify RLS is disabled: Go to **Table Editor** → **visitors** → **RLS disabled** should show

### Error: "permission denied for schema public"

**Cause**: Row Level Security blocking access

**Solution**:
```sql
ALTER TABLE visitors DISABLE ROW LEVEL SECURITY;
ALTER TABLE page_views DISABLE ROW LEVEL SECURITY;
```

### Error: "Invalid API key"

**Cause**: Wrong Supabase credentials in config

**Solution**:
1. Go to Supabase → **Settings** → **API**
2. Copy the **anon public** key (not the service_role key)
3. Update `js/config.js`

### Error: "relation does not exist"

**Cause**: Tables not created

**Solution**:
1. Run `supabase-setup.sql` in Supabase SQL Editor
2. Verify tables exist in **Table Editor**

### Error: "column reference is ambiguous"

**Cause**: Old SQL version

**Solution**: Use the updated `supabase-setup.sql` file

## Verification Steps

### 1. Check Tables Exist

In Supabase **Table Editor**, you should see:
- ✅ visitors
- ✅ page_views

### 2. Check RLS is Disabled

For both tables:
- Go to table
- Look for "RLS disabled" badge
- If not, run: `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;`

### 3. Test Insert Manually

In Supabase SQL Editor:

```sql
-- Test insert
INSERT INTO visitors (session_id, page_url, page_title, referrer)
VALUES ('test_session', 'https://test.com', 'Test', 'direct');

-- Check if it worked
SELECT * FROM visitors WHERE session_id = 'test_session';

-- Clean up
DELETE FROM visitors WHERE session_id = 'test_session';
```

### 4. Check Browser Console

Open DevTools → Console:
- ❌ Red errors = problem
- ⚠️ Yellow warnings = okay (just warnings)
- ✅ "CTA click tracked" = working!

## Admin Dashboard Issues

### Can't Login

**Default credentials**:
- Username: `admin`
- Password: `atomic2024`

**To change password**:
Edit `admin/admin-script.js` line 13:
```javascript
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'your_new_password'
};
```

### Dashboard Shows No Data

1. **Check if tracking is working**: Visit your site, then check Supabase **Table Editor** → **visitors**
2. **Check date range**: Try "All Time" filter
3. **Check console**: Look for errors in browser DevTools

### Charts Not Loading

**Cause**: Chart.js not loaded

**Solution**: Make sure this line is in `admin/index.html`:
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
```

## Still Having Issues?

### Debug Mode

Add this to your page to see detailed logs:

```html
<script>
window.ATOMIC_DEBUG = true;
</script>
```

### Check Supabase Status

1. Go to Supabase dashboard
2. Check if project is active
3. Look for any service disruptions

### Manual Test

Open browser console and run:

```javascript
// Test Supabase connection
const testSupabase = window.supabase.createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.anonKey
);

// Try to insert
testSupabase
    .from('visitors')
    .insert([{
        session_id: 'manual_test',
        page_url: window.location.href,
        page_title: document.title,
        referrer: 'manual'
    }])
    .then(result => console.log('Success:', result))
    .catch(err => console.error('Error:', err));
```

## Security Note

⚠️ **Important**: The current setup has NO restrictions for ease of setup. For production:

1. Re-enable RLS
2. Create proper policies
3. Use environment variables for credentials
4. Add rate limiting
5. Implement proper admin authentication

## Need More Help?

1. Check Supabase logs: Dashboard → **Logs**
2. Check browser Network tab: DevTools → **Network**
3. Review SQL setup: Make sure all tables and policies are correct

## Quick Reset

If everything is broken, start fresh:

```sql
-- Drop everything
DROP TABLE IF EXISTS page_views CASCADE;
DROP TABLE IF EXISTS visitors CASCADE;
DROP VIEW IF EXISTS visitor_analytics CASCADE;
DROP VIEW IF EXISTS page_analytics CASCADE;

-- Then run supabase-setup.sql again
```

---

**Remember**: After any SQL changes, refresh your browser with a hard reload (Ctrl+Shift+R or Cmd+Shift+R)
