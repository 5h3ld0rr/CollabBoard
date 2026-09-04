import React, { useState, useEffect } from 'react';
import { WifiOff, Database, Check, RefreshCw } from 'lucide-react';

interface OfflineIndicatorProps {
  onSync?: () => void;
  isSyncing?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onSync, isSyncing = false }) => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnectedToast, setShowReconnectedToast] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnectedToast(true);
      if (onSync) onSync();
      setTimeout(() => setShowReconnectedToast(false), 3500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnectedToast(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onSync]);

  if (showReconnectedToast) {
    return (
      <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium animate-fade-in">
        <Check className="w-3.5 h-3.5" />
        <span>Back online — IDB synced</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium animate-pulse">
        <WifiOff className="w-3.5 h-3.5 text-amber-400" />
        <span>Offline Mode (IDB Cache Active)</span>
        {onSync && (
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="ml-1 p-1 hover:bg-amber-500/20 rounded-lg text-amber-200 transition cursor-pointer"
            title="Retry Connection"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400 text-[11px] font-medium">
      <Database className="w-3 h-3 text-indigo-400" />
      <span>IDB Local Cache</span>
    </div>
  );
};
