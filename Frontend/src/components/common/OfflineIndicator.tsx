import React, { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, X } from 'lucide-react';

interface OfflineIndicatorProps {
  onSync?: () => void;
}

/**
 * Toast pop notification triggered when user transitions between online and offline.
 * Shows a subtle floating pop toast with auto-dismiss and manual close.
 */
export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onSync }) => {
  const [toast, setToast] = useState<{
    type: 'offline' | 'online';
    title: string;
    message: string;
  } | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const showNotification = (type: 'offline' | 'online', title: string, message: string) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setToast({ type, title, message });
      timeoutRef.current = setTimeout(() => {
        setToast(null);
      }, type === 'offline' ? 4500 : 3500);
    };

    const handleOnline = () => {
      showNotification(
        'online',
        'Back Online',
        'Connection restored. Synced with server.'
      );
      if (onSync) onSync();
    };

    const handleOffline = () => {
      showNotification(
        'offline',
        'You are Offline',
        'Working offline. Changes are saved locally.'
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onSync]);

  if (!toast) return null;

  const isOffline = toast.type === 'offline';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 flex items-center space-x-3 px-4 py-3 rounded-2xl backdrop-blur-xl border shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
        isOffline
          ? 'bg-slate-900/95 border-amber-500/40 text-slate-200 shadow-amber-950/40'
          : 'bg-slate-900/95 border-emerald-500/40 text-slate-200 shadow-emerald-950/40'
      }`}
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          isOffline
            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
        }`}
      >
        {isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
      </div>

      <div className="min-w-0 pr-2">
        <p className="text-xs font-bold text-white tracking-wide">{toast.title}</p>
        <p className={`text-[11px] mt-0.5 ${isOffline ? 'text-amber-200/90' : 'text-emerald-200/90'}`}>
          {toast.message}
        </p>
      </div>

      <button
        onClick={() => setToast(null)}
        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
