/**
 * Migrate Existing Data to Entity Resolution System
 * 
 * This script migrates your existing signals, companies, and people
 * into the new canonical entity and knowledge graph system.
 */

import { createClient } from '@supabase/supabase-js';
import { resolveCompany, resolvePerson } from '../lib/entity-resolver';
import { addSignalEvent } from '../lib/signal-timeline';
import { addCompanyFounder, addCompanyEmployee } from '../lib/knowledge-graph';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function migrateCompanies() {
  console.log('Migrating companies...');
  
  const { data: companies, error } = await supabase
    .from('companies')
    .select('*');
  
  if (error) {
    console.error('Error fetching companies:', error);
    return;
  }
  
  let migrated = 0;
  for (const company of companies || []) {
    try {
      const canonicalId = await resolveCompany(
        company.name,
        company.website,
        'legacy_migration',
        company.id
      );
      
      // Update company with canonical ID
      await supabase
        .from('companies')
        .update({ canonical_id: canonicalId })
        .eq('id', company.id);
      
      migrated++;
      if (migrated % 10 === 0) {
        console.log(`  Migrated ${migrated}/${companies.length} companies`);
      }
    } catch (error) {
      console.error(`Failed to migrate company ${company.name}:`, error);
    }
  }
  
  console.log(`✓ Migrated ${migrated} companies`);
}

async function migratePeople() {
  console.log('Migrating people...');
  
  const { data: people, error } = await supabase
    .from('people')
    .select('*');
  
  if (error) {
    console.error('Error fetching people:', error);
    return;
  }
  
  let migrated = 0;
  for (const person of people || []) {
    try {
      const canonicalId = await resolvePerson(
        person.name,
        person.email,
        person.company_id,
        'legacy_migration',
        person.id
      );
      
      // Update person with canonical ID
      await supabase
        .from('people')
        .update({ canonical_id: canonicalId })
        .eq('id', person.id);
      
      migrated++;
      if (migrated % 10 === 0) {
        console.log(`  Migrated ${migrated}/${people.length} people`);
      }
    } catch (error) {
      console.error(`Failed to migrate person ${person.name}:`, error);
    }
  }
  
  console.log(`✓ Migrated ${migrated} people`);
}

async function migrateSignals() {
  console.log('Migrating signals to timeline...');
  
  const { data: signals, error } = await supabase
    .from('signals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000); // Start with recent signals
  
  if (error) {
    console.error('Error fetching signals:', error);
    return;
  }
  
  let migrated = 0;
  for (const signal of signals || []) {
    try {
      // Get canonical company ID
      const { data: company } = await supabase
        .from('companies')
        .select('canonical_id')
        .eq('id', signal.company_id)
        .single();
      
      if (!company?.canonical_id) continue;
      
      // Map signal type to event type
      const eventTypeMap: Record<string, any> = {
        funding: 'funding',
        product_launch: 'launch',
        hiring: 'hire',
        growth_hiring: 'hire',
        press_mention: 'press',
        tech_release: 'release',
        partnership: 'partnership',
      };
      
      const eventType = eventTypeMap[signal.signal_type] || 'press';
      
      // Create signal event
      await addSignalEvent(
        'company',
        company.canonical_id,
        eventType,
        {
          eventDate: new Date(signal.published_at || signal.created_at),
          title: signal.headline,
          description: signal.summary,
          url: signal.source_link,
          impactScore: signal.score / 10, // Convert 0-10 to 0-1
          confidence: signal.credibility === 'high' ? 0.9 : signal.credibility === 'medium' ? 0.7 : 0.5,
          source: signal.ph_post_id ? 'producthunt' : signal.hn_story_id ? 'hackernews' : signal.yc_company_id ? 'yc' : 'manual',
          sourceId: signal.ph_post_id || signal.hn_story_id || signal.yc_company_id || signal.id,
          metadata: {
            original_signal_id: signal.id,
            signal_type: signal.signal_type,
            tags: signal.tags,
          },
        }
      );
      
      migrated++;
      if (migrated % 50 === 0) {
        console.log(`  Migrated ${migrated}/${signals.length} signals`);
      }
    } catch (error) {
      console.error(`Failed to migrate signal ${signal.id}:`, error);
    }
  }
  
  console.log(`✓ Migrated ${migrated} signals`);
}

async function extractRelationships() {
  console.log('Extracting relationships from existing data...');
  
  // Extract founder relationships from YC data
  const { data: ycSignals } = await supabase
    .from('signals')
    .select('*')
    .not('yc_company_id', 'is', null)
    .limit(500);
  
  let relationships = 0;
  for (const signal of ycSignals || []) {
    try {
      // Get canonical company
      const { data: company } = await supabase
        .from('companies')
        .select('canonical_id')
        .eq('id', signal.company_id)
        .single();
      
      if (!company?.canonical_id) continue;
      
      // Extract founders from metadata if available
      // This is a placeholder - adjust based on your actual data structure
      if (signal.metadata?.founders) {
        for (const founder of signal.metadata.founders) {
          const personId = await resolvePerson(
            founder.name,
            founder.email,
            company.canonical_id,
            'yc',
            signal.yc_company_id
          );
          
          await addCompanyFounder(
            company.canonical_id,
            personId,
            {
              title: founder.title || 'Founder',
              source: 'yc',
              confidence: 0.9,
            }
          );
          
          relationships++;
        }
      }
    } catch (error) {
      console.error(`Failed to extract relationships from signal ${signal.id}:`, error);
    }
  }
  
  console.log(`✓ Extracted ${relationships} relationships`);
}

async function main() {
  console.log('Starting data migration...\n');
  
  try {
    await migrateCompanies();
    await migratePeople();
    await migrateSignals();
    await extractRelationships();
    
    console.log('\n✓ Migration complete!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run refresh-scores');
    console.log('2. Verify data in admin panel');
    console.log('3. Set up automated score refresh (cron job)');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
