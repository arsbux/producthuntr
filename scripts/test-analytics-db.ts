import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const isServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`Using Supabase URL: ${supabaseUrl}`);
console.log(`Has Service Role Key: ${isServiceRole}`);
console.log(`Key length: ${supabaseKey?.length}`);

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAnalyticsInsert() {
    console.log('Testing analytics insertion...');

    const { data, error } = await supabase.from('analytics_visits').insert({
        page_path: '/test-script',
        user_agent: 'Test Script',
        ip_address: '127.0.0.1',
        country: 'Testland',
        city: 'Testville',
        device_type: 'desktop',
        referrer: 'direct',
        duration_seconds: 0
    }).select();

    if (error) {
        console.error('❌ Insertion failed:', error);
        if (error.code === '42P01') {
            console.error('👉 This means the table "analytics_visits" does not exist.');
            console.error('👉 Please run the SQL in "analytics-setup.sql" in your Supabase SQL Editor.');
        }
    } else {
        console.log('✅ Insertion successful:', data);
    }
}

testAnalyticsInsert();
