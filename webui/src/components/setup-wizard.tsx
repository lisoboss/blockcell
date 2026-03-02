import { CheckCircle2, Zap, X, Settings, User } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { useSidebarStore } from '@/lib/store';

interface SetupWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function SetupWizard({ onComplete, onSkip }: SetupWizardProps) {
  const t = useT();
  const { setActivePage } = useSidebarStore();

  function handleFinish() {
    localStorage.setItem('blockcell_wizard_done', '1');
    onComplete();
  }

  function navigateToLLM() {
    localStorage.setItem('blockcell_wizard_done', '1');
    setActivePage('llm');
    onComplete();
  }

  function navigateToPersona() {
    localStorage.setItem('blockcell_wizard_done', '1');
    setActivePage('persona');
    onComplete();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-border">
          <button
            onClick={onSkip}
            className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-accent text-muted-foreground"
            title={t('wizard.skip')}
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-base">{t('wizard.title')}</h2>
              <p className="text-xs text-muted-foreground">{t('wizard.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('wizard.step0.title')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('wizard.step0.desc')}</p>
            
            {/* Quick setup hints */}
            <div className="mt-6 space-y-3">
              <button
                onClick={navigateToLLM}
                className="w-full flex items-start gap-3 p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 text-left transition-all group"
              >
                <div className="mt-0.5 shrink-0">
                  <Settings size={20} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm mb-1">{t('wizard.setupLLM')}</div>
                  <p className="text-xs text-muted-foreground">{t('wizard.setupLLMDesc')}</p>
                </div>
              </button>

              <button
                onClick={navigateToPersona}
                className="w-full flex items-start gap-3 p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 text-left transition-all group"
              >
                <div className="mt-0.5 shrink-0">
                  <User size={20} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm mb-1">{t('wizard.setupPersona')}</div>
                  <p className="text-xs text-muted-foreground">{t('wizard.setupPersonaDesc')}</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between">
          <button
            onClick={onSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('wizard.skip')}
          </button>
          <button
            onClick={handleFinish}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          >
            {t('wizard.finish')}
            <CheckCircle2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
