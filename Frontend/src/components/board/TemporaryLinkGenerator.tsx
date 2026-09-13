import React, { useState, useEffect } from 'react';
import { Copy, Check, Sparkles, RotateCcw, RefreshCw } from 'lucide-react';
import { generateShareToken, resetShareToken, getActiveShareToken } from '../../api/boards';

interface TemporaryLinkGeneratorProps {
  boardId: string;
}

type ExpiryOption = '1h' | '24h' | '7d' | 'never';

export const TemporaryLinkGenerator: React.FC<TemporaryLinkGeneratorProps> = ({ boardId }) => {
  const [duration, setDuration] = useState<ExpiryOption>('24h');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isGenerated, setIsGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync with existing active share token on mount or boardId change
  useEffect(() => {
    let isMounted = true;

    // 1. Instant hydration from localStorage
    try {
      const cached = localStorage.getItem(`collabboard:active_share:${boardId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        const isNotExpired = !parsed.expiresAt || new Date(parsed.expiresAt).getTime() > Date.now();
        if (parsed.token && isNotExpired) {
          setShareUrl(parsed.shareUrl);
          setDuration(parsed.expiresIn || '24h');
          setIsGenerated(true);
        } else {
          localStorage.removeItem(`collabboard:active_share:${boardId}`);
        }
      }
    } catch {
      // Ignore localStorage errors
    }

    // 2. Fetch active share token from backend
    getActiveShareToken(boardId)
      .then((active) => {
        if (!isMounted) return;
        if (active && active.token) {
          setShareUrl(active.shareUrl);
          setDuration(active.expiresIn || '24h');
          setIsGenerated(true);
          try {
            localStorage.setItem(`collabboard:active_share:${boardId}`, JSON.stringify(active));
          } catch {}
        } else {
          setIsGenerated(false);
          setShareUrl('');
          try {
            localStorage.removeItem(`collabboard:active_share:${boardId}`);
          } catch {}
        }
      })
      .catch(() => {
        // Silently fallback to cached or initial state
      });

    return () => {
      isMounted = false;
    };
  }, [boardId]);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleGenerate = async (dur = duration) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await generateShareToken(boardId, dur);
      setShareUrl(res.shareUrl);
      setIsGenerated(true);
      try {
        localStorage.setItem(`collabboard:active_share:${boardId}`, JSON.stringify(res));
      } catch {}
      showStatus(
        dur === 'never'
          ? 'Link generated (Never expires)! Ready to copy.'
          : `Link generated for ${dur}! Ready to copy.`
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to generate link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    setError(null);
    try {
      await resetShareToken(boardId);
      setShareUrl('');
      setIsGenerated(false);
      setCopied(false);
      try {
        localStorage.removeItem(`collabboard:active_share:${boardId}`);
      } catch {}
      showStatus('Previous link revoked. You can generate a new one.');
    } catch (err: any) {
      setError(err?.message || 'Failed to reset link');
    } finally {
      setIsResetting(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  const handleDurationChange = (newDur: ExpiryOption) => {
    setDuration(newDur);
    if (isGenerated) {
      handleGenerate(newDur);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Temporary View-Only Link
          </label>
          <p className="text-[11px] text-slate-400">
            {isGenerated
              ? `Active (${duration === 'never' ? 'Never expires' : duration}) · Link ready to copy`
              : 'Share read-only access for guests without an account'}
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
          {/* Duration Selector Pills */}
          <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
            {(['1h', '24h', '7d', 'never'] as const).map((dur) => (
              <button
                key={dur}
                type="button"
                onClick={() => handleDurationChange(dur)}
                className={`px-2 py-0.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  duration === dur
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {dur === 'never' ? 'Never' : dur}
              </button>
            ))}
          </div>

          {/* Action Buttons: Generate when idle, Copy & Reset when generated */}
          {!isGenerated ? (
            <button
              type="button"
              onClick={() => handleGenerate(duration)}
              disabled={isLoading}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs text-white font-medium transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Generate Link</span>
                </>
              )}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleReset}
                disabled={isResetting}
                title="Revoke active link and reset"
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs text-slate-300 hover:text-white font-medium transition flex items-center space-x-1 cursor-pointer"
              >
                <RotateCcw className={`w-3.5 h-3.5 text-slate-400 ${isResetting ? 'animate-spin' : ''}`} />
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs text-white font-medium transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-indigo-200" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Feedback Message */}
      {statusMessage && (
        <div className="px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] flex items-center space-x-1.5 animate-fade-in">
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => handleGenerate(duration)}
            className="text-xs underline hover:text-rose-300 flex items-center space-x-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}
    </div>
  );
};
