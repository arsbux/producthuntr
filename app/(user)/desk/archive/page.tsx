import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import ArchiveView from '@/components/ArchiveView';

export const dynamic = 'force-dynamic';

export default async function ArchivePage() {
    const supabase = createServerComponentClient({ cookies });

    // Fetch initial data (latest 20 launches)
    const { data: initialLaunches } = await supabase
        .from('ph_launches')
        .select('*')
        .order('launched_at', { ascending: false })
        .limit(20);

    return <ArchiveView initialLaunches={initialLaunches || []} />;
}
