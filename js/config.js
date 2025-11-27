// Supabase Configuration
// Replace these with your actual Supabase credentials
const SUPABASE_CONFIG = {
    url: 'https://lhzbylxxhpslnuhbyvin.supabase.co', // e.g., https://xxxxx.supabase.co
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoemJ5bHh4aHBzbG51aGJ5dmluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyOTQ5NDcsImV4cCI6MjA3Njg3MDk0N30.G8MIF4yKXSDFInlihL0z-TvmHOeoFkAM5xtagDLq_ZU'
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SUPABASE_CONFIG;
}
