import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    console.error('URL:', supabaseUrl ? 'Present' : 'Missing');
    console.error('Key:', supabaseKey ? 'Present' : 'Missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Connecting to Supabase...');

// Define the shape of the data we expect
interface LaunchData {
    name: string;
    tagline: string;
    ai_analysis: any; // Using any to bypass the Json type restriction for this script
}

async function analyzeNiches() {
    try {
        const { data, error } = await supabase
            .from('ph_launches')
            .select('ai_analysis, name, tagline')
            .not('ai_analysis', 'is', null)
            .limit(10);

        if (error) {
            console.error('Error fetching data:', error);
            return;
        }

        // Cast the data to our interface
        const launches = data as unknown as LaunchData[];

        if (!launches || launches.length === 0) {
            console.log('No data found');
            return;
        }

        console.log('Successfully fetched', launches.length, 'products');
        console.log('Sample:', launches[0].name);
        console.log('Niche:', launches[0].ai_analysis?.niche);
    } catch (err) {
        console.error('Exception:', err);
    }
}

analyzeNiches();
