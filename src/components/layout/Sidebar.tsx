import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Presentation,
  FileText,
  Calendar,
  Compass,
  Settings,
  Scale,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MenuSection } from '../../types';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

interface MenuItem {
  id: MenuSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { activeSection, setActiveSection, materias, aulas, anotacoes, eventos, setSelectedMateriaId, setSelectedAulaIdToView } = useApp();

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'semestre', label: 'Meu Semestre', icon: GraduationCap },
    { id: 'materias', label: 'Matérias', icon: BookOpen, badge: materias.length },
    { id: 'calendario', label: 'Calendário', icon: Calendar, badge: eventos.length },
    { id: 'estudos', label: 'Estudos', icon: Compass },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  const handleSelect = (sectionId: MenuSection) => {
    setActiveSection(sectionId);
    setSelectedMateriaId(null);
    setSelectedAulaIdToView(null);
    setMobileOpen(false);
  };

  const navContent = (
    <div className="flex flex-col h-full bg-stone-900 text-stone-100">
      {/* Brand / Logo */}
      <div className="p-6 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white font-serif">
              Caderno Virtual
            </h1>
            <p className="text-xs text-amber-400 font-medium tracking-wide uppercase">
              Direito & Legislação
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800"
          aria-label="Fechar menu lateral"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-stone-400 uppercase">
          Menu Principal
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              type="button"
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-amber-600 text-white font-semibold shadow-md shadow-amber-900/20'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-white' : 'text-stone-400 group-hover:text-stone-200'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-amber-700/80 text-white'
                      : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-stone-800 bg-stone-950/40 text-xs text-stone-400">
        <div className="flex items-center justify-between">
          <span className="font-serif italic text-stone-300">Iustitia et Ratio</span>
          <span className="text-[10px] bg-stone-800 text-stone-400 px-2 py-0.5 rounded">
            v1.0
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside
        id="desktop-sidebar"
        className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 z-30 border-r border-stone-800 shadow-xl"
      >
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          id="mobile-sidebar-backdrop"
          className="lg:hidden fixed inset-0 z-40 bg-stone-900/70 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        id="mobile-sidebar"
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {navContent}
      </aside>
    </>
  );
};
