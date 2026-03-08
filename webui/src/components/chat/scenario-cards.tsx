import { FileText, Mic, Presentation, Table2, Globe, TrendingUp } from 'lucide-react';
import { useT } from '@/lib/i18n';

interface Scenario {
  id: string;
  icon: React.ReactNode;
  titleKey: string;
  descKey: string;
  examplesKey: string[];
  color: string;
}

const scenarios: Scenario[] = [
  {
    id: 'meeting',
    icon: <Mic size={20} />,
    titleKey: 'scenario.meeting.title',
    descKey: 'scenario.meeting.desc',
    examplesKey: ['scenario.meeting.ex1', 'scenario.meeting.ex2', 'scenario.meeting.ex3'],
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  },
  {
    id: 'report',
    icon: <FileText size={20} />,
    titleKey: 'scenario.report.title',
    descKey: 'scenario.report.desc',
    examplesKey: ['scenario.report.ex1', 'scenario.report.ex2', 'scenario.report.ex3'],
    color: 'text-[hsl(var(--brand-green))] bg-[hsl(var(--brand-green)/0.10)] border-[hsl(var(--brand-green)/0.20)]',
  },
  {
    id: 'ppt',
    icon: <Presentation size={20} />,
    titleKey: 'scenario.ppt.title',
    descKey: 'scenario.ppt.desc',
    examplesKey: ['scenario.ppt.ex1', 'scenario.ppt.ex2', 'scenario.ppt.ex3'],
    color: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  },
  {
    id: 'table',
    icon: <Table2 size={20} />,
    titleKey: 'scenario.table.title',
    descKey: 'scenario.table.desc',
    examplesKey: ['scenario.table.ex1', 'scenario.table.ex2', 'scenario.table.ex3'],
    color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  },
  {
    id: 'research',
    icon: <Globe size={20} />,
    titleKey: 'scenario.research.title',
    descKey: 'scenario.research.desc',
    examplesKey: ['scenario.research.ex1', 'scenario.research.ex2', 'scenario.research.ex3'],
    color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  },
  {
    id: 'finance',
    icon: <TrendingUp size={20} />,
    titleKey: 'scenario.finance.title',
    descKey: 'scenario.finance.desc',
    examplesKey: ['scenario.finance.ex1', 'scenario.finance.ex2', 'scenario.finance.ex3'],
    color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  },
];

interface ScenarioCardsProps {
  onSelectExample: (text: string) => void;
}

export function ScenarioCards({ onSelectExample }: ScenarioCardsProps) {
  const t = useT();

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-6">
      <p className="text-xs text-muted-foreground text-center mb-4 uppercase tracking-wider">
        {t('scenario.hint')}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {scenarios.map((s) => (
          <div
            key={s.id}
            className={`border rounded-xl p-4 bg-card/50 backdrop-blur-sm transition-all hover:scale-[1.01] ${s.color}`}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <span className="shrink-0">{s.icon}</span>
              <span className="font-semibold text-sm text-foreground">{t(s.titleKey)}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{t(s.descKey)}</p>
            {/* Example buttons */}
            <div className="space-y-1.5">
              {s.examplesKey.map((exKey) => (
                <button
                  key={exKey}
                  onClick={() => onSelectExample(t(exKey))}
                  className="w-full text-left text-xs px-3 py-1.5 rounded-lg bg-background/60 hover:bg-background border border-border/60 hover:border-border text-foreground/80 hover:text-foreground transition-all truncate"
                >
                  ↗ {t(exKey)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
