import { useState, useEffect, useRef } from 'react';
import { WifiOff, ShieldAlert, ServerCrash, RefreshCw, LogIn, Loader2, Copy, Check } from 'lucide-react';
import { useConnectionStore } from '@/lib/store';
import { wsManager } from '@/lib/ws';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function ConnectionOverlay() {
  const t = useT();
  const { connected, reason, reconnectAttempt, nextRetryMs } = useConnectionStore();
  const [countdown, setCountdown] = useState(0);
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state when connection status changes
  useEffect(() => {
    setDismissed(false);
  }, [reason]);

  // Set countdown target whenever reconnect state changes
  const countdownTarget = useRef(0);
  useEffect(() => {
    if (connected || reason === 'auth_failed' || reason === 'none' || reason === 'reconnect_exhausted') {
      countdownTarget.current = 0;
      setCountdown(0);
    } else if (reconnectAttempt > 0 && !connected) {
      const secs = Math.ceil(nextRetryMs / 1000);
      countdownTarget.current = secs;
      setCountdown(secs);
    }
  }, [connected, reason, reconnectAttempt, nextRetryMs]);

  // Single stable interval for countdown — never recreated
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Don't show overlay when connected or in initial connecting state (first attempt)
  if (connected || reason === 'none') return null;
  if (reason === 'connecting' && reconnectAttempt === 0) return null;
  if (dismissed && reason !== 'auth_failed') return null;

  function handleRetry() {
    setCountdown(0);
    wsManager.forceReconnect();
  }

  function handleRelogin() {
    wsManager.relogin();
  }

  function handleCopyCmd() {
    navigator.clipboard.writeText('blockcell gateway').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleReload() {
    window.location.reload();
  }

  const isAuthFailed = reason === 'auth_failed';
  const isServerDown = reason === 'server_down';
  const isNetworkError = reason === 'network_error';
  const isConnecting = reason === 'connecting';
  const isReconnectExhausted = reason === 'reconnect_exhausted';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header with icon */}
        <div className={cn(
          'px-6 pt-8 pb-4 flex flex-col items-center text-center',
        )}>
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center mb-4',
            isAuthFailed ? 'bg-amber-500/10' : isServerDown ? 'bg-red-500/10' : 'bg-orange-500/10',
          )}>
            {isAuthFailed && <ShieldAlert size={32} className="text-amber-500" />}
            {isServerDown && <ServerCrash size={32} className="text-red-500" />}
            {isNetworkError && <WifiOff size={32} className="text-orange-500" />}
            {isReconnectExhausted && <ServerCrash size={32} className="text-red-500" />}
            {isConnecting && <Loader2 size={32} className="text-orange-500 animate-spin" />}
          </div>

          <h2 className="text-lg font-bold mb-2">
            {isAuthFailed && t('conn.authFailed')}
            {isServerDown && t('conn.serverDown')}
            {isNetworkError && t('conn.networkError')}
            {isReconnectExhausted && t('conn.reconnectExhausted')}
            {isConnecting && t('conn.connecting')}
          </h2>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {isAuthFailed && t('conn.authFailedDesc')}
            {isServerDown && t('conn.serverDownDesc')}
            {isNetworkError && t('conn.networkErrorDesc')}
            {isReconnectExhausted && t('conn.reconnectExhaustedDesc')}
            {isConnecting && t('conn.connectingDesc')}
          </p>
        </div>

        {/* Reconnect status */}
        {!isAuthFailed && !isReconnectExhausted && reconnectAttempt > 0 && (
          <div className="px-6 pb-2">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 size={12} className="animate-spin" />
              <span>{t('conn.reconnectAttempt', { n: reconnectAttempt })}</span>
              {countdown > 0 && (
                <span className="text-muted-foreground/70">
                  · {t('conn.reconnectWait', { sec: countdown })}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Help text for server down */}
        {isServerDown && (
          <div className="mx-6 mb-2 p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground mb-2">{t('conn.checkGateway')}</p>
            <button
              onClick={handleCopyCmd}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? t('conn.copied') : t('conn.copyCmd')}
            </button>
          </div>
        )}

        {/* Help text for network error */}
        {isNetworkError && (
          <div className="mx-6 mb-2 p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground">{t('conn.checkNetwork')}</p>
          </div>
        )}

        {isReconnectExhausted && (
          <div className="mx-6 mb-2 p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground">{t('conn.refreshToReload')}</p>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 pb-6 pt-2 flex flex-col gap-2">
          {isAuthFailed ? (
            <button
              onClick={handleRelogin}
              className="w-full py-3 text-sm font-medium rounded-xl bg-amber-500 text-white hover:bg-amber-600 flex items-center justify-center gap-2 transition-colors"
            >
              <LogIn size={16} />
              {t('conn.relogin')}
            </button>
          ) : isReconnectExhausted ? (
            <>
              <button
                onClick={handleReload}
                className="w-full py-3 text-sm font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw size={16} />
                {t('common.refresh')}
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('conn.dismiss')}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleRetry}
                className="w-full py-3 text-sm font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw size={16} />
                {t('conn.retry')}
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('conn.dismiss')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
