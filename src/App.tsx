import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { MeuSemestreView } from './components/semestre/MeuSemestreView';
import { MateriasView } from './components/materias/MateriasView';
import { AulasView } from './components/aulas/AulasView';
import { AnotacoesView } from './components/anotacoes/AnotacoesView';
import { CalendarioView } from './components/calendario/CalendarioView';
import { EstudosView } from './components/estudos/EstudosView';
import { ConfiguracoesView } from './components/configuracoes/ConfiguracoesView';
import { Modal } from './components/common/Modal';

const AppContent: React.FC = () => {
  const { activeSection, setActiveSection, materias, addAnotacao } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Quick note modal state
  const [isQuickNoteOpen, setIsQuickNoteOpen] = useState(false);
  const [quickNoteData, setQuickNoteData] = useState({
    titulo: '',
    disciplinaId: materias[0]?.id || '',
    disciplina: materias[0]?.nome || '',
    conteudo: '',
    tagsInput: 'Rápida, Resumo',
  });

  const handleOpenQuickNote = () => {
    const defaultMateria = materias[0];
    setQuickNoteData({
      titulo: '',
      disciplinaId: defaultMateria?.id || '',
      disciplina: defaultMateria?.nome || '',
      conteudo: '',
      tagsInput: 'Rápida, Resumo',
    });
    setIsQuickNoteOpen(true);
  };

  const handleSaveQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    const materia = materias.find((m) => m.id === quickNoteData.disciplinaId);
    const tagsArray = quickNoteData.tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    addAnotacao({
      titulo: quickNoteData.titulo,
      disciplinaId: quickNoteData.disciplinaId,
      disciplina: materia ? materia.nome : quickNoteData.disciplina,
      conteudo: quickNoteData.conteudo,
      data: new Date().toISOString().split('T')[0],
      tags: tagsArray,
      favorito: false,
    });

    setIsQuickNoteOpen(false);
    setActiveSection('anotacoes');
  };

  const renderActiveView = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigate={(sec) => setActiveSection(sec)}
            onOpenNewNote={handleOpenQuickNote}
            onOpenNewClass={() => setActiveSection('aulas')}
          />
        );
      case 'semestre':
        return <MeuSemestreView />;
      case 'materias':
        return <MateriasView />;
      case 'aulas':
        return <AulasView />;
      case 'anotacoes':
        return <AnotacoesView />;
      case 'calendario':
        return <CalendarioView />;
      case 'estudos':
        return <EstudosView />;
      case 'configuracoes':
        return <ConfiguracoesView />;
      default:
        return (
          <DashboardView
            onNavigate={(sec) => setActiveSection(sec)}
            onOpenNewNote={handleOpenQuickNote}
            onOpenNewClass={() => setActiveSection('aulas')}
          />
        );
    }
  };

  return (
    <div id="app-root-layout" className="min-h-screen bg-stone-50 text-stone-800 flex">
      {/* Sidebar for Desktop and Drawer for Mobile */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Top Header */}
        <Header
          onOpenMobileMenu={() => setMobileOpen(true)}
          onQuickNewNote={handleOpenQuickNote}
        />

        {/* Dynamic Section Content */}
        <main
          id="main-content-area"
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto"
        >
          {renderActiveView()}
        </main>
      </div>

      {/* Quick Add Note Modal */}
      <Modal
        isOpen={isQuickNoteOpen}
        onClose={() => setIsQuickNoteOpen(false)}
        title="Criar Anotação Rápida"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveQuickNote} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Título da Anotação *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Ponto de prova, conceito de supressio..."
              value={quickNoteData.titulo}
              onChange={(e) =>
                setQuickNoteData({ ...quickNoteData, titulo: e.target.value })
              }
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Disciplina
              </label>
              <select
                value={quickNoteData.disciplinaId}
                onChange={(e) =>
                  setQuickNoteData({
                    ...quickNoteData,
                    disciplinaId: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
              >
                {materias.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Tags (separadas por vírgula)
              </label>
              <input
                type="text"
                value={quickNoteData.tagsInput}
                onChange={(e) =>
                  setQuickNoteData({
                    ...quickNoteData,
                    tagsInput: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Conteúdo Jurídico *
            </label>
            <textarea
              rows={5}
              required
              placeholder="Digite sua anotação ou resumo..."
              value={quickNoteData.conteudo}
              onChange={(e) =>
                setQuickNoteData({ ...quickNoteData, conteudo: e.target.value })
              }
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setIsQuickNoteOpen(false)}
              className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg font-medium text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs shadow-xs"
            >
              Salvar Anotação
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
