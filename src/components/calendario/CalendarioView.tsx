import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  Trash2,
  Clock,
  BookOpen,
  GraduationCap,
  FileCheck,
  Compass,
  AlertTriangle,
  Building2,
  Flag,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EventoCalendario, SessaoEstudo, TipoEvento } from '../../types';
import { Modal } from '../common/Modal';

const TIPOS_CONFIG: Record<
  TipoEvento,
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  aula: {
    label: 'Aulas',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: BookOpen,
  },
  prova: {
    label: 'Provas',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: GraduationCap,
  },
  trabalho: {
    label: 'Trabalhos',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: FileCheck,
  },
  prazo: {
    label: 'Prazos',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: AlertTriangle,
  },
  estudo: {
    label: 'Eventos de Estudo',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    icon: Compass,
  },
  institucional: {
    label: 'Institucional',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    icon: Building2,
  },
  feriado: {
    label: 'Feriados / Férias',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
    icon: Flag,
  },
};

interface EventoCalculado extends EventoCalendario {
  originalSessao?: SessaoEstudo;
}

export const CalendarioView: React.FC = () => {
  const {
    eventos,
    sessoes,
    materias,
    addEvento,
    deleteEvento,
    toggleConcluidoEvento,
    updateSessaoEstudo,
    deleteSessaoEstudo,
    openAulaDetails,
  } = useApp();

  // Selected date / month navigation (dynamic real date)
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'grid' | 'agenda'>('grid');

  // Modal Novo Evento
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'prova' as TipoEvento,
    data: new Date().toISOString().split('T')[0],
    dataFim: '',
    horario: '',
    disciplinaId: '',
    descricao: '',
  });

  // Modal Detalhes Sessão de Estudo
  const [selectedSessaoDetail, setSelectedSessaoDetail] = useState<SessaoEstudo | null>(null);

  // Convert planned study sessions into calendar events
  const sessoesComoEventos: EventoCalculado[] = sessoes.map((s) => ({
    id: `sess-ev-${s.id}`,
    titulo: s.aulaTitulo ? `Estudo: ${s.aulaTitulo}` : s.titulo,
    tipo: 'estudo' as TipoEvento,
    data: s.data,
    disciplina: s.disciplina,
    disciplinaId: s.materiaId,
    descricao: s.objetivo ? `Objetivo: ${s.objetivo}` : s.observacoes,
    horario: `⏱ ${s.duracaoMinutos} min`,
    concluido: s.status === 'concluido',
    originalSessao: s,
  }));

  const todosEventos: EventoCalculado[] = [
    ...eventos.map((e) => ({ ...e })),
    ...sessoesComoEventos,
  ];

  const handleOpenAdd = (dateStr?: string) => {
    setFormData({
      titulo: '',
      tipo: 'prova',
      data: dateStr || new Date().toISOString().split('T')[0],
      dataFim: '',
      horario: '',
      disciplinaId: '',
      descricao: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const materia = materias.find((m) => m.id === formData.disciplinaId);
    addEvento({
      titulo: formData.titulo,
      tipo: formData.tipo,
      data: formData.data,
      dataFim: formData.dataFim ? formData.dataFim : undefined,
      horario: formData.horario || undefined,
      disciplinaId: formData.disciplinaId || undefined,
      disciplina: materia ? materia.nome : 'Institucional / Geral',
      descricao: formData.descricao || undefined,
    });
    setIsModalOpen(false);
  };

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  // Filtered events
  const eventosFiltrados = todosEventos.filter((e) => {
    if (tipoFiltro === 'todos') return true;
    return e.tipo === tipoFiltro;
  });

  const diasDoMes = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const diasVazios = Array.from({ length: firstDayIndex }, (_, i) => i);

  return (
    <div id="calendario-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">
            Calendário Acadêmico
          </h1>
          <p className="text-xs text-stone-500">
            Cronograma unificado de Aulas, Provas, Trabalhos, Prazos e Eventos de Estudo
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-stone-200/80 p-1 rounded-xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'grid'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Mês
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'agenda'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Lista / Agenda
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleOpenAdd()}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Evento</span>
          </button>
        </div>
      </div>

      {/* Tipo Filters Chips */}
      <div className="bg-white p-3.5 rounded-xl border border-stone-200/90 shadow-xs flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-semibold text-stone-500 mr-2 flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5" />
          Filtrar:
        </span>

        <button
          type="button"
          onClick={() => setTipoFiltro('todos')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition shrink-0 ${
            tipoFiltro === 'todos'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          Todos ({todosEventos.length})
        </button>

        {(Object.keys(TIPOS_CONFIG) as TipoEvento[]).map((tipo) => {
          const cfg = TIPOS_CONFIG[tipo];
          const Icon = cfg.icon;
          const count = todosEventos.filter((e) => e.tipo === tipo).length;
          const isSelected = tipoFiltro === tipo;

          return (
            <button
              key={tipo}
              type="button"
              onClick={() => setTipoFiltro(tipo)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition shrink-0 border ${
                isSelected
                  ? `${cfg.bg} ${cfg.text} ${cfg.border} font-bold shadow-xs`
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cfg.label}</span>
              <span className="text-[10px] opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* View 1: Calendar Grid View */}
      {viewMode === 'grid' && (
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden">
          {/* Month Navigation Bar */}
          <div className="px-6 py-4 border-b border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-serif font-bold text-stone-900">
                {monthNames[month]} de {year}
              </h2>
              <span className="text-xs bg-amber-100/80 text-amber-800 font-semibold px-2.5 py-0.5 rounded-md border border-amber-200">
                Semestre 2026/2
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Navegação rápida entre os meses do semestre */}
              <div className="flex items-center bg-stone-100 p-1 rounded-lg gap-0.5 text-xs">
                {[
                  { m: 6, label: 'Jul' },
                  { m: 7, label: 'Ago' },
                  { m: 8, label: 'Set' },
                  { m: 9, label: 'Out' },
                  { m: 10, label: 'Nov' },
                  { m: 11, label: 'Dez' },
                ].map((item) => (
                  <button
                    key={item.m}
                    type="button"
                    onClick={() => setCurrentDate(new Date(2026, item.m, 1))}
                    className={`px-2.5 py-1 rounded font-medium transition ${
                      year === 2026 && month === item.m
                        ? 'bg-amber-600 text-white font-bold shadow-xs'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 border-l border-stone-200 pl-2">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
                  title="Mês anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentDate(new Date(2026, 8, 12))}
                  className="px-2.5 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-md"
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
                  title="Próximo mês"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50 text-center text-[11px] font-bold text-stone-500 py-2.5 uppercase tracking-wider">
            <span>Dom</span>
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
          </div>

          {/* Month Cells Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-stone-100 min-h-[560px]">
            {/* Empty slots for start of month */}
            {diasVazios.map((_, i) => (
              <div key={`empty-${i}`} className="bg-stone-50/40 p-2 min-h-[90px]" />
            ))}

            {/* Days in Month */}
            {diasDoMes.map((dia) => {
              const diaFormatado = String(dia).padStart(2, '0');
              const mesFormatado = String(month + 1).padStart(2, '0');
              const dataString = `${year}-${mesFormatado}-${diaFormatado}`;

              const eventosNoDia = eventosFiltrados.filter((e) => {
                if (e.dataFim) {
                  return dataString >= e.data && dataString <= e.dataFim;
                }
                return e.data === dataString;
              });

              return (
                <div
                  key={dia}
                  onClick={() => handleOpenAdd(dataString)}
                  className="p-1.5 sm:p-2.5 min-h-[95px] flex flex-col justify-between hover:bg-stone-50/80 transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-stone-700 group-hover:text-amber-700">
                      {dia}
                    </span>
                    {eventosNoDia.length > 0 && (
                      <span className="text-[10px] text-stone-400 font-mono">
                        {eventosNoDia.length} ev.
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 flex-1 overflow-hidden">
                    {eventosNoDia.slice(0, 3).map((ev) => {
                      const cfg = TIPOS_CONFIG[ev.tipo] || TIPOS_CONFIG.prova;
                      return (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            if (ev.originalSessao) {
                              e.stopPropagation();
                              setSelectedSessaoDetail(ev.originalSessao);
                            }
                          }}
                          className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium border ${cfg.bg} ${cfg.text} ${cfg.border} ${
                            ev.originalSessao ? 'hover:scale-[1.02] cursor-pointer' : ''
                          }`}
                          title={`${ev.titulo} (${cfg.label})`}
                        >
                          {ev.titulo}
                        </div>
                      );
                    })}
                    {eventosNoDia.length > 3 && (
                      <div className="text-[9px] text-stone-400 font-medium pl-1">
                        +{eventosNoDia.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View 2: Agenda / Chronological List View */}
      {viewMode === 'agenda' && (
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-6 space-y-4">
          <h2 className="text-lg font-serif font-bold text-stone-900 border-b border-stone-100 pb-3">
            Lista Cronológica de Eventos ({eventosFiltrados.length})
          </h2>

          <div className="space-y-3">
            {todosEventos.length === 0 ? (
              <p className="text-xs text-stone-400 py-8 text-center">
                Nenhum evento no calendário
              </p>
            ) : eventosFiltrados.length === 0 ? (
              <p className="text-xs text-stone-400 py-8 text-center">
                Nenhum evento encontrado para o filtro selecionado.
              </p>
            ) : (
              [...eventosFiltrados]
                .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
                .map((evento) => {
                  const cfg = TIPOS_CONFIG[evento.tipo];
                  const Icon = cfg.icon;
                  const isSessao = !!evento.originalSessao;

                  return (
                    <div
                      key={evento.id}
                      className="p-4 rounded-xl border border-stone-200/80 bg-stone-50/40 hover:bg-white transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                            >
                              {cfg.label}
                            </span>
                            <span className="text-xs font-semibold text-stone-700">
                              {evento.disciplina}
                            </span>
                            {isSessao && evento.originalSessao?.aulaTitulo && (
                              <span className="text-[10px] font-medium text-stone-600 bg-white border border-stone-200 px-1.5 py-0.5 rounded">
                                Aula: {evento.originalSessao.aulaTitulo}
                              </span>
                            )}
                          </div>
                          <h3
                            className={`text-sm font-bold text-stone-900 ${
                              evento.concluido ? 'line-through text-stone-400' : ''
                            }`}
                          >
                            {evento.titulo}
                          </h3>
                          {evento.descricao && (
                            <p className="text-xs text-stone-500 leading-relaxed">
                              {evento.descricao}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
                        <div className="text-xs text-stone-600 bg-white border border-stone-200 px-3 py-1.5 rounded-lg text-right sm:text-left">
                          <div className="font-semibold whitespace-nowrap">
                            {evento.dataFim
                              ? `${evento.data.split('-').reverse().join('/')} a ${evento.dataFim.split('-').reverse().join('/')}`
                              : evento.data.split('-').reverse().join('/')}
                          </div>
                          {evento.horario && (
                            <div className="text-[10px] text-stone-400 font-mono">
                              {evento.horario}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {isSessao ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setSelectedSessaoDetail(evento.originalSessao!)}
                                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-2xs font-bold transition flex items-center gap-1"
                              >
                                <span>Ver Estudo</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => toggleConcluidoEvento(evento.id)}
                                className={`p-1.5 rounded-lg border transition ${
                                  evento.concluido
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                    : 'text-stone-400 hover:text-stone-700 border-stone-200'
                                }`}
                                title={evento.concluido ? 'Marcar pendente' : 'Marcar concluído'}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteEvento(evento.id)}
                                className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Excluir evento"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* Modal Criar Evento */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cadastrar Novo Evento no Calendário"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Título do Evento *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Prova Substitutiva, Entrega de Peça, Simulado OAB..."
              value={formData.titulo}
              onChange={(e) =>
                setFormData({ ...formData, titulo: e.target.value })
              }
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Tipo de Evento *
              </label>
              <select
                value={formData.tipo}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tipo: e.target.value as TipoEvento,
                  })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
              >
                <option value="prova">Prova</option>
                <option value="prazo">Prazo Acadêmico</option>
                <option value="institucional">Institucional</option>
                <option value="feriado">Feriados / Férias</option>
                <option value="estudo">Evento de Estudo</option>
                <option value="aula">Aula</option>
                <option value="trabalho">Trabalho</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Disciplina Associada
              </label>
              <select
                value={formData.disciplinaId}
                onChange={(e) =>
                  setFormData({ ...formData, disciplinaId: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
              >
                <option value="">Institucional / Geral</option>
                {materias.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Data Inicial *
              </label>
              <input
                type="date"
                required
                value={formData.data}
                onChange={(e) =>
                  setFormData({ ...formData, data: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Data Término (opcional)
              </label>
              <input
                type="date"
                value={formData.dataFim}
                onChange={(e) =>
                  setFormData({ ...formData, dataFim: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Horário (opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: 14:00"
                value={formData.horario}
                onChange={(e) =>
                  setFormData({ ...formData, horario: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Detalhes / Descrição
            </label>
            <textarea
              rows={3}
              placeholder="Instruções, critérios de avaliação, capítulos ou materiais de consulta..."
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg font-medium text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs shadow-xs"
            >
              Salvar Evento
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detalhes do Estudo Planejado */}
      <Modal
        isOpen={!!selectedSessaoDetail}
        onClose={() => setSelectedSessaoDetail(null)}
        title="📚 Detalhes do Estudo Planejado"
      >
        {selectedSessaoDetail && (
          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                {selectedSessaoDetail.disciplina}
              </span>
              <h3 className="text-base font-bold text-stone-900 mt-1">
                {selectedSessaoDetail.titulo}
              </h3>
              {selectedSessaoDetail.aulaTitulo && (
                <p className="text-xs text-stone-600 font-medium">
                  Aula vinculada: {selectedSessaoDetail.aulaTitulo}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 bg-stone-50 p-3 rounded-lg border border-stone-200/80">
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Data</span>
                <span className="font-semibold text-stone-800 font-mono">
                  {selectedSessaoDetail.data.split('-').reverse().join('/')}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Duração</span>
                <span className="font-semibold text-stone-800 font-mono">
                  {selectedSessaoDetail.duracaoMinutos} minutos
                </span>
              </div>
            </div>

            {selectedSessaoDetail.objetivo && (
              <div>
                <span className="font-semibold text-stone-700 block mb-1">Objetivo:</span>
                <p className="text-stone-600 bg-white p-3 rounded-lg border border-stone-200 leading-relaxed">
                  {selectedSessaoDetail.objetivo}
                </p>
              </div>
            )}

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Alterar Status:
              </label>
              <select
                value={selectedSessaoDetail.status || 'planejado'}
                onChange={(e) => {
                  const newStatus = e.target.value as 'planejado' | 'em_andamento' | 'concluido';
                  updateSessaoEstudo(selectedSessaoDetail.id, { status: newStatus });
                  setSelectedSessaoDetail({ ...selectedSessaoDetail, status: newStatus });
                }}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white font-semibold"
              >
                <option value="planejado">☐ Planejado</option>
                <option value="em_andamento">⏳ Em andamento</option>
                <option value="concluido">✓ Concluído</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  deleteSessaoEstudo(selectedSessaoDetail.id);
                  setSelectedSessaoDetail(null);
                }}
                className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg font-semibold text-xs flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedSessaoDetail.aulaId && (
                  <button
                    type="button"
                    onClick={() => {
                      const id = selectedSessaoDetail.aulaId!;
                      setSelectedSessaoDetail(null);
                      openAulaDetails(id);
                    }}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                  >
                    <span>Abrir Aula</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedSessaoDetail(null)}
                  className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded-lg text-xs font-medium"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
