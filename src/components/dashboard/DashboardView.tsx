import React from 'react';
import {
  BookOpen,
  Calendar,
  FileText,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Scale,
  Star,
  BarChart3,
  Brain,
  Flame,
  History,
  AlertTriangle,
  Check,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MenuSection } from '../../types';
import {
  getDashboardProgresso,
  getRevisionEstatisticas,
  getAulasAtencao,
  getUltimasAtividades,
  calcularSequenciaEstudos,
} from '../../utils/estudoTracking';

interface DashboardViewProps {
  onNavigate: (section: MenuSection) => void;
  onOpenNewNote: () => void;
  onOpenNewClass: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenNewNote,
}) => {
  const {
    perfil,
    materias,
    aulas,
    anotacoes,
    eventos,
    metas,
    sessoes,
    toggleFavoritoAnotacao,
    setSelectedAulaIdToView,
    setSelectedMateriaId,
  } = useApp();

  // Upcoming classes (sorted by date)
  const proximasAulas = [...aulas]
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    .slice(0, 3);

  // Latest notes
  const ultimasAnotacoes = [...anotacoes].slice(0, 4);

  // Next upcoming events (provas, trabalhos, prazos)
  const proximasAvaliacoes = [...eventos]
    .filter((e) => e.tipo === 'prova' || e.tipo === 'trabalho' || e.tipo === 'prazo')
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    .slice(0, 3);

  // Study progress calculation
  const totalHorasMeta = metas.reduce((acc, m) => acc + m.horasSemanaisMeta, 0);
  const totalHorasRealizadas = metas.reduce((acc, m) => acc + m.horasRealizadas, 0);
  const progressoPercent = totalHorasMeta > 0
    ? Math.min(100, Math.round((totalHorasRealizadas / totalHorasMeta) * 100))
    : 0;

  // Real tracking data calculations
  const progressoEstudos = getDashboardProgresso(aulas, materias);
  const revisoesStats = getRevisionEstatisticas(aulas);
  const aulasAtencao = getAulasAtencao(aulas, materias);
  const ultimasAtividades = getUltimasAtividades(aulas, anotacoes, sessoes, materias);
  const sequenciaEstudos = calcularSequenciaEstudos(aulas, anotacoes, sessoes);

  return (
    <div id="dashboard-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div
        id="dashboard-welcome-banner"
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white p-6 sm:p-8 border border-stone-800 shadow-md"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
              <Scale className="w-3.5 h-3.5" />
              <span>Estudos Jurídicos • {perfil.semestreAtual || 'Novo Semestre'}</span>
            </div>
            <h1
              id="dashboard-user-name"
              className="text-2xl sm:text-3xl font-bold font-serif tracking-tight"
            >
              {perfil.nome ? `Bem-vindo, ${perfil.nome}!` : 'Bem-vindo ao seu Caderno Virtual!'}
            </h1>
            <p className="text-stone-300 text-sm leading-relaxed">
              Mantenha o foco em suas matérias, leituras de jurisprudência e doutrina.
              Seu cronograma acadêmico está pronto para você organizar.
            </p>
          </div>

          {/* Quick Metrics on Banner */}
          <div className="flex items-center gap-3 sm:gap-4 self-start md:self-auto">
            <button
              type="button"
              onClick={onOpenNewNote}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
            >
              + Nova Anotação
            </button>
            <button
              type="button"
              onClick={() => onNavigate('semestre')}
              className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold border border-stone-700 transition-colors flex items-center gap-1.5"
            >
              <span>Ver Semestre</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Ambient subtle decorative circle */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Grid: 4 Core Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Quantidade de Matérias */}
        <div
          id="stat-materias"
          onClick={() => onNavigate('materias')}
          className="bg-white rounded-xl p-5 border border-stone-200/80 shadow-xs hover:border-amber-400/60 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Disciplinas
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900 font-serif">
            {materias.length}
          </div>
          <div className="text-xs text-stone-500 mt-1 flex items-center justify-between">
            <span>{perfil.semestreAtual ? `Cadastradas no ${perfil.semestreAtual}` : 'Cadastradas no semestre'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Semestre Atual */}
        <div
          id="stat-semestre"
          onClick={() => onNavigate('semestre')}
          className="bg-white rounded-xl p-5 border border-stone-200/80 shadow-xs hover:border-amber-400/60 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Semestre Atual
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900 font-serif">
            {perfil.semestreAtual || 'Não informado'}
          </div>
          <div className="text-xs text-stone-500 mt-1 flex items-center justify-between">
            <span>Turno: {perfil.turno || 'Tarde'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Sequência de Estudos */}
        <div
          id="stat-sequencia"
          onClick={() => onNavigate('aulas')}
          className="bg-white rounded-xl p-5 border border-stone-200/80 shadow-xs hover:border-amber-400/60 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Sequência
            </span>
            <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-current" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900 font-serif">
            {sequenciaEstudos.temSequencia ? `${sequenciaEstudos.diasConsecutivos}d` : '0d'}
          </div>
          <div className="text-xs text-stone-500 mt-1 flex items-center justify-between">
            <span className="truncate max-w-[140px]">
              {sequenciaEstudos.temSequencia ? 'Dias consecutivos' : 'Sem sequência'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Anotações */}
        <div
          id="stat-anotacoes"
          onClick={() => onNavigate('materias')}
          className="bg-white rounded-xl p-5 border border-stone-200/80 shadow-xs hover:border-amber-400/60 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Anotações Feitas
            </span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900 font-serif">
            {anotacoes.length}
          </div>
          <div className="text-xs text-stone-500 mt-1 flex items-center justify-between">
            <span>{anotacoes.filter((a) => a.favorito).length} favoritas</span>
            <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* SEÇÃO PRINCIPAL: 📊 MEU DESEMPENHO */}
      <div id="secao-meu-desempenho" className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
                <span>📊 Meu Desempenho</span>
              </h2>
              <p className="text-2xs text-stone-500">
                Resumo visual do seu progresso, revisões e histórico dos estudos
              </p>
            </div>
          </div>
        </div>

        {/* PARTE 1, 3 & 6: 3 CARDS SUPERIORES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. PROGRESSO GERAL */}
          <div className="bg-stone-50/80 p-5 rounded-xl border border-stone-200/70 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold text-stone-500 uppercase tracking-wider">
                Progresso geral
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-100/80 text-amber-800 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-stone-900 font-serif">
                  {progressoEstudos.progressoGeralPercent}%
                </span>
              </div>
              <p className="text-xs font-medium text-stone-600 mt-1">
                {progressoEstudos.aulasConcluidas} de {progressoEstudos.totalAulas} aulas concluídas
              </p>
            </div>

            <div className="space-y-1 pt-1">
              <div className="w-full h-2 bg-stone-200/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600 rounded-full transition-all duration-500"
                  style={{ width: `${progressoEstudos.progressoGeralPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* 3. REVISÕES COM IA */}
          <div className="bg-purple-50/50 p-5 rounded-xl border border-purple-200/60 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>🧠 Revisões</span>
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center">
                <Brain className="w-4 h-4" />
              </div>
            </div>

            {!revisoesStats.temRevisoes ? (
              <div className="space-y-2 py-1">
                <p className="text-xs font-medium text-stone-600">
                  Você ainda não realizou nenhuma revisão.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('aulas')}
                  className="text-2xs font-semibold text-purple-700 hover:text-purple-800 underline block cursor-pointer"
                >
                  Ir para as Aulas e testar com IA →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/80 p-2 rounded-lg border border-purple-100">
                  <span className="text-3xs text-stone-500 block">Revisões</span>
                  <span className="font-bold text-stone-900">{revisoesStats.totalRevisoes}</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-purple-100">
                  <span className="text-3xs text-stone-500 block">Média</span>
                  <span className="font-bold text-purple-800">{revisoesStats.mediaAproveitamento}%</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-purple-100">
                  <span className="text-3xs text-stone-500 block">Melhor resultado</span>
                  <span className="font-bold text-emerald-700">{revisoesStats.melhorResultado}%</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-purple-100">
                  <span className="text-3xs text-stone-500 block">Com 80%+</span>
                  <span className="font-bold text-stone-900">{revisoesStats.qtd80Mais}</span>
                </div>
              </div>
            )}
          </div>

          {/* 6. SEQUÊNCIA DE ESTUDOS */}
          <div className="bg-orange-50/40 p-5 rounded-xl border border-orange-200/60 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold text-orange-950 uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-600 fill-orange-500" />
                <span>Sequência de estudos</span>
              </span>
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
                <Flame className="w-4 h-4 fill-current" />
              </div>
            </div>

            <div>
              {sequenciaEstudos.temSequencia ? (
                <div className="space-y-1">
                  <span className="text-2xl font-bold font-serif text-orange-900 block">
                    {sequenciaEstudos.diasConsecutivos} {sequenciaEstudos.diasConsecutivos === 1 ? 'dia consecutivo' : 'dias consecutivos'}
                  </span>
                  <p className="text-2xs text-stone-600">
                    Mantenha a constância para acelerar seu aprendizado!
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-stone-700">
                    Comece a estudar para criar sua sequência.
                  </p>
                  <p className="text-3xs text-stone-500">
                    Complete aulas, leia PDFs ou faça anotações diariamente.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PARTE 2: DESEMPENHO POR MATÉRIA */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Desempenho por Matéria
            </h3>
            <span className="text-2xs text-stone-500">
              {materias.length} {materias.length === 1 ? 'matéria' : 'matérias'}
            </span>
          </div>

          {progressoEstudos.progressoPorDisciplina.length === 0 ? (
            <p className="text-xs text-stone-400 py-3 text-center">
              Nenhuma matéria cadastrada
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {progressoEstudos.progressoPorDisciplina.map((item) => (
                <div
                  key={item.materia.id}
                  onClick={() => {
                    setSelectedMateriaId(item.materia.id);
                    onNavigate('materias');
                  }}
                  className="p-4 rounded-xl bg-stone-50/70 border border-stone-200/80 hover:border-amber-400/80 hover:bg-white transition cursor-pointer space-y-2.5 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.materia.cor || '#d97706' }}
                      />
                      <h4 className="text-xs font-bold text-stone-900 truncate group-hover:text-amber-800 transition-colors">
                        {item.materia.nome}
                      </h4>
                    </div>
                    <span className="text-xs font-extrabold text-stone-900 shrink-0">
                      {item.progressoPercent}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-3xs text-stone-500">
                    <span>
                      {item.aulasConcluidas}/{item.totalAulas} {item.totalAulas === 1 ? 'aula' : 'aulas'}
                    </span>
                    <span className="group-hover:translate-x-0.5 transition-transform flex items-center text-amber-700 font-semibold">
                      Ver matéria <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-stone-200/70 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-400"
                      style={{
                        width: `${item.progressoPercent}%`,
                        backgroundColor: item.materia.cor || '#d97706',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PARTE 4 & 5: AULAS QUE PRECISAM DE ATENÇÃO & ÚLTIMAS ATIVIDADES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* 4. AULAS QUE PRECISAM DE ATENÇÃO */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>⚠️ Precisa de atenção</span>
            </h3>

            {aulasAtencao.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-emerald-900 text-xs font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>✓ Nenhuma aula precisa de atenção no momento.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {aulasAtencao.slice(0, 4).map((item) => (
                  <div
                    key={item.aula.id}
                    onClick={() => {
                      setSelectedMateriaId(item.aula.materiaId);
                      setSelectedAulaIdToView(item.aula.id);
                      onNavigate('aulas');
                    }}
                    className="p-3.5 rounded-xl bg-amber-50/40 border border-amber-200/60 hover:bg-amber-50 hover:border-amber-300 transition cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-3xs font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                          {item.aula.disciplina}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-stone-900 truncate group-hover:text-amber-800 transition-colors">
                        {item.aula.titulo}
                      </h4>
                      <p className="text-3xs text-stone-500">
                        {item.motivo}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 bg-white border border-amber-200 px-2.5 py-1 rounded-lg shadow-2xs">
                        <span>{item.scoreOuProgresso}%</span>
                        <ArrowRight className="w-3 h-3 text-amber-700 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. ÚLTIMAS ATIVIDADES */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-stone-600" />
              <span>🕒 Últimas atividades</span>
            </h3>

            {ultimasAtividades.length === 0 ? (
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-stone-500 text-xs text-center">
                Nenhuma atividade recente registrada.
              </div>
            ) : (
              <div className="space-y-2">
                {ultimasAtividades.map((act) => (
                  <div
                    key={act.id}
                    onClick={() => {
                      if (act.aulaId) {
                        if (act.materiaId) setSelectedMateriaId(act.materiaId);
                        setSelectedAulaIdToView(act.aulaId);
                        onNavigate('aulas');
                      } else if (act.materiaId) {
                        setSelectedMateriaId(act.materiaId);
                        onNavigate('materias');
                      } else {
                        onNavigate('aulas');
                      }
                    }}
                    className="p-3 rounded-xl bg-stone-50/70 border border-stone-200/70 hover:bg-white hover:border-amber-300 transition cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: act.corMateria || '#78716c' }}
                      />
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-900 truncate group-hover:text-amber-800 transition-colors">
                            {act.titulo}
                          </span>
                        </div>
                        <p className="text-3xs text-stone-500 truncate">
                          <span className="font-semibold text-stone-700">{act.descricaoAcao}</span> • {act.disciplina}
                        </p>
                      </div>
                    </div>

                    <span className="text-3xs font-mono text-stone-400 shrink-0">
                      {act.data.split('-').reverse().slice(0, 2).join('/')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Próximos Estudos, Próximas Aulas & Últimas Anotações */}
        <div className="lg:col-span-2 space-y-6">
          {/* 📚 Próximos estudos */}
          <div id="secao-proximos-estudos" className="bg-white rounded-xl border border-stone-200/90 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-stone-900 text-base">
                    📚 Próximos estudos
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('estudos')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1"
              >
                <span>+ Planejar estudo</span>
              </button>
            </div>

            <div className="p-5">
              {sessoes.length === 0 ? (
                <div className="text-center py-6 space-y-3">
                  <p className="text-xs text-stone-500">
                    Nenhum estudo planejado.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('estudos')}
                    className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5"
                  >
                    <span>+ Planejar estudo</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...sessoes]
                    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
                    .slice(0, 4)
                    .map((sessao) => {
                      const materia = materias.find((m) => m.nome === sessao.disciplina || m.id === sessao.materiaId);
                      const statusAtual = sessao.status || 'planejado';
                      const isConcluido = statusAtual === 'concluido';
                      const isEmAndamento = statusAtual === 'em_andamento';

                      return (
                        <div
                          key={sessao.id}
                          onClick={() => {
                            if (sessao.aulaId) {
                              setSelectedMateriaId(materia?.id || null);
                              setSelectedAulaIdToView(sessao.aulaId);
                              onNavigate('aulas');
                            } else {
                              onNavigate('estudos');
                            }
                          }}
                          className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:shadow-xs ${
                            isConcluido
                              ? 'bg-emerald-50/40 border-emerald-200'
                              : isEmAndamento
                              ? 'bg-amber-50/40 border-amber-300'
                              : 'bg-stone-50/70 border-stone-200 hover:bg-white hover:border-amber-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: materia?.cor || '#d97706' }}
                            />
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-stone-900 group-hover:text-amber-700 transition-colors">
                                  {sessao.disciplina}
                                </span>
                                {sessao.aulaTitulo && (
                                  <span className="text-3xs font-medium text-stone-600 bg-white border border-stone-200 px-1.5 py-0.5 rounded truncate max-w-[200px]">
                                    Aula: {sessao.aulaTitulo}
                                  </span>
                                )}
                              </div>
                              <p className="text-2xs text-stone-600 line-clamp-1 font-medium">
                                {sessao.titulo}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
                            <span className="text-3xs font-mono font-semibold text-stone-600 bg-white border border-stone-200 px-2 py-1 rounded-md">
                              ⏱ {sessao.duracaoMinutos} min
                            </span>
                            <span className="text-3xs font-mono text-stone-400">
                              {sessao.data.split('-').reverse().slice(0, 2).join('/')}
                            </span>
                            <span
                              className={`text-3xs font-bold px-2 py-0.5 rounded ${
                                isConcluido
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isEmAndamento
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-stone-200 text-stone-700'
                              }`}
                            >
                              {isConcluido ? '✓ Concluído' : isEmAndamento ? '⏳ Em andamento' : '☐ Planejado'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Próximas Aulas */}
          <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-stone-100 text-stone-700 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-stone-900 text-base">
                  Próximas Aulas
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('materias')}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                <span>Ver todas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-5 divide-y divide-stone-100">
              {proximasAulas.length === 0 ? (
                <div className="text-center py-8 text-stone-400 text-xs">
                  Nenhuma aula cadastrada
                </div>
              ) : (
                proximasAulas.map((aula) => {
                  const materia = materias.find((m) => m.id === aula.materiaId);
                  return (
                    <div
                      key={aula.id}
                      onClick={() => {
                        setSelectedMateriaId(materia?.id || null);
                        setSelectedAulaIdToView(aula.id);
                        onNavigate('aulas');
                      }}
                      className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group cursor-pointer hover:bg-stone-50 transition px-2 rounded-lg -mx-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: materia?.cor || '#64748b' }}
                          />
                          <span className="text-xs font-semibold text-stone-700">
                            {aula.disciplina}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-stone-900 group-hover:text-amber-700 transition-colors">
                          {aula.titulo}
                        </h4>
                        <p className="text-xs text-stone-500 line-clamp-1">
                          {aula.conteudo}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 text-xs text-stone-600 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-lg">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>{aula.data.split('-').reverse().slice(0, 2).join('/')}</span>
                        <span className="text-stone-300">•</span>
                        <span>{aula.horario}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Últimas Anotações */}
          <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-stone-100 text-stone-700 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-stone-900 text-base">
                  Últimas Anotações
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('materias')}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                <span>Ver todas ({anotacoes.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {ultimasAnotacoes.length === 0 ? (
              <div className="p-8 text-center text-stone-400 text-xs">
                Nenhuma anotação cadastrada
              </div>
            ) : (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {ultimasAnotacoes.map((anotacao) => (
                  <div
                    key={anotacao.id}
                    onClick={() => onNavigate('materias')}
                    className="p-4 rounded-xl bg-stone-50/70 border border-stone-200 hover:bg-white hover:border-amber-300 hover:shadow-sm transition cursor-pointer flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-stone-600 bg-stone-200/60 px-2 py-0.5 rounded">
                          {anotacao.disciplina}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoritoAnotacao(anotacao.id);
                          }}
                          className={`p-1 rounded hover:bg-stone-100 ${
                            anotacao.favorito ? 'text-amber-500' : 'text-stone-300'
                          }`}
                          title={anotacao.favorito ? 'Favorita' : 'Favoritar'}
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                      <h4 className="text-sm font-semibold text-stone-900 line-clamp-1">
                        {anotacao.titulo}
                      </h4>
                      <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        {anotacao.conteudo.replace(/[*#`]/g, '')}
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-400">
                      <span>{anotacao.data.split('-').reverse().join('/')}</span>
                      <div className="flex gap-1 overflow-hidden">
                        {anotacao.tags.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="bg-amber-100/60 text-amber-800 text-[10px] px-1.5 py-0.5 rounded"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Meta de Horas e Próximas Avaliações */}
        <div className="space-y-6">
          {/* Progresso dos Estudos Detalhado */}
          <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Metas Semanais</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('estudos')}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800"
              >
                Gerenciar
              </button>
            </div>

            {/* Main Progress Bar */}
            <div className="space-y-2 mb-5">
              <div className="flex justify-between text-xs font-medium text-stone-600">
                <span>Cumprimento Semanal</span>
                <span className="font-bold text-stone-900">
                  {totalHorasRealizadas}h / {totalHorasMeta}h
                </span>
              </div>
              <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600 rounded-full transition-all duration-500"
                  style={{ width: `${progressoPercent}%` }}
                />
              </div>
            </div>

            {/* Category breakdown */}
            <div className="space-y-3">
              {metas.length === 0 ? (
                <p className="text-xs text-stone-400 py-4 text-center">
                  Nenhuma meta de estudo cadastrada
                </p>
              ) : (
                metas.map((meta) => {
                  const percent = Math.min(
                    100,
                    Math.round((meta.horasRealizadas / meta.horasSemanaisMeta) * 100)
                  );
                  return (
                    <div key={meta.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-stone-700 font-medium truncate max-w-[170px]">
                          {meta.titulo}
                        </span>
                        <span className="text-stone-500 font-mono text-[11px]">
                          {meta.horasRealizadas}h / {meta.horasSemanaisMeta}h
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-stone-700 rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              type="button"
              onClick={() => onNavigate('estudos')}
              className="mt-5 w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold transition-colors text-center"
            >
              Registrar Sessão de Estudo
            </button>
          </div>

          {/* Próximas Avaliações & Prazos */}
          <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Prazos & Avaliações</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('calendario')}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800"
              >
                Calendário
              </button>
            </div>

            <div className="space-y-3">
              {proximasAvaliacoes.length === 0 ? (
                <p className="text-xs text-stone-400 py-4 text-center">
                  Nenhum evento no calendário
                </p>
              ) : (
                proximasAvaliacoes.map((item) => {
                  const isProva = item.tipo === 'prova';
                  const isTrabalho = item.tipo === 'trabalho';
                  const badgeColor = isProva
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : isTrabalho
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200';

                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg border border-stone-200 bg-stone-50/50 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeColor}`}
                        >
                          {item.tipo}
                        </span>
                        <span className="text-[11px] font-mono text-stone-500">
                          {item.data.split('-').reverse().slice(0, 2).join('/')}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-stone-800 line-clamp-1">
                        {item.titulo}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {item.disciplina}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
