import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Materia,
  Aula,
  Anotacao,
  TipoAnotacao,
  EventoCalendario,
  MetaEstudo,
  SessaoEstudo,
  PerfilUsuario,
  MenuSection,
  StatusAula,
  ChecklistEstudo,
} from '../types';
import {
  initialPerfil,
  initialMaterias,
  initialAulas,
  initialAnotacoes,
  initialEventos,
  initialMetasEstudo,
  initialSessoesEstudo,
} from '../data/initialData';
import { deletePdfFromStorage } from '../utils/pdfStorage';
import { ensureAulaDefaults, DEFAULT_CHECKLIST } from '../utils/estudoTracking';

interface AppContextType {
  // Navigation
  activeSection: MenuSection;
  setActiveSection: (section: MenuSection) => void;
  selectedMateriaId: string | null;
  setSelectedMateriaId: (id: string | null) => void;
  selectedAulaId: string | null;
  setSelectedAulaId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Perfil
  perfil: PerfilUsuario;
  updatePerfil: (perfil: Partial<PerfilUsuario>) => void;

  // Matérias
  materias: Materia[];
  addMateria: (materia: Omit<Materia, 'id'>) => void;
  updateMateria: (id: string, materia: Partial<Materia>) => void;
  deleteMateria: (id: string) => void;

  // Aulas
  aulas: Aula[];
  addAula: (aula: Omit<Aula, 'id'>) => Aula;
  updateAula: (id: string, aula: Partial<Aula>) => void;
  deleteAula: (id: string) => void;
  updateAulaStatus: (id: string, status: StatusAula) => void;
  toggleAulaChecklistItem: (id: string, itemKey: keyof ChecklistEstudo) => void;

  // Anotações
  anotacoes: Anotacao[];
  addAnotacao: (anotacao: Omit<Anotacao, 'id'>) => void;
  updateAnotacao: (id: string, anotacao: Partial<Anotacao>) => void;
  deleteAnotacao: (id: string) => void;
  toggleFavoritoAnotacao: (id: string) => void;
  duplicarAnotacao: (id: string) => void;
  pendingNoteDraft: {
    aula?: Aula;
    initialTipo?: TipoAnotacao;
    disciplinaId?: string;
  } | null;
  setPendingNoteDraft: React.Dispatch<
    React.SetStateAction<{
      aula?: Aula;
      initialTipo?: TipoAnotacao;
      disciplinaId?: string;
    } | null>
  >;
  iniciarCriacaoAnotacaoDaAula: (aula: Aula, initialTipo?: TipoAnotacao) => void;

  // Integração com visualização de Aula
  selectedAulaIdToView: string | null;
  setSelectedAulaIdToView: (id: string | null) => void;
  selectedAulaTabToView: 'informacoes' | 'materiais' | 'anotacoes';
  setSelectedAulaTabToView: (tab: 'informacoes' | 'materiais' | 'anotacoes') => void;
  selectedAnotacaoIdToFocus: string | null;
  setSelectedAnotacaoIdToFocus: (id: string | null) => void;
  openAulaDetails: (
    aulaId: string,
    initialTab?: 'informacoes' | 'materiais' | 'anotacoes',
    targetAnotacaoId?: string
  ) => void;

  // Calendário
  eventos: EventoCalendario[];
  addEvento: (evento: Omit<EventoCalendario, 'id'>) => void;
  updateEvento: (id: string, evento: Partial<EventoCalendario>) => void;
  deleteEvento: (id: string) => void;
  toggleConcluidoEvento: (id: string) => void;

  // Estudos
  metas: MetaEstudo[];
  sessoes: SessaoEstudo[];
  addMetaEstudo: (meta: Omit<MetaEstudo, 'id'>) => void;
  updateMetaEstudo: (id: string, meta: Partial<MetaEstudo>) => void;
  deleteMetaEstudo: (id: string) => void;
  addSessaoEstudo: (sessao: Omit<SessaoEstudo, 'id'>) => void;
  updateSessaoEstudo: (id: string, sessaoData: Partial<SessaoEstudo>) => void;
  deleteSessaoEstudo: (id: string) => void;

  // Utilitários de dados
  resetarDadosParaPadrao: () => void;
  exportarDadosJson: () => string;
  importarDadosJson: (jsonString: string) => boolean;
}

const STORAGE_KEYS = {
  PERFIL: 'caderno_direito_perfil',
  MATERIAS: 'caderno_direito_materias',
  AULAS: 'caderno_direito_aulas',
  ANOTACOES: 'caderno_direito_anotacoes',
  EVENTOS: 'caderno_direito_eventos',
  METAS: 'caderno_direito_metas',
  SESSOES: 'caderno_direito_sessoes',
};

// Purge any legacy demo data from localStorage and initialize 3º semestre materias
if (typeof window !== 'undefined') {
  try {
    const savedPerfil = localStorage.getItem(STORAGE_KEYS.PERFIL);
    const savedMaterias = localStorage.getItem(STORAGE_KEYS.MATERIAS);
    const isMockData =
      (savedPerfil && (savedPerfil.includes('Lucas Silva') || savedPerfil.includes('Faculdade de Direito'))) ||
      (savedMaterias && (savedMaterias.includes('mat-1') || savedMaterias.includes('Helena Vasconcelos')));

    if (isMockData) {
      Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    }

    // Initialize with 3º semestre materias if storage is empty or outdated
    if (!savedMaterias || savedMaterias === '[]' || !savedMaterias.includes('Direito Empresarial II')) {
      localStorage.setItem(STORAGE_KEYS.MATERIAS, JSON.stringify(initialMaterias));
    }

    // Initialize with 3º semestre profile if missing or outdated
    if (!savedPerfil || !savedPerfil.includes('3º') || !savedPerfil.includes('Tarde')) {
      localStorage.setItem(STORAGE_KEYS.PERFIL, JSON.stringify(initialPerfil));
    }

    // Initialize with 2026/2 academic calendar if storage is empty or missing P1
    const savedEventos = localStorage.getItem(STORAGE_KEYS.EVENTOS);
    if (!savedEventos || savedEventos === '[]' || !savedEventos.includes('Aplicação da Prova P1')) {
      localStorage.setItem(STORAGE_KEYS.EVENTOS, JSON.stringify(initialEventos));
    }
  } catch (e) {
    console.error('Erro ao verificar dados de inicialização:', e);
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSection, setActiveSection] = useState<MenuSection>('dashboard');
  const [selectedMateriaId, setSelectedMateriaId] = useState<string | null>(null);
  const [selectedAulaId, setSelectedAulaId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Perfil
  const [perfil, setPerfil] = useState<PerfilUsuario>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PERFIL);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.semestreAtual) {
          return parsed;
        }
      }
      return initialPerfil;
    } catch {
      return initialPerfil;
    }
  });

  // Matérias
  const [materias, setMaterias] = useState<Materia[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MATERIAS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return initialMaterias;
    } catch {
      return initialMaterias;
    }
  });

  // Aulas
  const [aulas, setAulas] = useState<Aula[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AULAS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(ensureAulaDefaults);
        }
      }
      return initialAulas.map(ensureAulaDefaults);
    } catch {
      return initialAulas.map(ensureAulaDefaults);
    }
  });

  // Anotações
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ANOTACOES);
      return saved ? JSON.parse(saved) : initialAnotacoes;
    } catch {
      return initialAnotacoes;
    }
  });

  // Eventos de calendário
  const [eventos, setEventos] = useState<EventoCalendario[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EVENTOS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && JSON.stringify(parsed).includes('Aplicação da Prova P1')) {
          return parsed;
        }
      }
      return initialEventos;
    } catch {
      return initialEventos;
    }
  });

  // Metas
  const [metas, setMetas] = useState<MetaEstudo[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.METAS);
      return saved ? JSON.parse(saved) : initialMetasEstudo;
    } catch {
      return initialMetasEstudo;
    }
  });

  // Sessões
  const [sessoes, setSessoes] = useState<SessaoEstudo[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SESSOES);
      return saved ? JSON.parse(saved) : initialSessoesEstudo;
    } catch {
      return initialSessoesEstudo;
    }
  });

  // Anotações & Aulas state bridging
  const [pendingNoteDraft, setPendingNoteDraft] = useState<{
    aula?: Aula;
    initialTipo?: TipoAnotacao;
    disciplinaId?: string;
  } | null>(null);

  const [selectedAulaIdToView, setSelectedAulaIdToView] = useState<string | null>(null);
  const [selectedAulaTabToView, setSelectedAulaTabToView] = useState<'informacoes' | 'materiais' | 'anotacoes'>('informacoes');
  const [selectedAnotacaoIdToFocus, setSelectedAnotacaoIdToFocus] = useState<string | null>(null);

  // Migração e compatibilidade automática de anotações pré-existentes
  useEffect(() => {
    if (anotacoes.length > 0 && aulas.length > 0) {
      let modificado = false;
      const sincronizadas = anotacoes.map((nota) => {
        // 1. Se já possui aulaRelacionadaId, assegura que o título da aula está atualizado
        if (nota.aulaRelacionadaId) {
          const aulaCorrespondente = aulas.find((a) => a.id === nota.aulaRelacionadaId);
          if (aulaCorrespondente && nota.aulaRelacionadaTitulo !== aulaCorrespondente.titulo) {
            modificado = true;
            return {
              ...nota,
              aulaRelacionadaTitulo: aulaCorrespondente.titulo,
              disciplina: aulaCorrespondente.disciplina,
            };
          }
          return nota;
        }

        // 2. Se não possui aulaRelacionadaId, busca aula da mesma matéria e mesma data
        const aulaMesmaDataEMateria = aulas.find(
          (a) => a.materiaId === nota.disciplinaId && a.data === nota.data
        );
        if (aulaMesmaDataEMateria) {
          modificado = true;
          return {
            ...nota,
            aulaRelacionadaId: aulaMesmaDataEMateria.id,
            aulaRelacionadaTitulo: aulaMesmaDataEMateria.titulo,
            disciplina: aulaMesmaDataEMateria.disciplina,
            professor: aulaMesmaDataEMateria.professor || nota.professor,
          };
        }

        return nota;
      });

      if (modificado) {
        setAnotacoes(sincronizadas);
      }
    }
  }, [aulas]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PERFIL, JSON.stringify(perfil));
    } catch (e) {
      console.error(e);
    }
  }, [perfil]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MATERIAS, JSON.stringify(materias));
    } catch (e) {
      console.error(e);
    }
  }, [materias]);

  useEffect(() => {
    try {
      const sanitizedAulas = aulas.map(aula => {
        if (aula.materialPdf && aula.materialPdf.url && aula.materialPdf.url.startsWith('data:')) {
          return {
            ...aula,
            materialPdf: {
              ...aula.materialPdf,
              url: ''
            }
          };
        }
        return aula;
      });
      localStorage.setItem(STORAGE_KEYS.AULAS, JSON.stringify(sanitizedAulas));
    } catch (e) {
      console.error('Erro ao salvar aulas no localStorage:', e);
      try {
        localStorage.removeItem(STORAGE_KEYS.AULAS);
      } catch {}
    }
  }, [aulas]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ANOTACOES, JSON.stringify(anotacoes));
    } catch (e) {
      console.error(e);
    }
  }, [anotacoes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EVENTOS, JSON.stringify(eventos));
    } catch (e) {
      console.error(e);
    }
  }, [eventos]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.METAS, JSON.stringify(metas));
    } catch (e) {
      console.error(e);
    }
  }, [metas]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSOES, JSON.stringify(sessoes));
    } catch (e) {
      console.error(e);
    }
  }, [sessoes]);

  // Actions
  const updatePerfil = (newValues: Partial<PerfilUsuario>) => {
    setPerfil((prev) => ({ ...prev, ...newValues }));
  };

  const addMateria = (materiaData: Omit<Materia, 'id'>) => {
    const newMateria: Materia = {
      ...materiaData,
      id: `mat-${Date.now()}`,
    };
    setMaterias((prev) => [newMateria, ...prev]);
  };

  const updateMateria = (id: string, materiaData: Partial<Materia>) => {
    setMaterias((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...materiaData } : m))
    );
  };

  const deleteMateria = (id: string) => {
    setMaterias((prev) => prev.filter((m) => m.id !== id));
  };

  const addAula = (aulaData: Omit<Aula, 'id'>) => {
    const newAula: Aula = ensureAulaDefaults({
      ...aulaData,
      id: `aula-${Date.now()}`,
      status: aulaData.status || 'nao_iniciada',
      checklist: aulaData.checklist || { ...DEFAULT_CHECKLIST },
    });
    setAulas((prev) => [newAula, ...prev]);
    // Also optionally add to calendar as an aula event
    const newEvento: EventoCalendario = {
      id: `ev-aula-${Date.now()}`,
      titulo: `Aula: ${aulaData.titulo}`,
      tipo: 'aula',
      data: aulaData.data,
      horario: aulaData.horario,
      disciplinaId: aulaData.materiaId,
      disciplina: aulaData.disciplina,
      descricao: aulaData.conteudo.slice(0, 100),
      concluido: false,
    };
    setEventos((prev) => [newEvento, ...prev]);
    return newAula;
  };

  const updateAula = (id: string, aulaData: Partial<Aula>) => {
    setAulas((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...aulaData } : a))
    );
  };

  const updateAulaStatus = (id: string, status: StatusAula) => {
    setAulas((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  };

  const toggleAulaChecklistItem = (id: string, itemKey: keyof ChecklistEstudo) => {
    setAulas((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const currentChecklist = a.checklist || { ...DEFAULT_CHECKLIST };
        return {
          ...a,
          checklist: {
            ...currentChecklist,
            [itemKey]: !currentChecklist[itemKey],
          },
        };
      })
    );
  };

  const deleteAula = (id: string) => {
    const aulaToDelete = aulas.find((a) => a.id === id);
    if (aulaToDelete?.materialPdf?.storageId) {
      deletePdfFromStorage(aulaToDelete.materialPdf.storageId).catch((err) => {
        console.error('Erro ao excluir PDF associado:', err);
      });
    }
    setAulas((prev) => prev.filter((a) => a.id !== id));
  };

  const addAnotacao = (anotacaoData: Omit<Anotacao, 'id'>) => {
    const nowIso = new Date().toISOString();
    const newAnotacao: Anotacao = {
      ...anotacaoData,
      id: `not-${Date.now()}`,
      tipo: anotacaoData.tipo || 'livre',
      createdAt: anotacaoData.createdAt || nowIso,
      updatedAt: nowIso,
      ultimaModificacao: nowIso.slice(0, 16).replace('T', ' '),
    };
    setAnotacoes((prev) => [newAnotacao, ...prev]);
  };

  const updateAnotacao = (id: string, anotacaoData: Partial<Anotacao>) => {
    const nowIso = new Date().toISOString();
    setAnotacoes((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              ...anotacaoData,
              updatedAt: nowIso,
              ultimaModificacao: nowIso.slice(0, 16).replace('T', ' '),
            }
          : a
      )
    );
  };

  const deleteAnotacao = (id: string) => {
    setAnotacoes((prev) => prev.filter((a) => a.id !== id));
  };

  const toggleFavoritoAnotacao = (id: string) => {
    setAnotacoes((prev) =>
      prev.map((a) => (a.id === id ? { ...a, favorito: !a.favorito } : a))
    );
  };

  const duplicarAnotacao = (id: string) => {
    const original = anotacoes.find((a) => a.id === id);
    if (!original) return;
    const nowIso = new Date().toISOString();
    const cloned: Anotacao = {
      ...original,
      id: `not-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      titulo: `${original.titulo} (Cópia)`,
      favorito: false,
      createdAt: nowIso,
      updatedAt: nowIso,
      ultimaModificacao: nowIso.slice(0, 16).replace('T', ' '),
      quadros: original.quadros
        ? original.quadros.map((q) => ({
            ...q,
            id: `quadro-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          }))
        : undefined,
      mapaMental: original.mapaMental
        ? JSON.parse(JSON.stringify(original.mapaMental))
        : undefined,
    };
    setAnotacoes((prev) => [cloned, ...prev]);
  };

  const iniciarCriacaoAnotacaoDaAula = (aula: Aula, initialTipo?: TipoAnotacao) => {
    setSelectedAulaIdToView(aula.id);
    setSelectedAulaTabToView('anotacoes');
    setPendingNoteDraft({
      aula,
      initialTipo: initialTipo || 'livre',
      disciplinaId: aula.materiaId,
    });
    setActiveSection('aulas');
  };

  const openAulaDetails = (
    aulaId: string,
    initialTab: 'informacoes' | 'materiais' | 'anotacoes' = 'informacoes',
    targetAnotacaoId?: string
  ) => {
    setSelectedAulaIdToView(aulaId);
    setSelectedAulaTabToView(initialTab);
    if (targetAnotacaoId) {
      setSelectedAnotacaoIdToFocus(targetAnotacaoId);
    }
    setActiveSection('aulas');
  };

  const addEvento = (eventoData: Omit<EventoCalendario, 'id'>) => {
    const newEvento: EventoCalendario = {
      ...eventoData,
      id: `ev-${Date.now()}`,
      concluido: false,
    };
    setEventos((prev) => [newEvento, ...prev]);
  };

  const updateEvento = (id: string, eventoData: Partial<EventoCalendario>) => {
    setEventos((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...eventoData } : e))
    );
  };

  const deleteEvento = (id: string) => {
    setEventos((prev) => prev.filter((e) => e.id !== id));
  };

  const toggleConcluidoEvento = (id: string) => {
    setEventos((prev) =>
      prev.map((e) => (e.id === id ? { ...e, concluido: !e.concluido } : e))
    );
  };

  const addMetaEstudo = (metaData: Omit<MetaEstudo, 'id'>) => {
    const newMeta: MetaEstudo = {
      ...metaData,
      id: `meta-${Date.now()}`,
    };
    setMetas((prev) => [...prev, newMeta]);
  };

  const updateMetaEstudo = (id: string, metaData: Partial<MetaEstudo>) => {
    setMetas((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...metaData } : m))
    );
  };

  const deleteMetaEstudo = (id: string) => {
    setMetas((prev) => prev.filter((m) => m.id !== id));
  };

  const addSessaoEstudo = (sessaoData: Omit<SessaoEstudo, 'id'>) => {
    const newSessao: SessaoEstudo = {
      ...sessaoData,
      id: `sess-${Date.now()}`,
    };
    setSessoes((prev) => [newSessao, ...prev]);
  };

  const updateSessaoEstudo = (id: string, sessaoData: Partial<SessaoEstudo>) => {
    setSessoes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...sessaoData } : s))
    );
  };

  const deleteSessaoEstudo = (id: string) => {
    setSessoes((prev) => prev.filter((s) => s.id !== id));
  };

  const resetarDadosParaPadrao = () => {
    setPerfil(initialPerfil);
    setMaterias(initialMaterias);
    setAulas(initialAulas);
    setAnotacoes(initialAnotacoes);
    setEventos(initialEventos);
    setMetas(initialMetasEstudo);
    setSessoes(initialSessoesEstudo);
  };

  const exportarDadosJson = () => {
    const payload = {
      perfil,
      materias,
      aulas,
      anotacoes,
      eventos,
      metas,
      sessoes,
      exportadoEm: new Date().toISOString(),
      versao: '1.0',
    };
    return JSON.stringify(payload, null, 2);
  };

  const importarDadosJson = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.perfil) setPerfil(data.perfil);
      if (Array.isArray(data.materias)) setMaterias(data.materias);
      if (Array.isArray(data.aulas)) setAulas(data.aulas);
      if (Array.isArray(data.anotacoes)) setAnotacoes(data.anotacoes);
      if (Array.isArray(data.eventos)) setEventos(data.eventos);
      if (Array.isArray(data.metas)) setMetas(data.metas);
      if (Array.isArray(data.sessoes)) setSessoes(data.sessoes);
      return true;
    } catch (err) {
      console.error('Falha ao importar dados:', err);
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeSection,
        setActiveSection,
        selectedMateriaId,
        setSelectedMateriaId,
        selectedAulaId,
        setSelectedAulaId,
        searchQuery,
        setSearchQuery,
        perfil,
        updatePerfil,
        materias,
        addMateria,
        updateMateria,
        deleteMateria,
        aulas,
        addAula,
        updateAula,
        deleteAula,
        updateAulaStatus,
        toggleAulaChecklistItem,
        anotacoes,
        addAnotacao,
        updateAnotacao,
        deleteAnotacao,
        toggleFavoritoAnotacao,
        duplicarAnotacao,
        pendingNoteDraft,
        setPendingNoteDraft,
        iniciarCriacaoAnotacaoDaAula,
        selectedAulaIdToView,
        setSelectedAulaIdToView,
        selectedAulaTabToView,
        setSelectedAulaTabToView,
        selectedAnotacaoIdToFocus,
        setSelectedAnotacaoIdToFocus,
        openAulaDetails,
        eventos,
        addEvento,
        updateEvento,
        deleteEvento,
        toggleConcluidoEvento,
        metas,
        sessoes,
        addMetaEstudo,
        updateMetaEstudo,
        deleteMetaEstudo,
        addSessaoEstudo,
        updateSessaoEstudo,
        deleteSessaoEstudo,
        resetarDadosParaPadrao,
        exportarDadosJson,
        importarDadosJson,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser usado dentro de um AppProvider');
  }
  return context;
};
