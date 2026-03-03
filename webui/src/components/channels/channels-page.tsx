import { useEffect, useRef, useState } from 'react';
import {
  MessageCircle, Hash, Slack, Send, Phone, Building2, Wifi, Globe,
  X, ExternalLink, Save, CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import { getChannels, updateChannel, type ChannelInfo, type ChannelField } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useI18nStore, useT } from '@/lib/i18n';

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  telegram: <Send className="w-7 h-7" />,
  discord: <Hash className="w-7 h-7" />,
  slack: <Slack className="w-7 h-7" />,
  feishu: <MessageCircle className="w-7 h-7" />,
  dingtalk: <Phone className="w-7 h-7" />,
  wecom: <Building2 className="w-7 h-7" />,
  whatsapp: <Wifi className="w-7 h-7" />,
  lark: <Globe className="w-7 h-7" />,
};

const CHANNEL_COLORS: Record<string, string> = {
  telegram: 'text-blue-400',
  discord: 'text-indigo-400',
  slack: 'text-purple-400',
  feishu: 'text-cyan-400',
  dingtalk: 'text-orange-400',
  wecom: 'text-green-400',
  whatsapp: 'text-emerald-400',
  lark: 'text-sky-400',
};

const GITHUB_BASE_ZH = 'https://github.com/blockcell-labs/blockcell/blob/main/docs/channels/zh/';
const GITHUB_BASE_EN = 'https://github.com/blockcell-labs/blockcell/blob/main/docs/channels/en/';

const DOC_FILES: Record<string, string> = {
  telegram: '01_telegram.md',
  discord:  '02_discord.md',
  slack:    '03_slack.md',
  feishu:   '04_feishu.md',
  dingtalk: '05_dingtalk.md',
  wecom:    '06_wecom.md',
  whatsapp: '07_whatsapp.md',
  lark:     '08_lark.md',
};

function ToggleSwitch({
  enabled,
  onChange,
  disabled = false,
  disabledTitle,
  enabledTitle,
  disabledStateTitle,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  disabledTitle?: string;
  enabledTitle?: string;
  disabledStateTitle?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); if (!disabled) onChange(!enabled); }}
      title={disabled ? (disabledTitle ?? '') : (enabled ? (enabledTitle ?? '') : (disabledStateTitle ?? ''))}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
        enabled ? 'bg-cyber' : 'bg-muted'
      )}
    >
      <span className={cn(
        'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
        enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
      )} />
    </button>
  );
}

function ChannelCard({
  channel,
  onConfigure,
  onToggle,
}: {
  channel: ChannelInfo;
  onConfigure: (ch: ChannelInfo) => void;
  onToggle: (ch: ChannelInfo, enabled: boolean) => void;
}) {
  const { locale } = useI18nStore();
  const t = useT();
  const iconColor = CHANNEL_COLORS[channel.id] || 'text-cyber';
  const isActive = channel.configured;
  const docFile = DOC_FILES[channel.id] ?? '';
  const docUrl = (locale === 'zh' ? GITHUB_BASE_ZH : GITHUB_BASE_EN) + docFile;

  return (
    <div
      className={cn(
        'relative rounded-xl border p-5 flex flex-col gap-3 transition-all duration-200 cursor-pointer group',
        isActive
          ? 'border-cyber/40 bg-cyber/5 shadow-md shadow-cyber/10'
          : 'border-border/40 bg-card/60 opacity-70 hover:opacity-90'
      )}
      onClick={() => onConfigure(channel)}
    >
      <div className="flex items-start justify-between">
        <div className={cn('p-2 rounded-lg bg-muted/60', iconColor)}>
          {CHANNEL_ICONS[channel.id] ?? <Globe className="w-7 h-7" />}
        </div>
        {/* Toggle in top-right */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <span className={cn(
            'text-xs',
            !channel.configured ? 'text-muted-foreground/50' : channel.enabled ? 'text-cyber' : 'text-muted-foreground'
          )}>
            {channel.enabled ? t('channels.enabled') : t('channels.disabled')}
          </span>
          <ToggleSwitch
            enabled={channel.enabled}
            disabled={!channel.configured}
            disabledTitle={t('channels.configureFirst')}
            enabledTitle={t('channels.clickDisable')}
            disabledStateTitle={t('channels.clickEnable')}
            onChange={(v) => onToggle(channel, v)}
          />
        </div>
      </div>

      <div>
        <h3 className={cn('font-semibold text-sm', isActive ? 'text-foreground' : 'text-muted-foreground')}>
          {channel.name}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isActive ? t('channels.clickToEdit') : t('channels.notConfigured')}
        </p>
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-border/30">
        {isActive && (
          <span className="flex items-center gap-1 text-xs text-cyber font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber animate-pulse" />
            {t('channels.configured')}
          </span>
        )}
        <a
          href={docUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs text-muted-foreground hover:text-cyber transition-colors flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {t('channels.docs')} <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

function ChannelDrawer({
  channel,
  onClose,
  onSaved,
}: {
  channel: ChannelInfo;
  onClose: () => void;
  onSaved: (updated: ChannelInfo) => void;
}) {
  const { locale } = useI18nStore();
  const t = useT();
  const [fields, setFields] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    channel.fields.forEach((f: ChannelField) => { init[f.key] = f.value; });
    return init;
  });
  const [enabled, setEnabled] = useState(channel.enabled);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const docFile = DOC_FILES[channel.id] ?? '';
  const docUrl = (locale === 'zh' ? GITHUB_BASE_ZH : GITHUB_BASE_EN) + docFile;

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await updateChannel(channel.id, fields, enabled);
      setSaved(true);
      // Build updated channel object for immediate page refresh
      const updatedFields = channel.fields.map((f) => ({ ...f, value: fields[f.key] ?? f.value }));
      const anyFilled = updatedFields.some((f) => f.value.trim().length > 0);
      const updated: ChannelInfo = {
        ...channel,
        enabled,
        configured: enabled && anyFilled,
        fields: updatedFields,
      };
      setTimeout(() => {
        setSaved(false);
        onSaved(updated);
        onClose();
      }, 900);
    } catch (e: any) {
      setError(e.message || t('channels.saving'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60" onClick={onClose} />
      <div className="w-96 bg-background border-l border-border flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <span className={cn('text-xl', CHANNEL_COLORS[channel.id] || 'text-cyber')}>
              {CHANNEL_ICONS[channel.id] ?? <Globe className="w-5 h-5" />}
            </span>
            <div>
              <h2 className="font-semibold text-foreground">{channel.name}</h2>
              <p className="text-xs text-muted-foreground">{t('channels.channelConfig')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Enable toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/40">
            <div>
              <p className="text-sm font-medium text-foreground">{t('channels.enableChannel')}</p>
              <p className="text-xs text-muted-foreground">{t('channels.enableChannelDesc')}</p>
            </div>
            <ToggleSwitch enabled={enabled} onChange={setEnabled} />
          </div>

          {/* Fields */}
          {channel.fields.map((f: ChannelField) => (
            <div key={f.key} className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{f.label}</label>
              <input
                type={f.secret ? 'password' : 'text'}
                value={fields[f.key] ?? ''}
                onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })}
                placeholder={f.secret ? '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022' : f.label}
                className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyber/60 transition-colors"
              />
            </div>
          ))}

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Doc link */}
          <a
            href={docUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-cyber transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t('channels.viewDocs', { name: channel.name })}
          </a>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border">
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
              saved
                ? 'bg-green-500/20 border border-green-500/40 text-green-400'
                : 'bg-cyber/20 border border-cyber/40 text-cyber hover:bg-cyber/30'
            )}
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {t('channels.saving')}</>
            ) : saved ? (
              <><CheckCircle className="w-4 h-4" /> {t('channels.saved')}</>
            ) : (
              <><Save className="w-4 h-4" /> {t('channels.save')}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChannelsPage() {
  const t = useT();
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ChannelInfo | null>(null);
  // Track toggling state per channel to prevent double-clicks
  const togglingRef = useRef<Set<string>>(new Set());

  async function load() {
    setLoading(true);
    try {
      const data = await getChannels();
      setChannels(data.channels ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Immediate optimistic toggle on card, then sync to backend
  async function handleToggle(ch: ChannelInfo, enabled: boolean) {
    if (togglingRef.current.has(ch.id)) return;
    togglingRef.current.add(ch.id);
    // Optimistic update
    setChannels((prev) => prev.map((c) => c.id === ch.id ? { ...c, enabled } : c));
    try {
      const currentFields: Record<string, string> = {};
      ch.fields.forEach((f) => { currentFields[f.key] = f.value; });
      await updateChannel(ch.id, currentFields, enabled);
    } catch {
      // Rollback on error
      setChannels((prev) => prev.map((c) => c.id === ch.id ? { ...c, enabled: !enabled } : c));
    } finally {
      togglingRef.current.delete(ch.id);
    }
  }

  // Immediate update from drawer save without refetching
  function handleSaved(updated: ChannelInfo) {
    setChannels((prev) => prev.map((c) => c.id === updated.id ? updated : c));
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-xl font-semibold text-foreground">{t('channels.title')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t('channels.subtitle')}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-cyber" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 max-w-3xl">
            {channels.map((ch) => (
              <ChannelCard
                key={ch.id}
                channel={ch}
                onConfigure={setSelected}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <ChannelDrawer
          channel={selected}
          onClose={() => setSelected(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
