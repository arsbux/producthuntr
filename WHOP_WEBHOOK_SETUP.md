# Whop Webhook Setup Guide

## ✅ Correct Webhook Configuration

### Step 1: Change the Endpoint URL in Whop Dashboard

**❌ WRONG (What you have now):**
```
http://localhost:3000/api/auth/whop/callback
```

**✅ CORRECT:**
```
http://localhost:3000/api/webhooks/whop
```

> **Note**: `/api/auth/whop/callback` is for OAuth login, NOT webhooks!

---

### Step 2: For Local Testing - Use Ngrok

Since `localhost` URLs don't work for webhooks (Whop can't reach your local machine), you need to use **ngrok** to expose your local server:

#### Install Ngrok:
```bash
# macOS
brew install ngrok

# Or download from https://ngrok.com
```

#### Start Ngrok Tunnel:
```bash
ngrok http 3000
```

#### You'll get a URL like:
```
https://abc123.ngrok.io
```

#### Update Whop Webhook URL to:
```
https://abc123.ngrok.io/api/webhooks/whop
```

---

### Step 3: Events to Enable

Keep these events checked (they're the important ones):

✅ **Essential:**
- `membership_activated` - User gets access
- `membership_deactivated` - User loses access  
- `payment_succeeded` - Payment processed successfully
- `invoice_paid` - Monthly invoice paid

✅ **Recommended:**
- `membership_went_valid` - Failed payment recovered
- `membership_went_invalid` - Payment failed
- `invoice_past_due` - Payment issue warning

You can keep "All" checked for now to see all events in your webhook handler.

---

### Step 4: Test Webhook

After setup:

1. **Start your dev server**: `npm run dev`
2. **Start ngrok**: `ngrok http 3000`  
3. **Update Whop webhook** with ngrok URL
4. **Make a test purchase** on Whop
5. **Check your terminal** - you should see webhook events logged

Expected output in terminal:
```
📥 Whop Webhook Event: membership_activated
📦 Event Data: { user_id: "...", membership_id: "..." }
✅ Membership Activated: user_xxx
```

---

## 🔒 Security Note

The webhook handler verifies the `x-whop-signature` header to ensure webhooks are from Whop (not attackers). This uses your `WHOP_WEBHOOK_SECRET` from `.env.local`.

---

## 🚀 Production Setup

When you deploy to production:

1. Use your production domain:
   ```
   https://yourdomain.com/api/webhooks/whop
   ```

2. Update webhook URL in Whop dashboard

3. No ngrok needed in production!

---

## 📝 Current Webhook Implementation

The webhook handler (`/api/webhooks/whop`) currently just logs events. 

**Next steps:**
- Connect to your Supabase database
- Grant/revoke user access based on events
- Send email notifications
- Track payments/revenue

I can help implement these next!
