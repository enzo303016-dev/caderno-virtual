import React from 'react';
import { Menu, Search, Plus, BookOpen, GraduationCap } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onQuickNewNote: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu, onQuickNewNote }) => {
  const { perfil, activeSection, searchQuery, setSearchQuery } = useApp();

  const sectionTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Visão Geral dos Estudos',
      subtitle: 'Acompanhe seu semestre, aulas e anotações jurídicas',
    },
    semestre: {
      title: 'Meu Semestre',
      subtitle: 'Disciplinas em andamento, cronograma semanal e avaliações',
    },
    materias: {
      title: 'Matérias',
      subtitle: 'Gestão de disciplinas, professores, salas e horários',
    },
    aulas: {
      title: 'Registro de Aulas',
      subtitle: 'Aulas ministradas, resumos de conteúdos e observações',
    },
    anotacoes: {
      title: 'Anotações & Fichamentos',
      subtitle: 'Caderno de resumos, jurisprudência e conceitos fundamentais',
    },
    calendario: {
      title: 'Calendário Acadêmico',
      subtitle: 'Provas, prazos, entregas de trabalhos e sessões de estudo',
    },
    estudos: {
      title: 'Plano de Estudos',
      subtitle: 'Vade Mecum, leitura de doutrina, jurisprudência e metas',
    },
    configuracoes: {
      title: 'Configurações',
      subtitle: 'Dados acadêmicos, backup e preferências do caderno',
    },
  };

  const currentInfo = sectionTitles[activeSection] || {
    title: 'Caderno Virtual',
    subtitle: 'Estudos de Direito',
  };

  return (
    <header
      id="app-header"
      className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-stone-200 px-4 sm:px-8 py-3.5"
    >
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left: Mobile trigger & Page Title */}
        <div className="flex items-center gap-3">
          <button
            id="mobile-menu-toggle-btn"
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2
                id="current-section-title"
                className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight font-serif"
              >
                {currentInfo.title}
              </h2>
              {perfil.semestreAtual ? (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  <GraduationCap className="w-3 h-3" />
                  {perfil.semestreAtual}
                </span>
              ) : null}
            </div>
            <p className="hidden md:block text-xs text-stone-500">
              {currentInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Search, Quick Action, Profile Pill */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global search input */}
          <div className="relative hidden md:block w-48 lg:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              id="global-search-input"
              type="text"
              placeholder="Buscar notas, matérias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Quick Note Button */}
          <button
            id="quick-add-note-btn"
            type="button"
            onClick={onQuickNewNote}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nova Anotação</span>
            <span className="sm:hidden">Nota</span>
          </button>

          {/* User Badge */}
          <div
            id="user-profile-badge"
            className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-stone-200"
          >
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-xs flex items-center justify-center font-serif">
              {perfil.nome?.trim()
                ? perfil.nome
                    .trim()
                    .split(/\s+/)
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()
                : 'U'}
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-bold text-stone-800 leading-none">
                {perfil.nome || 'Meu Caderno'}
              </div>
              <div className="text-[10px] text-stone-500 leading-tight">
                {perfil.curso || perfil.instituicao || 'Direito'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
