import React, { useState } from 'react';
import {
  Compass,
  Plus,
  Clock,
  BookOpen,
  Award,
  CheckCircle2,
  Trash2,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MetaEstudo, SessaoEstudo } from '../../types';
import { Modal } from '../common/Modal';

export const EstudosView: React.FC = () => {
  const {
    metas,
    sessoes,
    materias,
    aulas,
    addMetaEstudo,
    updateMetaEstudo,
    deleteMetaEstudo,
    addSessaoEstudo,
    updateSessaoEstudo,
    deleteSessaoEstudo,
    openAulaDetails,
  } = useApp();

  const [isModalMetaOpen, setIsModalMetaOpen] = useState(false);
  const [isModalSessaoOpen, setIsModalSessaoOpen] = useState(false);

  // Form states for Meta
  const [novaMeta, setNovaMeta] = useState<Omit<MetaEstudo, 'id'>>({
    titulo: '',
    categoria: 'Doutrina',
    horasSemanaisMeta: 4,
    horasRealizadas: 0,
    concluida: false,
  });

  // Form states for Sessão de Estudo / Planejamento
  const [materiaIdModal, setMateriaIdModal] = useState<string>('');
  const [aulaIdModal, setAulaIdModal] = useState<string>('');
  const [dataModal, setDataModal] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [duracaoModal, setDuracaoModal] = useState<number>(60);
  const [objetivoModal, setObjetivoModal] = useState<string>('');
  const [tipoModal, setTipoModal] = useState<SessaoEstudo['tipo']>('Doutrina');
  const [statusModal, setStatusModal] = useState<'planejado' | 'em_andamento' | 'concluido'>('planejado');

  // Available lessons filtered by selected materia
  const aulasFiltradasMateria = materiaIdModal
    ? aulas.filter((a) => a.materiaId === materiaIdModal)
    : [];

  const handleOpenSessaoModal = () => {
    const initialMateriaId = materias[0]?.id || '';
    setMateriaIdModal(initialMateriaId);
    setAulaIdModal('');
    setDataModal(new Date().toISOString().split('T')[0]);
    setDuracaoModal(60);
    setObjetivoModal('');
    setTipoModal('Doutrina');
    setStatusModal('planejado');
    setIsModalSessaoOpen(true);
  };

  const handleCreateMeta = (e: React.FormEvent) => {
    e.preventDefault();
    addMetaEstudo(novaMeta);
    setIsModalMetaOpen(false);
    setNovaMeta({
      titulo: '',
      categoria: 'Doutrina',
      horasSemanaisMeta: 4,
      horasRealizadas: 0,
      concluida: false,
    });
  };

  const handleCreateSessao = (e: React.FormEvent) => {
    e.preventDefault();
    const materiaObj = materias.find((m) => m.id === materiaIdModal);
    const aulaObj = aulas.find((a) => a.id === aulaIdModal);

    const disciplinaNome = materiaObj ? materiaObj.nome : 'Geral';
    const tituloSessao = aulaObj
      ? `Estudo: ${aulaObj.titulo}`
      : `Estudo de ${disciplinaNome}`;

    const newSessaoPayload: Omit<SessaoEstudo, 'id'> = {
      titulo: tituloSessao,
      disciplina: disciplinaNome,
      materiaId: materiaObj?.id,
      aulaId: aulaObj?.id,
      aulaTitulo: aulaObj?.titulo,
      data: dataModal,
      duracaoMinutos: duracaoModal,
      tipo: tipoModal,
      objetivo: objetivoModal.trim() || undefined,
      observacoes: objetivoModal.trim() || undefined,
      status: statusModal,
    };

    addSessaoEstudo(newSessaoPayload);

    // If session is created directly as concluded, update matching meta
    if (statusModal === 'concluido') {
      const horasAdicionadas = Math.round((duracaoModal / 60) * 10) / 10;
      const metaCorrespondente = metas.find(
        (m) =>
          (tipoModal === 'Leitura de Código' && m.categoria === 'Vade Mecum & Leis') ||
          (tipoModal === 'Doutrina' && m.categoria === 'Doutrina') ||
          (tipoModal === 'Questões' && m.categoria === 'Questões OAB')
      );
      if (metaCorrespondente) {
        updateMetaEstudo(metaCorrespondente.id, {
          horasRealizadas: metaCorrespondente.horasRealizadas + horasAdicionadas,
        });
      }
    }

    setIsModalSessaoOpen(false);
  };

  const handleStatusChange = (sessao: SessaoEstudo, newStatus: 'planejado' | 'em_andamento' | 'concluido') => {
    const oldStatus = sessao.status || 'planejado';
    updateSessaoEstudo(sessao.id, { status: newStatus });

    // When status changes to concluded, register hours tracking
    if (newStatus === 'concluido' && oldStatus !== 'concluido') {
      const horasAdicionadas = Math.round((sessao.duracaoMinutos / 60) * 10) / 10;
      const metaCorrespondente = metas.find(
        (m) =>
          (sessao.tipo === 'Leitura de Código' && m.categoria === 'Vade Mecum & Leis') ||
          (sessao.tipo === 'Doutrina' && m.categoria === 'Doutrina') ||
          (sessao.tipo === 'Questões' && m.categoria === 'Questões OAB')
      );
      if (metaCorrespondente) {
        updateMetaEstudo(metaCorrespondente.id, {
          horasRealizadas: metaCorrespondente.horasRealizadas + horasAdicionadas,
        });
      }
    }
  };

  const totalHorasMeta = metas.reduce((acc, m) => acc + m.horasSemanaisMeta, 0);
  const totalHorasRealizadas = metas.reduce((acc, m) => acc + m.horasRealizadas, 0);

  // Filter planned sessions
  const sessoesOrdenadas = [...sessoes].sort(
    (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
  );

  return (
    <div id="estudos-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">
            📚 Planejamento de Estudos
          </h1>
          <p className="text-xs text-stone-500">
            Organize suas sessões de estudo por matéria, aula, horário e objetivos pedagógicos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsModalMetaOpen(true)}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition"
          >
            + Nova Meta Semanal
          </button>
          <button
            type="button"
            onClick={handleOpenSessaoModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Planejar estudo</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-stone-200/90 shadow-xs">
          <div className="text-xs text-stone-500 uppercase tracking-wider font-semibold">
            Sessões Planejadas
          </div>
          <div className="text-2xl font-bold font-serif text-stone-900 mt-1">
            {sessoes.filter((s) => (s.status || 'planejado') === 'planejado').length}
          </div>
          <div className="text-xs text-stone-500 mt-1">
            Aguardando execução no cronograma
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200/90 shadow-xs">
          <div className="text-xs text-stone-500 uppercase tracking-wider font-semibold">
            Em Andamento / Concluídas
          </div>
          <div className="text-2xl font-bold font-serif text-amber-700 mt-1">
            {sessoes.filter((s) => s.status === 'concluido' || s.status === 'em_andamento').length}
          </div>
          <div className="text-xs text-stone-500 mt-1">
            {sessoes.filter((s) => s.status === 'concluido').length} concluídas no histórico
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200/90 shadow-xs">
          <div className="text-xs text-stone-500 uppercase tracking-wider font-semibold">
            Meta Semanal
          </div>
          <div className="text-2xl font-bold font-serif text-stone-900 mt-1">
            {totalHorasRealizadas}h / {totalHorasMeta}h
          </div>
          <div className="text-xs text-stone-500 mt-1">
            {totalHorasMeta > 0
              ? `${Math.round((totalHorasRealizadas / totalHorasMeta) * 100)}% das metas cumpridas`
              : 'Sem meta cadastrada'}
          </div>
        </div>
      </div>

      {/* Main Section: 📚 Planejamento de Estudos */}
      <section className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <h2 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-600" />
              <span>Sessões de Estudo Planejadas</span>
            </h2>
            <p className="text-2xs text-stone-500">
              Acompanhe seu progresso e marque cada estudo como concluído.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenSessaoModal}
            className="self-start sm:self-auto px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            + Planejar estudo
          </button>
        </div>

        {/* List of Planned Sessions */}
        {sessoesOrdenadas.length === 0 ? (
          <div className="border border-dashed border-stone-200 rounded-xl p-10 text-center space-y-3">
            <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center mx-auto">
              <Compass className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-stone-800">
                Você ainda não possui estudos planejados.
              </p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Crie seu primeiro planejamento de estudo definindo a matéria, a aula correspondente e seu objetivo.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenSessaoModal}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              + Planejar primeiro estudo
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sessoesOrdenadas.map((sessao) => {
              const statusAtual = sessao.status || 'planejado';
              const isConcluido = statusAtual === 'concluido';
              const isEmAndamento = statusAtual === 'em_andamento';

              const materiaObj = materias.find((m) => m.nome === sessao.disciplina || m.id === sessao.materiaId);

              return (
                <div
                  key={sessao.id}
                  className={`p-4 sm:p-5 rounded-xl border transition space-y-3 ${
                    isConcluido
                      ? 'bg-emerald-50/40 border-emerald-200/80'
                      : isEmAndamento
                      ? 'bg-amber-50/40 border-amber-300'
                      : 'bg-stone-50/60 border-stone-200/80 hover:bg-white hover:shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/50 pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: materiaObj?.cor || '#d97706' }}
                      />
                      <span className="text-xs font-bold text-stone-900">
                        {sessao.disciplina}
                      </span>
                      {sessao.aulaTitulo && (
                        <span className="text-2xs font-medium text-stone-600 bg-white border border-stone-200 px-2 py-0.5 rounded">
                          Aula: {sessao.aulaTitulo}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      {/* Status Selector Badge */}
                      <select
                        value={statusAtual}
                        onChange={(e) =>
                          handleStatusChange(
                            sessao,
                            e.target.value as 'planejado' | 'em_andamento' | 'concluido'
                          )
                        }
                        className={`text-2xs font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer bg-white ${
                          isConcluido
                            ? 'text-emerald-800 border-emerald-300 bg-emerald-50'
                            : isEmAndamento
                            ? 'text-amber-800 border-amber-300 bg-amber-50'
                            : 'text-stone-700 border-stone-300'
                        }`}
                      >
                        <option value="planejado">☐ Planejado</option>
                        <option value="em_andamento">⏳ Em andamento</option>
                        <option value="concluido">✓ Concluído</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => deleteSessaoEstudo(sessao.id)}
                        className="p-1 text-stone-400 hover:text-rose-600 rounded transition"
                        title="Excluir planejamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-stone-900">
                      {sessao.titulo}
                    </h4>
                    {sessao.objetivo && (
                      <p className="text-xs text-stone-600 leading-relaxed bg-white/80 p-2.5 rounded-lg border border-stone-200/60">
                        <span className="font-semibold text-stone-700 block text-3xs uppercase tracking-wider mb-0.5">Objetivo:</span>
                        {sessao.objetivo}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t border-stone-200/40">
                    <div className="flex items-center gap-3 text-stone-500 text-3xs font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        {sessao.data.split('-').reverse().join('/')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        {sessao.duracaoMinutos} min
                      </span>
                    </div>

                    {sessao.aulaId && (
                      <button
                        type="button"
                        onClick={() => openAulaDetails(sessao.aulaId!)}
                        className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 underline cursor-pointer"
                      >
                        <span>Abrir Aula relacionada</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Metas Semanais */}
      <section className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h2 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            <span>Metas Semanais de Estudo</span>
          </h2>
          <span className="text-xs text-stone-400">
            {metas.filter((m) => m.horasRealizadas >= m.horasSemanaisMeta).length} / {metas.length} concluídas
          </span>
        </div>

        <div className="space-y-3.5">
          {metas.length === 0 ? (
            <div className="border border-dashed border-stone-200 rounded-xl p-6 text-center text-xs text-stone-400">
              Nenhuma meta semanal cadastrada
            </div>
          ) : (
            metas.map((meta) => {
              const percent = Math.min(
                100,
                Math.round((meta.horasRealizadas / meta.horasSemanaisMeta) * 100)
              );
              const atingida = meta.horasRealizadas >= meta.horasSemanaisMeta;

              return (
                <div
                  key={meta.id}
                  className="p-4 rounded-xl border border-stone-200/80 bg-stone-50/40 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-200 text-stone-700">
                        {meta.categoria}
                      </span>
                      <h4 className="text-sm font-bold text-stone-900 mt-1">
                        {meta.titulo}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => deleteMetaEstudo(meta.id)}
                        className="p-1 text-stone-400 hover:text-rose-600 rounded"
                        title="Excluir meta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-stone-600 font-mono">
                      <span>{meta.horasRealizadas}h realizadas</span>
                      <span>Meta: {meta.horasSemanaisMeta}h</span>
                    </div>
                    <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          atingida ? 'bg-emerald-600' : 'bg-amber-600'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[11px] text-stone-400">Progresso: {percent}%</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          updateMetaEstudo(meta.id, {
                            horasRealizadas: Math.max(0, meta.horasRealizadas - 0.5),
                          })
                        }
                        className="px-2 py-0.5 bg-white border border-stone-200 rounded text-stone-600 hover:bg-stone-100"
                      >
                        -30min
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateMetaEstudo(meta.id, {
                            horasRealizadas: meta.horasRealizadas + 0.5,
                          })
                        }
                        className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded font-semibold hover:bg-amber-100"
                      >
                        +30min
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Modal Nova Meta */}
      <Modal
        isOpen={isModalMetaOpen}
        onClose={() => setIsModalMetaOpen(false)}
        title="Definir Nova Meta de Estudo"
      >
        <form onSubmit={handleCreateMeta} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Título da Meta *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Leitura diária do Código Penal, 50 questões FGV..."
              value={novaMeta.titulo}
              onChange={(e) =>
                setNovaMeta({ ...novaMeta, titulo: e.target.value })
              }
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Categoria
              </label>
              <select
                value={novaMeta.categoria}
                onChange={(e) =>
                  setNovaMeta({
                    ...novaMeta,
                    categoria: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
              >
                <option value="Vade Mecum & Leis">Vade Mecum & Leis</option>
                <option value="Doutrina">Doutrina</option>
                <option value="Jurisprudência">Jurisprudência</option>
                <option value="Questões OAB">Questões OAB</option>
                <option value="Geral">Geral</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Horas Semanais Desejadas
              </label>
              <input
                type="number"
                min={1}
                max={50}
                required
                value={novaMeta.horasSemanaisMeta}
                onChange={(e) =>
                  setNovaMeta({
                    ...novaMeta,
                    horasSemanaisMeta: parseFloat(e.target.value) || 1,
                  })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setIsModalMetaOpen(false)}
              className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg font-medium text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs"
            >
              Salvar Meta
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Criar Planejamento de Estudo */}
      <Modal
        isOpen={isModalSessaoOpen}
        onClose={() => setIsModalSessaoOpen(false)}
        title="📚 Criar Planejamento de Estudo"
      >
        <form onSubmit={handleCreateSessao} className="space-y-4 text-xs">
          {/* Selecionar Matéria */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Matéria *
            </label>
            <select
              required
              value={materiaIdModal}
              onChange={(e) => {
                setMateriaIdModal(e.target.value);
                setAulaIdModal('');
              }}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
            >
              {materias.length === 0 ? (
                <option value="">Nenhuma matéria cadastrada</option>
              ) : (
                materias.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Selecionar Aula */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Aula (opcional)
            </label>
            <select
              value={aulaIdModal}
              onChange={(e) => setAulaIdModal(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
            >
              <option value="">Nenhuma aula específica</option>
              {aulasFiltradasMateria.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.titulo}
                </option>
              ))}
            </select>
            {materiaIdModal && aulasFiltradasMateria.length === 0 && (
              <p className="text-3xs text-stone-400 mt-1">
                Nenhuma aula cadastrada nesta matéria.
              </p>
            )}
          </div>

          {/* Data e Duração */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Data *
              </label>
              <input
                type="date"
                required
                value={dataModal}
                onChange={(e) => setDataModal(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Duração *
              </label>
              <select
                value={duracaoModal}
                onChange={(e) => setDuracaoModal(parseInt(e.target.value) || 60)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos (1h)</option>
                <option value={90}>90 minutos (1h30)</option>
                <option value={120}>120 minutos (2h)</option>
              </select>
            </div>
          </div>

          {/* Tipo de Estudo & Status Inicial */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Tipo de Estudo
              </label>
              <select
                value={tipoModal}
                onChange={(e) => setTipoModal(e.target.value as any)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
              >
                <option value="Doutrina">Doutrina</option>
                <option value="Leitura de Código">Vade Mecum & Leis</option>
                <option value="Resumo">Resumo / Fichamento</option>
                <option value="Questões">Questões / OAB</option>
                <option value="Revisão">Revisão Espaçada</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Status Inicial
              </label>
              <select
                value={statusModal}
                onChange={(e) => setStatusModal(e.target.value as any)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
              >
                <option value="planejado">Planejado</option>
                <option value="em_andamento">Em andamento</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>
          </div>

          {/* Objetivo */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Objetivo da Sessão (opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Ex: Revisar conceitos e artigos importantes, resolver 10 questões de fixação..."
              value={objetivoModal}
              onChange={(e) => setObjetivoModal(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setIsModalSessaoOpen(false)}
              className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg font-medium text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs"
            >
              Salvar Planejamento
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
