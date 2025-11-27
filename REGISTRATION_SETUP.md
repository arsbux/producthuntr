# Registration Form Setup Instructions

## Overview
The `/join` page has been created with a registration form that collects:
- Full Name
- Age
- Location
- Phone (Ugandan format)

All registration data is stored in the Supabase database and is viewable in the admin dashboard.

## Files Created/Modified

### New Files:
1. **join.html** - Registration page with form
2. **registrations-setup.sql** - Database table setup for registrations

### Modified Files:
1. **admin/index.html** - Added registrations stat card and table
2. **admin/admin-script.js** - Added functions to fetch and display registrations

## Database Setup

### Step 1: Run the SQL Setup
1. Go to your Supabase project: https://lhzbylxxhpslnuhbyvin.supabase.co
2. Navigate to the SQL Editor
3. Copy the contents of `registrations-setup.sql`
4. Paste and run the SQL code

This will create:
- `registrations` table with all necessary fields
- Indexes for better performance
- Proper permissions and policies
- Auto-updating timestamps

### Step 2: Verify Table Creation
After running the SQL, verify the table was created:
```sql
SELECT * FROM registrations;
```

## How It Works

### Registration Flow:
1. User visits `/join.html`
2. Fills out the form with their information
3. Submits the form
4. Data is validated and saved to Supabase `registrations` table
5. Success message is displayed
6. Admin can view all registrations in the dashboard

### Admin Dashboard:
1. Login to admin at `/admin/index.html`
   - Username: `admin`
   - Password: `atomiclabs2025` (you should change this!)
2. View total registrations count in the stats section
3. See recent registrations in the "Recent Registrations" table
4. Filter by date range to see registrations from specific periods

## Features Implemented

### Join Page (/join.html):
- ✅ Beautiful form matching site design
- ✅ Form validation (required fields, phone format)
- ✅ Auto-formatting of Ugandan phone numbers
- ✅ Supabase integration for data storage
- ✅ Loading states during submission
- ✅ Success message after registration
- ✅ Error handling with user-friendly messages
- ✅ Responsive design for mobile/desktop

### Admin Dashboard:
- ✅ Registrations stat card showing total count
- ✅ Recent registrations table with:
  - Full Name
  - Age
  - Location
  - Phone
  - Registration Date
- ✅ Date range filtering
- ✅ Auto-refresh capability
- ✅ Clean, organized display

## Testing the Form

### Test Registration:
1. Visit `http://localhost/join.html` (or your deployed URL)
2. Fill in the form:
   - Full Name: "Test Student"
   - Age: 16
   - Location: "Kampala, Uganda"
   - Phone: "0700123456" or "+256700123456"
3. Submit the form
4. You should see a success message

### Verify in Admin:
1. Go to `/admin/index.html`
2. Login with credentials
3. Check the "Registrations" stat card - should show "1"
4. Scroll to "Recent Registrations" table - should see your test entry

## Phone Number Formatting

The form automatically formats Ugandan phone numbers:
- Input: `0700123456` → Auto-formats to: `+256700123456`
- Input: `256700123456` → Auto-formats to: `+256700123456`
- Input: `+256700123456` → Keeps as is

Valid formats:
- `+256XXXXXXXXX` (preferred)
- `0XXXXXXXXX` (auto-converts to +256)
- `256XXXXXXXXX` (auto-converts to +256)

## Security Notes

⚠️ **Important**: Change the default admin password in `admin/admin-script.js`:
```javascript
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'YOUR_SECURE_PASSWORD_HERE'
};
```

## Next Steps

1. **Run the SQL setup** in Supabase to create the table
2. **Test the form** by submitting a registration
3. **Verify in admin** that the data appears correctly
4. **Change admin password** for security
5. **Deploy** - The join page is ready to go live!

## Accessing the Pages

- **Registration Form**: `https://atomiclabs.ug/join` (or `/join.html`)
- **Admin Dashboard**: `https://atomiclabs.ug/admin/` (or `/admin/index.html`)

## Troubleshooting

### If the form isn't working:

1. **Open Browser Console** (F12 or right-click → Inspect → Console)
   - Look for errors in red
   - You should see: "✓ Supabase client initialized successfully"
   - You should see: "✓ Database connection successful"

2. **Check for Common Errors:**

   **Error: "Table registrations does not exist"**
   - Solution: Run the `registrations-setup.sql` file in Supabase SQL Editor
   - Go to https://lhzbylxxhpslnuhbyvin.supabase.co
   - Navigate to SQL Editor
   - Paste and run the SQL code

   **Error: "Permission denied"**
   - Solution: Check your Supabase table policies
   - Go to Supabase → Authentication → Policies
   - Make sure the "Allow all operations" policy exists for `registrations` table

   **Error: "Supabase library not loaded"**
   - Solution: Check your internet connection
   - Try refreshing the page
   - Check if CDN is blocked by firewall

   **Error: "Config not loaded"**
   - Solution: Verify `/js/config.js` exists and is accessible
   - Check Supabase credentials are correct

3. **Test Database Connection:**
   - Open browser console on `/join.html`
   - Look for "Testing database connection..."
   - Should see "✓ Database connection successful"

4. **Try a Test Submission:**
   - Fill out the form with valid data
   - Open console (F12)
   - Submit the form
   - Watch the console for detailed logs
   - Should see "✓ Registration saved successfully!"

5. **Verify in Supabase:**
   - Go to Supabase → Table Editor
   - Select `registrations` table
   - Check if your test entry appears

### Debug Mode

The form now includes detailed console logging:
- Open browser console before submitting
- All steps are logged with ✓ or ⚠️ symbols
- Error messages include specific guidance

### Visual Indicators

- **Loading**: Button shows spinner while submitting
- **Success**: Green message with checkmark animation
- **Error**: Red error box below button with specific message

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify Supabase connection in `js/config.js`
3. Ensure the SQL setup was run successfully
4. Check Supabase table permissions

---

**Registration form is ready to accept submissions and all data will be visible in your admin dashboard!** 🚀
