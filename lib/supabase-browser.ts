import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | undefined;

export const createClient = () => {
    if (client) {
        return client;
    }

    client = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    return client;
};

// Export a default instance for convenience
export const supabase = createClient();
