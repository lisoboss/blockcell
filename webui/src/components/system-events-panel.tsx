import { useState, useRef, useEffect } from 'react';
import { Bell, X, Trash2, AlertTriangle, AlertCircle, Info, FileText } from 'lucide-react';
import { useSystemEventsStore, type SystemEventItem } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

function priorityIcon(priority: string) {
  switch (priority) {
    case 'Critical':
      return <AlertTriangle size={14} className="text-red-500 shrink-0" />;
    case 'High':
      return <AlertCircle size={14} className="text-amber-500 shrink-0" />;
    default:
      return <Info size={14} className="text-blue-400 shrink-0" />;
  }
}

function kindIcon(kind: string) {
  if (kind === 'summary') return <FileText size={14} className="text-cyan-400 shrink-0" />;
  return null;
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export function SystemEventsPanel() {
  const t = useT();
  const { events, unreadCount, markAllRead, clearAll } = useSystemEventsStore();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function handleToggle() {
    if (!open) {
      markAllRead();
    }
    setOpen((v) => !v);
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={handleToggle}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          open
            ? 'bg-accent text-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        )}
        title={t('sysEvents.title')}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[70vh] bg-card border border-border rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">{t('sysEvents.title')}</h3>
            <div className="flex items-center gap-1">
              {events.length > 0 && (
                <button
                  onClick={clearAll}
                  className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"
                  title={t('sysEvents.clearAll')}
                >
                  <Trash2 size={14} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Event list */}
          <div className="flex-1 overflow-y-auto">
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bell size={28} className="mb-2 opacity-30" />
                <p className="text-sm">{t('sysEvents.empty')}</p>
                <p className="text-xs mt-1">{t('sysEvents.emptyHint')}</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {events.map((evt) => (
                  <EventRow key={evt.id} event={evt} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EventRow({ event }: { event: SystemEventItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        'px-4 py-3 hover:bg-accent/30 cursor-pointer transition-colors',
        !event.read && 'bg-accent/10'
      )}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-start gap-2">
        {event.kind === 'summary' ? kindIcon(event.kind) : priorityIcon(event.priority)}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{event.title}</span>
            <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(event.timestamp)}</span>
          </div>
          {event.kind === 'notification' && (
            <span className={cn(
              'inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded font-medium',
              event.priority === 'Critical' && 'bg-red-500/15 text-red-400',
              event.priority === 'High' && 'bg-amber-500/15 text-amber-400',
              event.priority === 'Normal' && 'bg-blue-500/15 text-blue-400',
              event.priority === 'Low' && 'bg-gray-500/15 text-gray-400',
            )}>
              {event.priority}
            </span>
          )}
          {event.kind === 'summary' && (
            <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded font-medium bg-cyan-500/15 text-cyan-400">
              Summary
            </span>
          )}
          {!expanded && event.body && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.body}</p>
          )}
          {expanded && event.body && (
            <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{event.body}</p>
          )}
          {expanded && event.items && event.items.length > 0 && (
            <div className="mt-2 space-y-1">
              {event.items.map((item: any, idx: number) => (
                <div key={idx} className="text-xs bg-muted/30 rounded px-2 py-1.5">
                  <span className="font-medium">{item.title || item.category || 'Item'}</span>
                  {item.body && <span className="text-muted-foreground ml-1">— {item.body}</span>}
                </div>
              ))}
            </div>
          )}
          {event.agentId && event.agentId !== 'default' && (
            <span className="text-[10px] text-muted-foreground mt-0.5 block">agent: {event.agentId}</span>
          )}
        </div>
      </div>
    </div>
  );
}
