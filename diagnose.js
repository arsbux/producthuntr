// Diagnostic Script - Run this in browser console to diagnose issues
// Copy and paste this entire file into your browser console (F12)

(async function diagnose() {
    console.log('🔍 Starting Atomic Labs Tracking Diagnostics...\n');
    
    // Check 1: Supabase library
    console.log('1️⃣ Checking Supabase library...');
    if (typeof window.supabase === 'undefined') {
        console.error('❌ Supabase library not loaded!');
        console.log('Fix: Make sure this script tag is in your HTML:');
        console.log('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
        return;
    }
    console.log('✅ Supabase library loaded\n');
    
    // Check 2: Configuration
    console.log('2️⃣ Checking configuration...');
    if (typeof SUPABASE_CONFIG === 'undefined') {
        console.error('❌ SUPABASE_CONFIG not found!');
        console.log('Fix: Make sure js/config.js is loaded');
        return;
    }
    
    if (!SUPABASE_CONFIG.url || SUPABASE_CONFIG.url === 'YOUR_SUPABASE_URL') {
        console.error('❌ Supabase URL not configured!');
        console.log('Fix: Update js/config.js with your Supabase URL');
        return;
    }
    console.log('✅ URL configured:', SUPABASE_CONFIG.url);
    
    if (!SUPABASE_CONFIG.anonKey || SUPABASE_CONFIG.anonKey === 'YOUR_SUPABASE_ANON_KEY') {
        console.error('❌ Supabase anon key not configured!');
        console.log('Fix: Update js/config.js with your anon key');
        return;
    }
    console.log('✅ Anon key configured:', SUPABASE_CONFIG.anonKey.substring(0, 20) + '...\n');
    
    // Check 3: Create client
    console.log('3️⃣ Creating Supabase client...');
    let supabase;
    try {
        supabase = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey
        );
        console.log('✅ Client created\n');
    } catch (err) {
        console.error('❌ Failed to create client:', err.message);
        return;
    }
    
    // Check 4: Test connection
    console.log('4️⃣ Testing connection...');
    try {
        const { data, error } = await supabase
            .from('visitors')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('❌ Connection failed!');
            console.error('Error:', error.message);
            console.error('Code:', error.code);
            console.error('Details:', error.details);
            
            if (error.code === '42P01') {
                console.log('\n🔧 Fix: Tables don\'t exist. Run supabase-setup.sql');
            } else if (error.code === '42501' || error.message.includes('permission denied')) {
                console.log('\n🔧 Fix: Permission denied. Run ultimate-fix.sql');
            } else if (error.message.includes('Unauthorized') || error.message.includes('401')) {
                console.log('\n🔧 Fix: Check your API key and enable anonymous sign-ins');
                console.log('1. Verify anon key in js/config.js');
                console.log('2. Supabase → Authentication → Providers → Enable anonymous sign-ins');
            }
            return;
        }
        console.log('✅ Connection successful!\n');
    } catch (err) {
        console.error('❌ Connection test failed:', err.message);
        return;
    }
    
    // Check 5: Test insert
    console.log('5️⃣ Testing insert...');
    try {
        const testData = {
            session_id: 'diagnostic_test_' + Date.now(),
            page_url: window.location.href,
            page_title: 'Diagnostic Test',
            referrer: 'diagnostic'
        };
        
        const { data, error } = await supabase
            .from('visitors')
            .insert([testData])
            .select()
            .single();
        
        if (error) {
            console.error('❌ Insert failed!');
            console.error('Error:', error.message);
            console.error('Code:', error.code);
            
            if (error.code === '42501' || error.message.includes('permission denied')) {
                console.log('\n🔧 Fix: Run ultimate-fix.sql in Supabase');
            } else if (error.message.includes('Unauthorized')) {
                console.log('\n🔧 Fix: Enable anonymous sign-ins in Supabase');
            }
            return;
        }
        
        console.log('✅ Insert successful!');
        console.log('Inserted ID:', data.id);
        
        // Clean up test data
        await supabase.from('visitors').delete().eq('id', data.id);
        console.log('✅ Test data cleaned up\n');
    } catch (err) {
        console.error('❌ Insert test failed:', err.message);
        return;
    }
    
    // Check 6: Test read
    console.log('6️⃣ Testing read...');
    try {
        const { data, error, count } = await supabase
            .from('visitors')
            .select('*', { count: 'exact' })
            .limit(1);
        
        if (error) {
            console.error('❌ Read failed!');
            console.error('Error:', error.message);
            return;
        }
        
        console.log('✅ Read successful!');
        console.log('Total visitors in database:', count);
        console.log('\n');
    } catch (err) {
        console.error('❌ Read test failed:', err.message);
        return;
    }
    
    // Summary
    console.log('═══════════════════════════════════════');
    console.log('🎉 ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════');
    console.log('✅ Supabase library loaded');
    console.log('✅ Configuration correct');
    console.log('✅ Client created');
    console.log('✅ Connection working');
    console.log('✅ Insert working');
    console.log('✅ Read working');
    console.log('\n✨ Tracking should be working perfectly!');
    console.log('Hard refresh your page (Ctrl+Shift+R) to start tracking.\n');
})();
