const fetch = require('node-fetch');

const CRON_SECRET = process.env.CRON_SECRET || 'mp_cron_secret_2025_producthunt_analytics_tracker_v1_secure';
const PORT = process.env.PORT || 3000;
const URL = `http://localhost:${PORT}/api/cron/update-snapshot?key=${CRON_SECRET}`;
const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

async function triggerUpdate() {
    try {
        console.log(`\n🔄 [Auto-Ingest] Triggering snapshot update...`);
        const start = Date.now();

        const response = await fetch(URL);
        const data = await response.json();
        const duration = Date.now() - start;

        if (response.ok) {
            console.log(`✅ [Auto-Ingest] Success! (${duration}ms)`);
            if (data.stats) {
                console.log(`   Stats: ${data.stats.inserted}/${data.stats.total} products updated`);
            }
        } else {
            console.error(`❌ [Auto-Ingest] Failed: ${response.status} ${response.statusText}`);
            console.error('   Error:', data);
        }
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log(`⏳ [Auto-Ingest] Waiting for server to start...`);
        } else {
            console.error(`❌ [Auto-Ingest] Error:`, error.message);
        }
    }
}

// Initial delay to let Next.js start
console.log(`🚀 [Auto-Ingest] Starting background poller (Every 5 mins)`);
setTimeout(() => {
    triggerUpdate();
    setInterval(triggerUpdate, INTERVAL_MS);
}, 5000);
