import { createClient } from '@supabase/supabase-js';
import { categorizeNiche, guessCategory, MAIN_CATEGORIES } from '../lib/category-mapping';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function previewConsolidation() {
    console.log('👀 PREVIEW MODE - No database changes will be made\n');

    try {
        // Fetch sample of products
        console.log('📊 Fetching products...');
        const { data: products, error } = await supabase
            .from('ph_launches')
            .select('id, name, tagline, description, ai_analysis')
            .limit(1000); // Sample 1000 for preview

        if (error) {
            console.error('❌ Error:', error);
            return;
        }

        if (!products || products.length === 0) {
            console.log('⚠️  No products found');
            return;
        }

        console.log(`✅ Analyzing ${products.length} products\n`);

        // Analyze current state
        const oldNiches = new Map<string, number>();
        const unknownProducts: any[] = [];

        products.forEach(product => {
            const niche = product.ai_analysis?.niche || 'Unknown';
            oldNiches.set(niche, (oldNiches.get(niche) || 0) + 1);

            if (niche.toLowerCase() === 'unknown') {
                unknownProducts.push(product);
            }
        });

        console.log('📈 CURRENT STATE:');
        console.log('─'.repeat(60));
        console.log(`Total unique niches: ${oldNiches.size}`);
        console.log(`Unknown products: ${unknownProducts.length}`);
        console.log(`Niches with 1 product: ${Array.from(oldNiches.values()).filter(c => c === 1).length}`);
        console.log(`Niches with 2-5 products: ${Array.from(oldNiches.values()).filter(c => c >= 2 && c <= 5).length}`);
        console.log('');

        // Show top 20 current niches
        console.log('Top 20 current niches:');
        const sorted = Array.from(oldNiches.entries()).sort((a, b) => b[1] - a[1]);
        sorted.slice(0, 20).forEach(([niche, count]) => {
            console.log(`  ${count.toString().padStart(3)} - ${niche}`);
        });
        console.log('');

        // Process products
        const newCategories = new Map<string, number>();
        const categoryExamples = new Map<string, string[]>();
        let unknownFixed = 0;

        products.forEach(product => {
            const oldNiche = product.ai_analysis?.niche || 'Unknown';
            let newCategory = categorizeNiche(oldNiche);

            // Try guessing for Unknown or Other
            if (newCategory === MAIN_CATEGORIES.OTHER || oldNiche.toLowerCase() === 'unknown') {
                const guessed = guessCategory(
                    product.name || '',
                    product.tagline || '',
                    product.description || ''
                );

                if (guessed !== MAIN_CATEGORIES.OTHER) {
                    newCategory = guessed;
                    if (oldNiche.toLowerCase() === 'unknown') {
                        unknownFixed++;
                    }
                }
            }

            newCategories.set(newCategory, (newCategories.get(newCategory) || 0) + 1);

            // Store examples
            const examples = categoryExamples.get(newCategory) || [];
            if (examples.length < 3) {
                examples.push(product.name);
                categoryExamples.set(newCategory, examples);
            }
        });

        console.log('📊 NEW CATEGORY DISTRIBUTION:');
        console.log('─'.repeat(60));
        const newSorted = Array.from(newCategories.entries()).sort((a, b) => b[1] - a[1]);
        newSorted.forEach(([category, count]) => {
            const percentage = ((count / products.length) * 100).toFixed(1);
            const examples = categoryExamples.get(category) || [];

            console.log(`\n${category}`);
            console.log(`  Count: ${count} (${percentage}% of sample)`);
            console.log(`  Examples: ${examples.join(', ')}`);
        });

        console.log('\n');
        console.log('📋 SUMMARY:');
        console.log('─'.repeat(60));
        console.log(`Categories: ${oldNiches.size} → ${newCategories.size}`);
        console.log(`Unknown products fixed: ${unknownFixed}/${unknownProducts.length}`);
        console.log(`Reduction: ${((1 - newCategories.size / oldNiches.size) * 100).toFixed(1)}%`);

        // Show sample mappings
        console.log('\n');
        console.log('🔄 SAMPLE MAPPINGS (Before → After):');
        console.log('─'.repeat(60));
        const sampleMappings = new Map<string, string>();

        products.slice(0, 20).forEach(product => {
            const oldNiche = product.ai_analysis?.niche || 'Unknown';
            let newCategory = categorizeNiche(oldNiche);

            if (newCategory === MAIN_CATEGORIES.OTHER || oldNiche.toLowerCase() === 'unknown') {
                newCategory = guessCategory(
                    product.name || '',
                    product.tagline || '',
                    product.description || ''
                );
            }

            if (oldNiche !== newCategory && !sampleMappings.has(oldNiche)) {
                sampleMappings.set(oldNiche, newCategory);
            }
        });

        sampleMappings.forEach((newCat, oldNiche) => {
            console.log(`  "${oldNiche}" → "${newCat}"`);
        });

        // Show Unknown fixes
        if (unknownProducts.length > 0) {
            console.log('\n');
            console.log('🔧 SAMPLE UNKNOWN FIXES:');
            console.log('─'.repeat(60));
            unknownProducts.slice(0, 10).forEach(product => {
                const newCategory = guessCategory(
                    product.name || '',
                    product.tagline || '',
                    product.description || ''
                );
                console.log(`  "${product.name}" → ${newCategory}`);
            });
        }

        console.log('\n');
        console.log('✅ Preview complete! No changes were made to the database.');
        console.log('');
        console.log('To apply these changes, run:');
        console.log('  npx tsx scripts/consolidate-categories.ts');
        console.log('');

    } catch (err) {
        console.error('❌ Error:', err);
    }
}

previewConsolidation();
