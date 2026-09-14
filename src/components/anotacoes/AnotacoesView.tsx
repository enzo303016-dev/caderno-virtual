import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  LayoutGrid,
  GitBranch,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Star,
  Tag,
  Search,
  BookOpen,
  Calendar,
  Link2,
  ExternalLink,
  Video,
  X,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Anotacao, TipoAnotacao, Aula } from '../../types';
import { AnotacaoFormModal } from './AnotacaoFormModal';
import { AnotacaoVisualizadorModal } from './AnotacaoVisualizadorModal';
import { Modal } from '../common/Modal';
import { getPdfFromStorage } from '../../utils/pdfStorage';

export const AnotacoesView: React.FC = () => {
  const {
    anotacoes,
    materias,
    aulas,
    addAnotacao,
    updateAnotacao,
    deleteAnotacao,
    toggleFavoritoAnotacao,
    duplicarAnotacao,
    pendingNoteDraft,
    setPendingNoteDraft,
    openAulaDetails,
    setActiveSection,
  } = useApp();

  // Filtros e busca
  const [busca, setBusca] = useState('');
  const [materiaFiltro, setMateriaFiltro] = useState<string>('todas');
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos');
  const [apenasFavoritas, setApenasFavoritas] = useState(false);
  const [tagFiltro, setTagFiltro] = useState<string | null>(null);

  // Estados de Modais
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAnotacao, setEditingAnotacao] = useState<Anotacao | null>(null);
  const [activeDraft, setActiveDraft] = useState<{
    aula?: Aula;
    initialTipo?: TipoAnotacao;
    disciplinaId?: string;
  } | null>(null);

  // Modal de visualização completa para estudo
  const [viewingAnotacao, setViewingAnotacao] = useState<Anotacao | null>(null);

  // Modal de PDF da aula relacionada
  const [pdfPreviewData, setPdfPreviewData] = useState<{
    url: string;
    nome: string;
  } | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  // Integração com "Criar anotação desta aula" (Requisito 14)
  useEffect(() => {
    if (pendingNoteDraft) {
      setEditingAnotacao(null);
      setActiveDraft(pendingNoteDraft);
      setIsFormModalOpen(true);
      setPendingNoteDraft(null); // Consome o rascunho
    }
  }, [pendingNoteDraft, setPendingNoteDraft]);

  // Coleta de todas as tags únicas criadas pelo usuário
  const todasTags = useMemo(() => {
    return Array.from(new Set(anotacoes.flatMap((a) => a.tags || []))).filter(Boolean);
  }, [anotacoes]);

  // Abertura do modal de criação com escolha de tipo
  const handleOpenCreate = (formatoDesejado: TipoAnotacao = 'livre') => {
    setEditingAnotacao(null);
    setActiveDraft({ initialTipo: formatoDesejado });
    setIsFormModalOpen(true);
  };

  // Abertura para edição de anotação existente
  const handleOpenEdit = (nota: Anotacao) => {
    setEditingAnotacao(nota);
    setActiveDraft(null);
    setIsFormModalOpen(true);
  };

  // Salvamento (criação ou edição)
  const handleSaveAnotacao = (anotacaoData: Omit<Anotacao, 'id'>) => {
    if (editingAnotacao) {
      updateAnotacao(editingAnotacao.id, anotacaoData);
      // Se estava aberta no visualizador, atualiza
      if (viewingAnotacao?.id === editingAnotacao.id) {
        setViewingAnotacao({
          ...editingAnotacao,
          ...anotacaoData,
        });
      }
    } else {
      addAnotacao(anotacaoData);
    }
    setIsFormModalOpen(false);
    setEditingAnotacao(null);
    setActiveDraft(null);
  };

  // Exclusão com confirmação (Requisito 10)
  const handleDeleteAnotacao = (id: string, titulo: string) => {
    if (window.confirm(`Deseja excluir permanentemente a anotação "${titulo}"?\n\n(A aula vinculada e seus arquivos não serão excluídos).`)) {
      deleteAnotacao(id);
      if (viewingAnotacao?.id === id) {
        setViewingAnotacao(null);
      }
    }
  };

  // Duplicação de anotação
  const handleDuplicar = (id: string) => {
    duplicarAnotacao(id);
  };

  // Visualização de PDF associado à aula da anotação
  const handleAbrirPdfAula = async (aula: Aula) => {
    if (!aula.materialPdf) return;
    if (aula.materialPdf.url) {
      setPdfPreviewData({ url: aula.materialPdf.url, nome: aula.materialPdf.nome });
      return;
    }
    if (aula.materialPdf.storageId) {
      setLoadingPdf(true);
      try {
        const item = await getPdfFromStorage(aula.materialPdf.storageId);
        if (item?.dataUrl) {
          setPdfPreviewData({ url: item.dataUrl, nome: item.nome });
        } else {
          alert('Arquivo PDF não encontrado no armazenamento local deste dispositivo.');
        }
      } catch (err) {
        console.error('Erro ao abrir PDF:', err);
        alert('Não foi possível carregar o arquivo PDF.');
      } finally {
        setLoadingPdf(false);
      }
    }
  };

  // Filtragem e ordenação por atualização mais recente (Requisito 6)
  const notasFiltradas = useMemo(() => {
    const q = busca.toLowerCase().trim();

    return anotacoes
      .filter((a) => {
        // Busca textual ampla
        const matchBusca =
          !q ||
          a.titulo.toLowerCase().includes(q) ||
          a.disciplina.toLowerCase().includes(q) ||
          (a.professor && a.professor.toLowerCase().includes(q)) ||
          (a.tags && a.tags.some((t) => t.toLowerCase().includes(q))) ||
          (a.conteudo && a.conteudo.toLowerCase().includes(q)) ||
          (a.quadros &&
            a.quadros.some(
              (quadro) =>
                quadro.titulo.toLowerCase().includes(q) ||
                quadro.conceito.toLowerCase().includes(q) ||
                (quadro.artigoLei && quadro.artigoLei.toLowerCase().includes(q)) ||
                (quadro.palavrasChave && quadro.palavrasChave.toLowerCase().includes(q)) ||
                (quadro.exemplo && quadro.exemplo.toLowerCase().includes(q)) ||
                (quadro.pegadinhaProva && quadro.pegadinhaProva.toLowerCase().includes(q)) ||
                (quadro.oQueMemorizar && quadro.oQueMemorizar.toLowerCase().includes(q))
            )) ||
          (a.mapaMental &&
            (a.mapaMental.noCentral.toLowerCase().includes(q) ||
              (a.mapaMental.descricaoCentral && a.mapaMental.descricaoCentral.toLowerCase().includes(q)) ||
              a.mapaMental.ramificacoes.some(
                (ramo) =>
                  ramo.titulo.toLowerCase().includes(q) ||
                  (ramo.conteudo && ramo.conteudo.toLowerCase().includes(q)) ||
                  ramo.subTopicos.some(
                    (sub) =>
                      sub.texto.toLowerCase().includes(q) ||
                      (sub.detalhes && sub.detalhes.toLowerCase().includes(q))
                  )
              )));

        // Filtro por Matéria
        const matchMateria = materiaFiltro === 'todas' || a.disciplinaId === materiaFiltro;

        // Filtro por Tipo
        const matchTipo = tipoFiltro === 'todos' || a.tipo === tipoFiltro || (!a.tipo && tipoFiltro === 'livre');

        // Filtro por Favoritas
        const matchFavoritas = !apenasFavoritas || a.favorito;

        // Filtro por Tag
        const matchTag = !tagFiltro || (a.tags && a.tags.includes(tagFiltro));

        return matchBusca && matchMateria && matchTipo && matchFavoritas && matchTag;
      })
      .sort((a, b) => {
        // Ordenação por atualização mais recente
        const dateA = a.updatedAt || a.ultimaModificacao || a.data || '';
        const dateB = b.updatedAt || b.ultimaModificacao || b.data || '';
        return dateB.localeCompare(dateA);
      });
  }, [anotacoes, busca, materiaFiltro, tipoFiltro, apenasFavoritas, tagFiltro]);

  const getTipoBadgeInfo = (tipo: string) => {
    switch (tipo) {
      case 'quadros':
        return {
          icon: LayoutGrid,
          label: 'Resumo em Quadros',
          badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
        };
      case 'mapa_mental':
        return {
          icon: GitBranch,
          label: 'Mapa Mental',
          badgeClass: 'bg-stone-800 text-stone-100 border-stone-700',
        };
      default:
        return {
          icon: FileText,
          label: 'Anotação Livre',
          badgeClass: 'bg-stone-100 text-stone-800 border-stone-300',
        };
    }
  };

  const getMateriaCor = (materiaId: string) => {
    const mat = materias.find((m) => m.id === materiaId);
    return mat?.cor || 'bg-amber-600';
  };

  return (
    <div id="anotacoes-view-root" className="space-y-6 animate-in fade-in duration-300">
      {/* 1. CABEÇALHO PRINCIPAL E OPÇÕES DE CRIAÇÃO (Requisito 1 & 16) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900 flex items-center gap-2">
            <span>Anotações &amp; Fichamentos</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Índice geral organizado por matéria e vinculado a cada aula. Cada aula possui seu espaço de estudo dedicado.
          </p>
        </div>

        {/* Ações e Navegação */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Botão de Atalho para o Módulo Aulas */}
          <button
            type="button"
            onClick={() => setActiveSection('aulas')}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200/90 rounded-xl text-xs font-semibold transition shadow-2xs"
            title="Ir para o módulo Aulas com todos os espaços de estudo"
          >
            <BookOpen className="w-3.5 h-3.5 text-stone-500" />
            <span>Ver Aulas</span>
          </button>
          {/* Botão Anotação Livre */}
          <button
            type="button"
            onClick={() => handleOpenCreate('livre')}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200/90 rounded-xl text-xs font-semibold transition shadow-2xs"
            title="Criar anotação com editor livre de texto"
          >
            <FileText className="w-3.5 h-3.5 text-stone-600" />
            <span>📝 Anotação livre</span>
          </button>

          {/* Botão Resumo em Quadros */}
          <button
            type="button"
            onClick={() => handleOpenCreate('quadros')}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold transition shadow-2xs"
            title="Criar resumo de Direito organizado em cartões"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-amber-700" />
            <span>📋 Resumo em quadros</span>
          </button>

          {/* Botão Mapa Mental */}
          <button
            type="button"
            onClick={() => handleOpenCreate('mapa_mental')}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition shadow-2xs"
            title="Criar mapa mental visual com ramificações"
          >
            <GitBranch className="w-3.5 h-3.5 text-amber-400" />
            <span>🧠 Mapa mental</span>
          </button>

          {/* Botão Principal Nova Anotação */}
          <button
            id="btn-nova-anotacao"
            type="button"
            onClick={() => handleOpenCreate('livre')}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nova anotação</span>
          </button>
        </div>
      </div>

      {/* 2. BARRA DE PESQUISA, FILTROS E FAVORITOS (Requisito 6, 7 & 8) */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs space-y-3.5">
        {/* Linha 1: Pesquisa, Matéria e Favoritas */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Campo de Busca */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar por títulos, conceitos, artigos, leis, pegadinhas de prova ou tags..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtro por Matéria */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={materiaFiltro}
              onChange={(e) => setMateriaFiltro(e.target.value)}
              className="w-full md:w-56 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              <option value="todas">Todas as Matérias</option>
              {materias.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>

            {/* Toggle Somente Favoritas (Requisito 7) */}
            <button
              type="button"
              onClick={() => setApenasFavoritas(!apenasFavoritas)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition shrink-0 ${
                apenasFavoritas
                  ? 'bg-amber-100/90 text-amber-900 border-amber-300 shadow-2xs'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
              title="Mostrar apenas as anotações favoritas marcadas com estrela"
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  apenasFavoritas ? 'fill-amber-500 text-amber-500' : 'text-stone-400'
                }`}
              />
              <span className="whitespace-nowrap">Somente favoritas</span>
            </button>
          </div>
        </div>

        {/* Linha 2: Seletor de Tipo e Tags */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-100">
          {/* Filtro por Tipo */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-2xs font-bold text-stone-400 uppercase tracking-wider mr-1 shrink-0">
              Tipo:
            </span>
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'livre', label: '📝 Livre' },
              { id: 'quadros', label: '📋 Quadros' },
              { id: 'mapa_mental', label: '🧠 Mapa mental' },
            ].map((tipo) => (
              <button
                key={tipo.id}
                type="button"
                onClick={() => setTipoFiltro(tipo.id)}
                className={`px-2.5 py-1 rounded-lg text-2xs font-semibold transition whitespace-nowrap ${
                  tipoFiltro === tipo.id
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {tipo.label}
              </button>
            ))}
          </div>

          {/* Contador de anotações exibidas */}
          <div className="text-2xs text-stone-500 shrink-0">
            Mostrando <strong>{notasFiltradas.length}</strong> de {anotacoes.length}{' '}
            {anotacoes.length === 1 ? 'anotação' : 'anotações'}
          </div>
        </div>

        {/* Linha 3: Nuvem / Filtro de Tags (Requisito 8) */}
        {todasTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-stone-100 text-xs">
            <span className="text-stone-400 text-2xs uppercase tracking-wider font-semibold mr-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-stone-400" />
              Tags:
            </span>
            {tagFiltro && (
              <button
                type="button"
                onClick={() => setTagFiltro(null)}
                className="text-2xs bg-stone-200 text-stone-800 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1"
              >
                <span>Limpar filtro: #{tagFiltro}</span>
                <X className="w-3 h-3" />
              </button>
            )}
            {todasTags.map((tag) => {
              const isSelected = tagFiltro === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setTagFiltro(isSelected ? null : tag)}
                  className={`text-2xs px-2.5 py-0.5 rounded-md transition font-medium ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-2xs font-semibold'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. LISTAGEM DE ANOTAÇÕES / ESTADOS VAZIOS (Requisito 13) */}
      {anotacoes.length === 0 ? (
        /* ESTADO VAZIO INICIAL (Requisito 13: "Nenhuma anotação criada ainda." e botão "+ Nova anotação") */
        <div className="bg-white rounded-2xl border-2 border-dashed border-stone-300 p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600 border border-amber-200/60 shadow-2xs">
            <BookOpen className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-serif font-bold text-stone-800">
              Nenhuma anotação criada ainda.
            </h2>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Crie suas anotações livres de aula, resumos em cartões jurídicos ou mapas mentais ramificados para fixar os conteúdos.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenCreate('livre')}
              className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              + Nova anotação
            </button>

            <button
              type="button"
              onClick={() => handleOpenCreate('quadros')}
              className="w-full sm:w-auto px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition"
            >
              📋 Resumo em quadros
            </button>

            <button
              type="button"
              onClick={() => handleOpenCreate('mapa_mental')}
              className="w-full sm:w-auto px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition"
            >
              🧠 Mapa mental
            </button>
          </div>
        </div>
      ) : notasFiltradas.length === 0 ? (
        /* ESTADO VAZIO POR FILTRO */
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center space-y-3">
          <Search className="w-8 h-8 text-stone-400 mx-auto" />
          <p className="text-sm font-semibold text-stone-700">
            Nenhuma anotação corresponde aos critérios de busca ou filtros selecionados.
          </p>
          <button
            type="button"
            onClick={() => {
              setBusca('');
              setMateriaFiltro('todas');
              setTipoFiltro('todos');
              setApenasFavoritas(false);
              setTagFiltro(null);
            }}
            className="px-4 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition"
          >
            Limpar todos os filtros
          </button>
        </div>
      ) : (
        /* GRID RESPONSIVO DE CARDS DE ANOTAÇÕES (Requisito 6, 9, 10 & 12) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {notasFiltradas.map((nota) => {
            const tipoInfo = getTipoBadgeInfo(nota.tipo || 'livre');
            const TipoIcon = tipoInfo.icon;
            const aulaVinculada = nota.aulaRelacionadaId
              ? aulas.find((a) => a.id === nota.aulaRelacionadaId)
              : null;
            const materiaCor = getMateriaCor(nota.disciplinaId);

            return (
              <div
                key={nota.id}
                id={`card-anotacao-${nota.id}`}
                className="bg-white rounded-2xl border border-stone-200/90 hover:border-stone-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                {/* 1. TOPO DO CARD: MATÉRIA, TIPO E FAVORITO */}
                <div className="p-4 sm:p-5 space-y-3 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${materiaCor}`} />
                      <span className="text-xs font-bold text-stone-800 truncate">
                        {nota.disciplina}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Badge do Tipo */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-3xs font-bold border uppercase tracking-wider ${tipoInfo.badgeClass}`}
                      >
                        <TipoIcon className="w-3 h-3" />
                        <span>{tipoInfo.label}</span>
                      </span>

                      {/* Botão de Favorito com Estrela (Requisito 7) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoritoAnotacao(nota.id);
                        }}
                        className="p-1 rounded-md hover:bg-stone-100 transition text-stone-400 hover:text-amber-500"
                        title={nota.favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            nota.favorito
                              ? 'fill-amber-500 text-amber-500'
                              : 'text-stone-300 group-hover:text-stone-400'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Título da Anotação */}
                  <div>
                    <h3
                      onClick={() => setViewingAnotacao(nota)}
                      className="text-base font-serif font-bold text-stone-900 leading-snug cursor-pointer hover:text-amber-700 transition"
                    >
                      {nota.titulo}
                    </h3>

                    {/* Data de Atualização e Professor */}
                    <div className="flex flex-wrap items-center gap-2 text-2xs text-stone-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {nota.updatedAt
                            ? new Date(nota.updatedAt).toLocaleDateString('pt-BR')
                            : nota.data.split('-').reverse().join('/')}
                        </span>
                      </span>

                      {nota.professor && (
                        <span>• Prof. {nota.professor}</span>
                      )}
                    </div>
                  </div>

                  {/* 2. VINCULAÇÃO COM AULA (Requisito 9) */}
                  {(nota.aulaRelacionadaTitulo || aulaVinculada) && (
                    <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1.5">
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-start gap-1.5 min-w-0">
                          <Link2 className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <span className="text-3xs font-bold uppercase tracking-wider text-amber-900/70 block">
                              Aula relacionada:
                            </span>
                            <span className="text-xs font-semibold text-stone-900 truncate block">
                              {nota.aulaRelacionadaTitulo || aulaVinculada?.titulo}
                            </span>
                          </div>
                        </div>

                        {/* Botão Abrir Aula */}
                        {nota.aulaRelacionadaId && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAulaDetails(nota.aulaRelacionadaId!, 'anotacoes', nota.id);
                            }}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-2xs font-semibold transition shrink-0 flex items-center gap-1 shadow-2xs"
                            title="Abrir o espaço de estudo desta aula no módulo Aulas"
                          >
                            <span>Abrir na Aula</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>

                      {/* Se a aula possuir PDF ou Vídeo, botões diretos de acesso (Requisito 9) */}
                      {aulaVinculada && (aulaVinculada.materialPdf || aulaVinculada.linkAula) && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-amber-200/60">
                          {aulaVinculada.materialPdf && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAbrirPdfAula(aulaVinculada);
                              }}
                              className="px-2 py-0.5 bg-white hover:bg-amber-100/70 text-amber-900 border border-amber-300 rounded text-3xs font-semibold transition flex items-center gap-1"
                              title={`Abrir PDF da aula: ${aulaVinculada.materialPdf.nome}`}
                            >
                              <FileText className="w-3 h-3 text-amber-700" />
                              <span className="truncate max-w-[120px]">
                                PDF da Aula
                              </span>
                            </button>
                          )}

                          {aulaVinculada.linkAula && (
                            <a
                              href={aulaVinculada.linkAula}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="px-2 py-0.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 rounded text-3xs font-semibold transition flex items-center gap-1"
                              title="Abrir link de transmissão ou vídeo da aula"
                            >
                              <Video className="w-3 h-3 text-red-600" />
                              <span>Vídeo / Transmissão</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. PRÉVIA VISUAL DO CONTEÚDO CONFORME O TIPO */}
                  <div className="text-xs text-stone-600">
                    {/* Anotação Livre */}
                    {(!nota.tipo || nota.tipo === 'livre') && (
                      <p className="line-clamp-3 leading-relaxed text-stone-600 font-sans">
                        {nota.conteudo
                          ? nota.conteudo.replace(/[#*`_>=-]/g, '').trim()
                          : 'Sem conteúdo textual registrado.'}
                      </p>
                    )}

                    {/* Resumo em Quadros */}
                    {nota.tipo === 'quadros' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-2xs font-semibold text-amber-800">
                          <span>
                            {nota.quadros?.length || 0}{' '}
                            {(nota.quadros?.length || 0) === 1 ? 'quadro de revisão' : 'quadros de revisão'}
                          </span>
                        </div>
                        {nota.quadros && nota.quadros.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {nota.quadros.slice(0, 3).map((q, qIdx) => (
                              <span
                                key={q.id || qIdx}
                                className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 text-3xs font-medium truncate max-w-[130px]"
                              >
                                {q.titulo || `Quadro ${qIdx + 1}`}
                              </span>
                            ))}
                            {nota.quadros.length > 3 && (
                              <span className="px-1.5 py-0.5 text-3xs text-stone-400">
                                +{nota.quadros.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-stone-400 italic text-2xs">Nenhum quadro preenchido.</p>
                        )}
                      </div>
                    )}

                    {/* Mapa Mental */}
                    {nota.tipo === 'mapa_mental' && (
                      <div className="space-y-1.5">
                        <div className="text-2xs font-bold text-stone-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                          <span>Ideia Central: {nota.mapaMental?.noCentral || nota.titulo}</span>
                        </div>
                        <div className="flex items-center gap-2 text-2xs text-stone-500">
                          <span>
                            {nota.mapaMental?.ramificacoes.length || 0}{' '}
                            {(nota.mapaMental?.ramificacoes.length || 0) === 1
                              ? 'ramificação'
                              : 'ramificações'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {nota.tags && nota.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {nota.tags.map((t, idx) => (
                        <span
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            setTagFiltro(t);
                          }}
                          className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 text-3xs font-medium cursor-pointer transition"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. RODAPÉ DO CARD: AÇÕES (Visualizar, Editar, Duplicar, Excluir) */}
                <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingAnotacao(nota)}
                    className="flex-1 py-1.5 px-3 bg-white hover:bg-stone-100 text-stone-800 border border-stone-200/90 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-stone-600" />
                    <span>Estudar</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(nota)}
                      className="p-1.5 hover:bg-stone-200/70 text-stone-600 rounded-lg transition"
                      title="Editar anotação"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicar(nota.id)}
                      className="p-1.5 hover:bg-stone-200/70 text-stone-600 rounded-lg transition"
                      title="Duplicar anotação"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteAnotacao(nota.id, nota.titulo)}
                      className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition"
                      title="Excluir anotação"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE CRIAÇÃO E EDIÇÃO (AnotacaoFormModal) */}
      <AnotacaoFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingAnotacao(null);
          setActiveDraft(null);
        }}
        onSave={handleSaveAnotacao}
        editingAnotacao={editingAnotacao}
        materias={materias}
        aulas={aulas}
        prefilledDraft={activeDraft}
      />

      {/* MODAL DE VISUALIZAÇÃO COMPLETA PARA ESTUDO (AnotacaoVisualizadorModal) */}
      <AnotacaoVisualizadorModal
        isOpen={!!viewingAnotacao}
        onClose={() => setViewingAnotacao(null)}
        anotacao={viewingAnotacao}
        aulaRelacionada={
          viewingAnotacao?.aulaRelacionadaId
            ? aulas.find((a) => a.id === viewingAnotacao.aulaRelacionadaId)
            : null
        }
        onEdit={(nota) => {
          setViewingAnotacao(null);
          handleOpenEdit(nota);
        }}
        onDuplicate={handleDuplicar}
        onToggleFavorito={toggleFavoritoAnotacao}
        onAbrirAula={(aulaId) => {
          const currentNotaId = viewingAnotacao?.id;
          setViewingAnotacao(null);
          openAulaDetails(aulaId, 'anotacoes', currentNotaId);
        }}
        onAbrirPdfAula={(aula) => {
          handleAbrirPdfAula(aula);
        }}
      />

      {/* MODAL VISUALIZADOR DE PDF DE AULA */}
      {pdfPreviewData && (
        <Modal
          isOpen={!!pdfPreviewData}
          onClose={() => setPdfPreviewData(null)}
          title={`Visualizador de Material: ${pdfPreviewData.nome}`}
          maxWidth="4xl"
        >
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between bg-stone-50 p-2.5 rounded-lg border border-stone-200 text-xs">
              <span className="font-semibold text-stone-800">{pdfPreviewData.nome}</span>
              <div className="flex items-center gap-2">
                <a
                  href={pdfPreviewData.url}
                  download={pdfPreviewData.nome}
                  className="px-3 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold rounded transition text-xs"
                >
                  Baixar Arquivo
                </a>
                <a
                  href={pdfPreviewData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded transition text-xs"
                >
                  Abrir em Nova Aba
                </a>
              </div>
            </div>

            <div className="w-full h-[65vh] border border-stone-300 rounded-lg overflow-hidden bg-stone-100">
              <iframe
                src={pdfPreviewData.url}
                title={pdfPreviewData.nome}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
