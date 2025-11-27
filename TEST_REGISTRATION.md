# Quick Test Guide for Registration Form

## ✅ Pre-Flight Checklist

Before testing the form, ensure:

1. **SQL Setup Complete**
   - [ ] Opened Supabase SQL Editor at https://lhzbylxxhpslnuhbyvin.supabase.co
   - [ ] Copied contents of `registrations-setup.sql`
   - [ ] Ran the SQL code successfully
   - [ ] Verified no errors in Supabase

2. **Files in Place**
   - [ ] `join.html` exists in project root
   - [ ] `js/config.js` exists with correct Supabase credentials
   - [ ] All files are deployed/accessible

## 🧪 Testing Steps

### Test 1: Page Loads Correctly

1. Open `/join.html` in browser
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Look for these messages:
   ```
   === Registration Form Initialization ===
   Supabase library loaded: true
   Config loaded: true
   ✓ Supabase client initialized successfully
   Supabase URL: https://lhzbylxxhpslnuhbyvin.supabase.co
   Testing database connection...
   ✓ Database connection successful
   ✓ Form handlers initialized
   === Initialization Complete ===
   ```

**Expected Result:** All ✓ green checkmarks, no red errors

**If you see errors:**
- "Table does not exist" → Run SQL setup
- "Config not loaded" → Check `js/config.js` path
- "Library not loaded" → Check internet connection

### Test 2: Form Validation

1. Try submitting empty form
2. Browser should show validation errors
3. Fill in invalid data:
   - Age: 5 (too young)
   - Phone: 123 (too short)
4. Should see red error message below button

**Expected Result:** Form prevents invalid submissions

### Test 3: Successful Submission

1. Fill in valid data:
   ```
   Full Name: Test Student
   Age: 16
   Location: Kampala, Uganda
   Phone: 0700123456
   ```

2. Click "Complete Registration"

3. Watch the console - should see:
   ```
   === Form Submission Started ===
   Form data collected: {full_name: "Test Student", ...}
   ✓ Validation passed
   Sending to Supabase...
   ✓ Registration saved successfully!
   ```

4. Form should:
   - Show loading spinner on button
   - Hide form
   - Show green success message with animation
   - Auto-scroll to success message

**Expected Result:** Success message appears, no errors

### Test 4: Verify in Database

1. Go to Supabase: https://lhzbylxxhpslnuhbyvin.supabase.co
2. Navigate to: Table Editor → registrations
3. Look for your test entry
4. Should see all fields populated correctly

**Expected Result:** Entry appears in database

### Test 5: Verify in Admin Dashboard

1. Open `/admin/index.html`
2. Login with credentials:
   - Username: `admin`
   - Password: `atomiclabs2025`
3. Check "Registrations" stat card
4. Scroll to "Recent Registrations" table
5. Should see your test entry

**Expected Result:** 
- Stat shows "1" (or total count)
- Table shows test entry with all details

## 🐛 Common Issues & Solutions

### Issue: "Table does not exist"
**Solution:**
1. Go to Supabase SQL Editor
2. Run `registrations-setup.sql`
3. Verify it completes without errors
4. Refresh the page and try again

### Issue: Form submits but data doesn't appear
**Solution:**
1. Check browser console for errors
2. Verify Supabase credentials in `js/config.js`
3. Check Supabase table policies
4. Try manual insert in Supabase to test permissions

### Issue: Loading spinner never stops
**Solution:**
1. Check network tab in DevTools
2. Look for failed requests to Supabase
3. Verify internet connection
4. Check Supabase service status

### Issue: Success message doesn't show
**Solution:**
1. Check console for JavaScript errors
2. Verify no conflicting CSS
3. Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

## 📱 Phone Number Test Cases

Test these phone formats (all should work):

✅ `0700123456` → Auto-converts to `+256700123456`
✅ `256700123456` → Auto-converts to `+256700123456`
✅ `+256700123456` → Stays as is
✅ `0750 123 456` → Removes spaces, converts to `+256750123456`

❌ `123` → Too short, validation error
❌ `+1234567890` → Wrong country code, validation error

## 🎯 Success Criteria

All tests pass when:
- ✅ Page loads with all green checkmarks in console
- ✅ Form validates input correctly
- ✅ Phone numbers auto-format
- ✅ Submission shows loading spinner
- ✅ Success message displays after submission
- ✅ Data appears in Supabase database
- ✅ Data appears in admin dashboard
- ✅ No console errors during entire process

## 📊 Testing Checklist

- [ ] SQL setup completed
- [ ] Page loads without errors
- [ ] Database connection successful
- [ ] Form validation works
- [ ] Phone auto-formatting works
- [ ] Submission shows loading state
- [ ] Success message displays
- [ ] Data saved to Supabase
- [ ] Data visible in admin
- [ ] Multiple submissions work
- [ ] Tested on desktop browser
- [ ] Tested on mobile (optional)

---

## 🚀 Ready for Production?

Once all tests pass:
1. ✅ Change admin password in `admin/admin-script.js`
2. ✅ Deploy to production
3. ✅ Test once more on live site
4. ✅ Share `/join` URL with users

**Need Help?** Check `REGISTRATION_SETUP.md` for detailed troubleshooting.
