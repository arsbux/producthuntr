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

interface Product {
    id: string;
    name: string;
    tagline: string;
    description: string;
    ai_analysis: any;
}

async function consolidateCategories() {
    console.log('🚀 Starting category consolidation...\n');

    try {
        // Fetch all products
        // Fetch all products with pagination
        console.log('📊 Fetching all products...');
        let allProducts: Product[] = [];
        let page = 0;
        const PAGE_SIZE = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data: products, error } = await supabase
                .from('ph_launches')
                .select('id, name, tagline, description, ai_analysis')
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

            if (error) {
                console.error('❌ Error fetching products:', error);
                return;
            }

            if (products && products.length > 0) {
                allProducts = [...allProducts, ...products];
                page++;
                process.stdout.write(`   Fetched ${allProducts.length} products...\r`);
                if (products.length < PAGE_SIZE) hasMore = false;
            } else {
                hasMore = false;
            }
        }
        console.log('\n');

        const products = allProducts;

        if (!products || products.length === 0) {
            console.log('⚠️  No products found');
            return;
        }

        console.log(`✅ Found ${products.length} products\n`);

        // Analyze current state
        const oldNiches = new Map<string, number>();
        const unknownProducts: Product[] = [];

        products.forEach((product: Product) => {
            const niche = product.ai_analysis?.niche || 'Unknown';
            oldNiches.set(niche, (oldNiches.get(niche) || 0) + 1);

            if (niche.toLowerCase() === 'unknown' || !niche) {
                unknownProducts.push(product);
            }
        });

        console.log('📈 Current State:');
        console.log(`   Total unique niches: ${oldNiches.size}`);
        console.log(`   Unknown products: ${unknownProducts.length}`);
        console.log(`   Niches with 1 product: ${Array.from(oldNiches.values()).filter(c => c === 1).length}`);
        console.log(`   Niches with 2-5 products: ${Array.from(oldNiches.values()).filter(c => c >= 2 && c <= 5).length}`);
        console.log('');

        // Process each product
        console.log('🔄 Processing products...');
        const newCategories = new Map<string, number>();
        const updates: Array<{ id: string; newCategory: string }> = [];
        let unknownFixed = 0;

        products.forEach((product: Product) => {
            const oldNiche = product.ai_analysis?.niche || 'Unknown';
            let newCategory: string;

            // First, try to categorize based on existing niche
            newCategory = categorizeNiche(oldNiche);

            // If it's Unknown or still Other, try to guess from product info
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
            updates.push({ id: product.id, newCategory });
        });

        console.log(`   Processed ${updates.length} products`);
        console.log(`   Fixed ${unknownFixed} unknown products\n`);

        console.log('📊 New Category Distribution:');
        const sorted = Array.from(newCategories.entries()).sort((a, b) => b[1] - a[1]);
        sorted.forEach(([category, count]) => {
            const percentage = ((count / products.length) * 100).toFixed(1);
            console.log(`   ${count.toString().padStart(4)} (${percentage.padStart(5)}%) - ${category}`);
        });
        console.log('');

        // Ask for confirmation
        console.log('⚠️  This will update all products in the database.');
        console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

        await new Promise(resolve => setTimeout(resolve, 5000));

        // Perform updates in batches
        console.log('💾 Updating database...');
        const BATCH_SIZE = 100;
        let updated = 0;
        let errors = 0;

        for (let i = 0; i < updates.length; i += BATCH_SIZE) {
            const batch = updates.slice(i, i + BATCH_SIZE);

            // Execute batch in parallel
            await Promise.all(batch.map(async (update) => {
                const { error } = await supabase
                    .from('ph_launches')
                    .update({
                        ai_analysis: {
                            ...products.find(p => p.id === update.id)?.ai_analysis,
                            niche: update.newCategory
                        }
                    })
                    .eq('id', update.id);

                if (error) {
                    errors++;
                    if (errors < 10) { // Only log first 10 errors
                        console.error(`   ❌ Error updating ${update.id}:`, error.message);
                    }
                } else {
                    updated++;
                }
            }));

            const progress = ((i + batch.length) / updates.length * 100).toFixed(1);
            process.stdout.write(`   Progress: ${progress}% (${i + batch.length}/${updates.length})\r`);
        }

        console.log('\n');
        console.log('✅ Migration Complete!');
        console.log(`   Successfully updated: ${updated} products`);
        console.log(`   Errors: ${errors}`);
        console.log(`   Categories reduced: ${oldNiches.size} → ${newCategories.size}`);
        console.log('');

    } catch (err) {
        console.error('❌ Migration failed:', err);
    }
}

consolidateCategories();
