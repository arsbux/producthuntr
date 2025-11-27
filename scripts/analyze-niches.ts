import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeNiches() {
    const { data: launches } = await supabase
        .from('ph_launches')
        .select('ai_analysis, name, description, tagline')
        .not('ai_analysis', 'is', null);

    if (!launches) {
        console.log('No data found');
        return;
    }

    // Count niches
    const nicheCount = new Map();
    let unknownCount = 0;
    const unknownProducts = [];

    launches.forEach(launch => {
        const niche = launch.ai_analysis?.niche || 'Unknown';
        nicheCount.set(niche, (nicheCount.get(niche) || 0) + 1);

        if (niche === 'Unknown' || niche.toLowerCase() === 'unknown') {
            unknownCount++;
            unknownProducts.push({
                name: launch.name,
                tagline: launch.tagline,
                description: launch.description?.substring(0, 100)
            });
        }
    });

    // Sort by count
    const sorted = Array.from(nicheCount.entries()).sort((a, b) => b[1] - a[1]);

    console.log('=== NICHE ANALYSIS ===');
    console.log('Total niches:', nicheCount.size);
    console.log('Total products:', launches.length);
    console.log('Unknown products:', unknownCount);
    console.log('');
    console.log('Top 50 niches:');
    sorted.slice(0, 50).forEach(([niche, count]) => {
        console.log(`  ${count.toString().padStart(4)} - ${niche}`);
    });

    console.log('');
    console.log('Niches with only 1 product:', sorted.filter(([_, count]) => count === 1).length);
    console.log('Niches with 2-5 products:', sorted.filter(([_, count]) => count >= 2 && count <= 5).length);

    if (unknownProducts.length > 0) {
        console.log('');
        console.log('Sample Unknown products (first 10):');
        unknownProducts.slice(0, 10).forEach(p => {
            console.log(`  - ${p.name}`);
            console.log(`    ${p.tagline || p.description || 'No description'}`);
        });
    }
}

analyzeNiches();
