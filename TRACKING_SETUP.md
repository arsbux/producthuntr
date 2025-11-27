# Visitor Tracking Setup Guide

This guide will help you set up visitor tracking for the Atomic Labs website using Supabase.

## Prerequisites

- A Supabase account (free tier works fine)
- Basic understanding of SQL and JavaScript

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in project details:
   - Name: `atomic-labs-tracking`
   - Database Password: (create a strong password)
   - Region: Choose closest to your users
4. Wait for project to be created (takes ~2 minutes)

## Step 2: Set Up Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase-setup.sql` file
4. Paste it into the SQL editor
5. Click "Run" to execute the SQL
6. Verify tables were created by going to **Table Editor**

You should see:
- `visitors` table
- `page_views` table
- `visitor_analytics` view
- `page_analytics` view

## Step 3: Get Your Supabase Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

## Step 4: Configure the Website

1. Open `js/config.js`
2. Replace the placeholder values:

```javascript
const SUPABASE_CONFIG = {
    url: 'YOUR_SUPABASE_URL', // Paste your Project URL here
    anonKey: 'YOUR_SUPABASE_ANON_KEY' // Paste your anon public key here
};
```

3. Save the file

## Step 5: Test Tracking

1. Open your website in a browser
2. Navigate to different pages
3. Click on CTA buttons
4. Go to Supabase dashboard → **Table Editor** → **visitors**
5. You should see visitor records appearing

## Step 6: Access Admin Dashboard

1. Navigate to `/admin/` on your website
2. Default credentials:
   - Username: `admin`
   - Password: `atomic2024`

**⚠️ IMPORTANT: Change the password immediately!**

To change the password:
1. Open `admin/admin-script.js`
2. Find the `ADMIN_CREDENTIALS` object (around line 13)
3. Change the password value
4. Save the file

## Step 7: Deploy

Once everything is working locally:

1. Commit all files to your repository
2. Deploy to your hosting platform (Netlify, Vercel, etc.)
3. Make sure `js/config.js` is included in the deployment

## What Gets Tracked

### Visitor Data
- Page URL and title
- Referrer (where they came from)
- Device type (mobile, tablet, desktop)
- Browser and OS
- Screen resolution
- Language
- Geographic location (if available)
- Timestamp

### Engagement Metrics
- Time spent on each page
- Scroll depth (how far they scrolled)
- CTA button clicks
- Program card clicks

## Admin Dashboard Features

### Overview Stats
- Total visitors
- Unique visitors
- Page views
- Average time on site
- CTA clicks
- Conversion rate

### Analytics
- Visitors over time (chart)
- Top pages
- Traffic sources
- Device breakdown
- Recent CTA clicks

### Filters
- Today
- Yesterday
- Last 7 days
- Last 30 days
- Last 90 days
- All time

## Security Best Practices

1. **Change Admin Password**: Update the default password in `admin/admin-script.js`

2. **Use Environment Variables** (for production):
   - Don't commit real credentials to Git
   - Use environment variables in your hosting platform
   - Update `js/config.js` to read from environment

3. **Enable RLS Policies**: The SQL setup already includes Row Level Security policies

4. **HTTPS Only**: Always use HTTPS in production

5. **Rate Limiting**: Consider adding rate limiting to prevent abuse

## Troubleshooting

### Tracking Not Working

1. **Check Browser Console**: Open DevTools → Console for errors
2. **Verify Supabase Config**: Make sure URL and key are correct in `js/config.js`
3. **Check Network Tab**: Look for failed requests to Supabase
4. **Verify Tables**: Ensure tables were created correctly in Supabase

### Admin Dashboard Not Loading Data

1. **Check Login**: Make sure you're logged in
2. **Check Console**: Look for JavaScript errors
3. **Verify Data**: Check if data exists in Supabase tables
4. **Check Date Range**: Try "All Time" filter

### Common Errors

**Error: "Invalid API key"**
- Solution: Double-check your anon key in `js/config.js`

**Error: "relation does not exist"**
- Solution: Run the SQL setup script again

**Error: "Failed to fetch"**
- Solution: Check your internet connection and Supabase project status

## Advanced Configuration

### Custom Events

Track custom events by calling:

```javascript
window.AtomicTracker.trackCTAClick('Custom Event Name');
```

### Exclude Pages from Tracking

Add this to pages you don't want to track:

```html
<script>
    window.ATOMIC_TRACKING_DISABLED = true;
</script>
```

### IP Geolocation

To add IP-based geolocation:
1. Use a service like ipapi.co or ipgeolocation.io
2. Update `js/tracker.js` to fetch location data
3. Add location fields to visitor data

## Data Privacy

This tracking system:
- ✅ Does NOT use cookies
- ✅ Does NOT track across websites
- ✅ Uses session storage (cleared when browser closes)
- ✅ Complies with basic privacy requirements

For GDPR compliance:
- Add a privacy policy page
- Include cookie/tracking notice
- Provide opt-out mechanism if required

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs
- Review browser console for errors
- Verify SQL tables are set up correctly

## File Structure

```
/
├── js/
│   ├── config.js          # Supabase configuration
│   └── tracker.js         # Tracking script
├── admin/
│   ├── index.html         # Admin dashboard
│   ├── admin-styles.css   # Dashboard styles
│   └── admin-script.js    # Dashboard logic
├── supabase-setup.sql     # Database setup
└── TRACKING_SETUP.md      # This file
```

## Next Steps

1. ✅ Set up Supabase project
2. ✅ Run SQL setup
3. ✅ Configure credentials
4. ✅ Test tracking
5. ✅ Change admin password
6. ✅ Deploy to production
7. 📊 Monitor your analytics!

---

**Built for Atomic Labs** - Track what matters, build what works.
