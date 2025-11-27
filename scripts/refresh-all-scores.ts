/**
 * Refresh All Entity Scores
 * 
 * Run this periodically (daily) to update impact scores for all entities
 */

import { refreshAllScores } from '../lib/signal-timeline';

async function main() {
  console.log('Starting score refresh...\n');
  
  try {
    console.log('Refreshing company scores...');
    const companyCount = await refreshAllScores('company', 500);
    console.log(`✓ Refreshed ${companyCount} company scores`);
    
    console.log('\nRefreshing person scores...');
    const personCount = await refreshAllScores('person', 500);
    console.log(`✓ Refreshed ${personCount} person scores`);
    
    console.log(`\n✓ Total: ${companyCount + personCount} scores refreshed`);
  } catch (error) {
    console.error('Score refresh failed:', error);
    process.exit(1);
  }
}

main();
