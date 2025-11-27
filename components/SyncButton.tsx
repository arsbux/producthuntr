'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface SyncButtonProps {
  source: string;
  endpoint: string;
  onSyncComplete?: () => void;
}

export default function SyncButton({ source, endpoint, onSyncComplete }: SyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; imported?: number } | null>(null);

  async function handleSync() {
    setSyncing(true);
    setResult(null);
    
    try {
      const res = await fetch(endpoint, { method: 'POST' });
      const data = await res.json();
      
      setResult({
        success: !data.error,
        message: data.error || `Successfully synced ${data.imported || 0} items`,
        imported: data.imported || 0,
      });
      
      if (!data.error && onSyncComplete) {
        onSyncComplete();
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to sync. Please try again.',
      });
    }
    
    setSyncing(false);
  }

  return (
    <div>
      <button
        onClick={handleSync}
        disabled={syncing}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
          syncing
            ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
            : 'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300'
        }`}
      >
        <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
        {syncing ? 'Syncing...' : `Sync ${source}`}
      </button>
      
      {result && (
        <div className={`mt-3 px-4 py-3 rounded-lg text-sm ${
          result.success 
            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
            : 'bg-red-50 text-red-900 border border-red-200'
        }`}>
          {result.message}
        </div>
      )}
    </div>
  );
}
