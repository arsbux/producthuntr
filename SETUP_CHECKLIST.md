# Setup Checklist
## 1. Database Schema
The database needs to be updated with the new tables.
- [ ] Copy the content of `scripts/06-ph-analyst-schema.sql`.
- [ ] Go to your Supabase Dashboard -> SQL Editor.
- [ ] Paste and run the SQL.

## 2. Environment Variables
The AI Analyst needs an API key.
- [ ] Open `.env.local`.
- [ ] Ensure `ANTHROPIC_API_KEY` is set and valid.
- [ ] Ensure `PRODUCT_HUNT_API_TOKEN` is set.

## 3. Run Backfill
Once the above are done, run the backfill script to populate data:
```bash
npx tsx scripts/backfill-ph-launches.ts
```

## 4. Verify
- [ ] Go to `http://localhost:3000/desk` to see the new dashboard.
- [ ] Go to `http://localhost:3000/desk/trends` to see the trends.
