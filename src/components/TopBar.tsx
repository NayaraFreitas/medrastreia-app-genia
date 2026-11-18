import { RotateCcw } from 'lucide-react';
import { ActiveTab } from '../types/medrastreia';

interface TopBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onResetDemo: () => void;
  pendingAtendimentoCount: number;
  pendingQualidadeCount: number;
}

export function TopBar({
  activeTab,
  onTabChange,
  onResetDemo,
  pendingAtendimentoCount,
  pendingQualidadeCount,
}: TopBarProps) {
  const navItems: Array<{ id: ActiveTab; label: string; count?: number }> = [
    {
      id: 'atendimento',
      label: 'Atendimento & Triagem',
      count: pendingAtendimentoCount,
    },
    {
      id: 'qualidade',
      label: 'Qualidade — Fila de Laudos (Louveira)',
      count: pendingQualidadeCount,
    },
    {
      id: 'governanca',
      label: 'Governança & Eficiência',
    },
  ];

  return (
    <header className="bg-[#1B365D] text-white border-b border-[#132847]">
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zona 1: Brand Title (single text element, one line) */}
        <div className="flex items-center gap-3 shrink-0">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect x="2" y="2" width="20" height="20" rx="4" stroke="white" strokeWidth="1.75" />
            <path
              d="M7 14.5L10.2 11.3L12.8 13.8L17 9"
              stroke="#93C5FD"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="17" cy="9" r="1.5" fill="#93C5FD" />
          </svg>
          <span className="text-lg font-bold tracking-tight whitespace-nowrap shrink-0">
            MedRastreia
          </span>
        </div>

        {/* Zona 2: 3 abas principais */}
        <nav
          aria-label="Navegação principal"
          className="flex items-center gap-6 overflow-x-auto h-full"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`relative h-full flex items-center gap-2 text-sm whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                  isActive
                    ? 'text-white font-semibold'
                    : 'text-slate-300 font-medium hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                {typeof item.count === 'number' && (
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      isActive ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    ({item.count})
                  </span>
                )}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-white"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zona 3: 1 ação primária */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onResetDemo}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#1B365D] bg-white rounded-md hover:bg-slate-100 transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar Demo</span>
          </button>
        </div>
      </div>
    </header>
  );
}
