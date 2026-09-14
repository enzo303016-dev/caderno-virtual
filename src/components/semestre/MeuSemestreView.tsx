import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  FileCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { TipoEvento } from '../../types';

export const MeuSemestreView: React.FC = () => {
  const {
    perfil,
    materias,
    aulas,
    eventos,
    addEvento,
    toggleConcluidoEvento,
  } = useApp();

  const [isModalAvaliacaoOpen, setIsModalAvaliacaoOpen] = useState(false);
  const [novaAvaliacao, setNovaAvaliacao] = useState({
    titulo: '',
    tipo: 'prova' as TipoEvento,
    data: new Date().toISOString().split('T')[0],
    horario: '19:00',
    disciplinaId: materias[0]?.id || '',
    descricao: '',
  });

  // Filter evaluations (provas, trabalhos, prazos)
  const avaliacoes = eventos.filter(
    (e) => e.tipo === 'prova' || e.tipo === 'trabalho' || e.tipo === 'prazo'
  );

  // Proximas aulas do semestre
  const proximasAulas = [...aulas].sort(
    (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
  );

  const handleCreateAvaliacao = (e: React.FormEvent) => {
    e.preventDefault();
    const materia = materias.find((m) => m.id === novaAvaliacao.disciplinaId);
    addEvento({
      titulo: novaAvaliacao.titulo,
      tipo: novaAvaliacao.tipo,
      data: novaAvaliacao.data,
      horario: novaAvaliacao.horario,
      disciplinaId: novaAvaliacao.disciplinaId,
      disciplina: materia ? materia.nome : 'Geral',
      descricao: novaAvaliacao.descricao,
    });
    setIsModalAvaliacaoOpen(false);
    setNovaAvaliacao({
      titulo: '',
      tipo: 'prova',
      data: new Date().toISOString().split('T')[0],
      horario: '19:00',
      disciplinaId: materias[0]?.id || '',
      descricao: '',
    });
  };

  const getDiasRestantes = (dataStr: string) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const alvo = new Date(dataStr + 'T00:00:00');
    const diff = Math.ceil((alvo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `${Math.abs(diff)}d atrás`;
    if (diff === 0) return 'Hoje';
    if (diff === 1) return 'Amanhã';
    return `em ${diff} dias`;
  };

  return (
    <div id="meu-semestre-view" className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header do Semestre Atual */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 bg-amber-100/60 px-2.5 py-0.5 rounded-md">
                Período Letivo
              </span>
              <span className="text-xs text-stone-500">• Turno: {perfil.turno || 'Tarde'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">
              {perfil.semestreAtual || '3º semestre'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600">
              {perfil.instituicao ? `${perfil.instituicao} — ` : ''}{perfil.curso || 'Bacharelado em Direito'}
            </p>
          </div>
        </div>

        {/* Semestre summary metrics */}
        <div className="flex items-center gap-4 sm:gap-6 border-t md:border-t-0 md:border-l border-stone-200 pt-4 md:pt-0 md:pl-6">
          <div>
            <div className="text-xs text-stone-500">Disciplinas</div>
            <div className="text-xl font-bold text-stone-900 font-serif">
              {materias.length}
            </div>
          </div>
          <div>
            <div className="text-xs text-stone-500">Aulas Registradas</div>
            <div className="text-xl font-bold text-stone-900 font-serif">
              {aulas.length}
            </div>
          </div>
          <div>
            <div className="text-xs text-stone-500">Avaliações</div>
            <div className="text-xl font-bold text-stone-900 font-serif">
              {avaliacoes.length}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Disciplinas Cadastradas */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-serif text-stone-900">
              Disciplinas Cadastradas
            </h2>
            <p className="text-xs text-stone-500">
              Matérias cursadas no semestre atual com corpo docente e horários
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materias.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl border border-dashed border-stone-300 p-8 text-center text-xs text-stone-400">
              Nenhuma matéria cadastrada
            </div>
          ) : (
            materias.map((materia) => {
              const aulasDaMateria = aulas.filter((a) => a.materiaId === materia.id);
              return (
                <div
                  key={materia.id}
                  className="bg-white rounded-xl p-5 border border-stone-200/90 shadow-xs hover:border-stone-300 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: materia.cor }}
                      />
                      <span className="text-[11px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                        {materia.diaSemana}
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-base text-stone-900 mb-1">
                      {materia.nome}
                    </h3>

                    <div className="space-y-1.5 text-xs text-stone-600 mb-3">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className={materia.professor ? 'font-medium text-stone-800' : 'text-stone-400 italic'}>
                          {materia.professor || 'Professor a preencher'}
                        </span>
                      </div>
                      {materia.horario ? (
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{materia.horario}</span>
                        </div>
                      ) : null}
                      {materia.sala ? (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>Sala {materia.sala}</span>
                        </div>
                      ) : null}
                    </div>

                    <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed border-t border-stone-100 pt-2.5">
                      {materia.descricao}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                    <span>{aulasDaMateria.length} aulas cadastradas</span>
                    <span className="font-medium text-amber-700">Ver ementa</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Two columns: Próximas Aulas & Avaliações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. Próximas Aulas */}
        <section className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-amber-600" />
              <h2 className="font-serif font-bold text-base text-stone-900">
                Próximas Aulas
              </h2>
            </div>
            <span className="text-xs text-stone-500">
              {proximasAulas.length} agendadas
            </span>
          </div>

          <div className="space-y-3">
            {proximasAulas.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">
                Nenhuma aula cadastrada
              </p>
            ) : (
              proximasAulas.map((aula) => {
              const materia = materias.find((m) => m.id === aula.materiaId);
              return (
                <div
                  key={aula.id}
                  className="p-4 rounded-xl border border-stone-200/80 bg-stone-50/50 hover:bg-white transition space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: materia?.cor || '#0f766e' }}
                      />
                      <span className="font-semibold text-stone-800">
                        {aula.disciplina}
                      </span>
                    </div>
                    <span className="font-mono text-stone-500 bg-white border border-stone-200 px-2 py-0.5 rounded text-[11px]">
                      {aula.data.split('-').reverse().join('/')} • {aula.horario}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-stone-900">
                    {aula.titulo}
                  </h4>

                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {aula.conteudo}
                  </p>

                  {aula.observacoes && (
                    <div className="text-[11px] text-amber-900 bg-amber-50/80 border border-amber-200/60 p-2 rounded-lg">
                      <span className="font-semibold">Obs:</span> {aula.observacoes}
                    </div>
                  )}
                </div>
              );
            }))}
          </div>
        </section>

        {/* 4. Avaliações (Provas, Trabalhos, Prazos) */}
        <section className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2.5">
              <FileCheck className="w-5 h-5 text-rose-600" />
              <h2 className="font-serif font-bold text-base text-stone-900">
                Avaliações & Prazos
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsModalAvaliacaoOpen(true)}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Avaliação</span>
            </button>
          </div>

          <div className="space-y-3">
            {avaliacoes.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">
                Nenhum evento no calendário
              </p>
            ) : (
              avaliacoes.map((av) => {
                const isConcluida = av.concluido;
                const diasRestantes = getDiasRestantes(av.data);
                const badgeStyle =
                  av.tipo === 'prova'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : av.tipo === 'trabalho'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200';

                return (
                  <div
                    key={av.id}
                    className={`p-4 rounded-xl border transition ${
                      isConcluida
                        ? 'border-stone-200 bg-stone-50 opacity-60'
                        : 'border-stone-200/90 bg-stone-50/40 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeStyle}`}
                        >
                          {av.tipo}
                        </span>
                        <span className="text-xs font-semibold text-stone-700">
                          {av.disciplina}
                        </span>
                      </div>
                      <span className="text-xs font-bold font-mono text-stone-600 bg-white border border-stone-200 px-2 py-0.5 rounded">
                        {diasRestantes}
                      </span>
                    </div>

                    <h4
                      className={`text-sm font-bold text-stone-900 ${
                        isConcluida ? 'line-through text-stone-500' : ''
                      }`}
                    >
                      {av.titulo}
                    </h4>

                    {av.descricao && (
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                        {av.descricao}
                      </p>
                    )}

                    <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                      <span>Data: {av.data.split('-').reverse().join('/')} {av.horario ? `às ${av.horario}` : ''}</span>
                      <button
                        type="button"
                        onClick={() => toggleConcluidoEvento(av.id)}
                        className={`flex items-center gap-1 font-semibold ${
                          isConcluida ? 'text-emerald-600' : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isConcluida ? 'Concluída' : 'Marcar feita'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Modal Nova Avaliação */}
      <Modal
        isOpen={isModalAvaliacaoOpen}
        onClose={() => setIsModalAvaliacaoOpen(false)}
        title="Cadastrar Nova Avaliação ou Prazo"
      >
        <form onSubmit={handleCreateAvaliacao} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Título da Avaliação
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Prova Regimental A1, Trabalho em Grupo, Fichamento..."
              value={novaAvaliacao.titulo}
              onChange={(e) =>
                setNovaAvaliacao({ ...novaAvaliacao, titulo: e.target.value })
              }
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Tipo
              </label>
              <select
                value={novaAvaliacao.tipo}
                onChange={(e) =>
                  setNovaAvaliacao({
                    ...novaAvaliacao,
                    tipo: e.target.value as TipoEvento,
                  })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
              >
                <option value="prova">Prova</option>
                <option value="trabalho">Trabalho</option>
                <option value="prazo">Prazo Acadêmico</option>
                <option value="estudo">Sessão de Revisão</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Disciplina
              </label>
              <select
                value={novaAvaliacao.disciplinaId}
                onChange={(e) =>
                  setNovaAvaliacao({
                    ...novaAvaliacao,
                    disciplinaId: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
              >
                {materias.length === 0 ? (
                  <option value="">Geral / Sem matéria</option>
                ) : (
                  materias.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Data da Avaliação
              </label>
              <input
                type="date"
                required
                value={novaAvaliacao.data}
                onChange={(e) =>
                  setNovaAvaliacao({ ...novaAvaliacao, data: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Horário
              </label>
              <input
                type="text"
                placeholder="19:00"
                value={novaAvaliacao.horario}
                onChange={(e) =>
                  setNovaAvaliacao({ ...novaAvaliacao, horario: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Conteúdo Programático / Instruções
            </label>
            <textarea
              rows={3}
              placeholder="Descreva o conteúdo que cairá ou orientações para a entrega..."
              value={novaAvaliacao.descricao}
              onChange={(e) =>
                setNovaAvaliacao({ ...novaAvaliacao, descricao: e.target.value })
              }
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setIsModalAvaliacaoOpen(false)}
              className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg font-medium text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs shadow-xs"
            >
              Salvar Avaliação
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
