#!/bin/bash

echo "🚀 ProductHuntr - Final Verification"
echo "===================================="

# 1. Trigger Data Update (using new query param auth)
echo "🔄 Triggering data update..."
CRON_SECRET="mp_cron_secret_2025_producthunt_analytics_tracker_v1_secure"
curl -s "http://localhost:3000/api/cron/update-snapshot?key=$CRON_SECRET" | jq '.'

echo ""
echo "------------------------------------"
echo ""

# 2. Check Frontend API
echo "📊 Checking frontend data..."
curl -s "http://localhost:3000/api/today-launches" | jq '.metrics'

echo ""
echo "===================================="
echo "If you see stats above, everything is working!"
echo "If you see errors, please run supabase/FIX_EVERYTHING.sql in Supabase Dashboard."
