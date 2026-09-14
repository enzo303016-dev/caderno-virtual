import { Aula, ChecklistEstudo, StatusAula, Materia, Anotacao, SessaoEstudo } from '../types';

export const DEFAULT_CHECKLIST: ChecklistEstudo = {
  assistirConteudo: false,
  estudarPdf: false,
  fazerAnotacoes: false,
  fazerResumoQuadros: false,
  criarMapaMental: false,
  revisarAula: false,
  resolverQuestoes: false,
};

export interface ChecklistItemConfig {
  key: keyof ChecklistEstudo;
  label: string;
  descricao: string;
}

export const CHECKLIST_ITEMS_CONFIG: ChecklistItemConfig[] = [
  {
    key: 'assistirConteudo',
    label: 'Aula assistida',
    descricao: 'Assistir ou acompanhar o conteúdo da aula',
  },
  {
    key: 'estudarPdf',
    label: 'PDF lido',
    descricao: 'Leitura atenta dos slides ou arquivos PDF da aula',
  },
  {
    key: 'fazerAnotacoes',
    label: 'Resumo feito',
    descricao: 'Elaborar resumos ou anotações conceituais da matéria',
  },
  {
    key: 'criarMapaMental',
    label: 'Mapa mental feito',
    descricao: 'Estruturar mapas mentais com as ramificações jurídicas',
  },
  {
    key: 'revisarAula',
    label: 'Revisão concluída',
    descricao: 'Revisão espaçada dos conceitos e pontos fundamentais',
  },
];

// Mapeamento exato de percentuais conforme especificação (5 itens):
// 0 itens concluídos = 0%
// 1 = 20%
// 2 = 40%
// 3 = 60%
// 4 = 80%
// 5 = 100%
export const CHECKLIST_PERCENTAGES: Record<number, number> = {
  0: 0,
  1: 20,
  2: 40,
  3: 60,
  4: 80,
  5: 100,
};

export interface ProgressoChecklistResult {
  completedCount: number;
  totalCount: number;
  percentage: number;
  isConcluida: boolean;
}

export function getChecklistProgress(checklist?: Partial<ChecklistEstudo>): ProgressoChecklistResult {
  const list = checklist || {};
  const items = [
    list.assistirConteudo,
    list.estudarPdf,
    list.fazerAnotacoes || list.fazerResumoQuadros,
    list.criarMapaMental,
    list.revisarAula,
  ];
  const completedCount = items.filter(Boolean).length;
  const totalCount = 5;
  const percentage = CHECKLIST_PERCENTAGES[completedCount] ?? (completedCount * 20);
  const isConcluida = completedCount === totalCount;

  return {
    completedCount,
    totalCount,
    percentage,
    isConcluida,
  };
}

export interface StatusConfig {
  id: StatusAula;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
}

export const STATUS_AULA_LIST: StatusConfig[] = [
  {
    id: 'nao_iniciada',
    label: 'Não iniciada',
    badgeBg: 'bg-stone-100',
    badgeText: 'text-stone-600',
    badgeBorder: 'border-stone-200',
    dotColor: 'bg-stone-400',
  },
  {
    id: 'em_estudo',
    label: 'Em estudo',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    dotColor: 'bg-amber-500',
  },
  {
    id: 'estudada',
    label: 'Estudada',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-800',
    badgeBorder: 'border-blue-200',
    dotColor: 'bg-blue-600',
  },
  {
    id: 'revisada',
    label: 'Revisada',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-200',
    dotColor: 'bg-emerald-600',
  },
];

export function getStatusConfig(status?: StatusAula): StatusConfig {
  const safeStatus = status || 'nao_iniciada';
  return (
    STATUS_AULA_LIST.find((s) => s.id === safeStatus) || STATUS_AULA_LIST[0]
  );
}

export function ensureAulaDefaults(aula: Aula): Aula {
  return {
    ...aula,
    status: aula.status || 'nao_iniciada',
    checklist: {
      assistirConteudo: !!aula.checklist?.assistirConteudo,
      estudarPdf: !!aula.checklist?.estudarPdf,
      fazerAnotacoes: !!aula.checklist?.fazerAnotacoes,
      fazerResumoQuadros: !!aula.checklist?.fazerResumoQuadros,
      criarMapaMental: !!aula.checklist?.criarMapaMental,
      revisarAula: !!aula.checklist?.revisarAula,
      resolverQuestoes: !!aula.checklist?.resolverQuestoes,
    },
  };
}

export interface DisciplinaEstatisticas {
  totalAulas: number;
  aulasEstudadas: number;
  aulasRevisadas: number;
  aulasConcluidas: number;
  progressoGeralPercent: number;
}

export function getDisciplinaEstatisticas(
  materiaId: string,
  todasAulas: Aula[]
): DisciplinaEstatisticas {
  const aulasDaMateria = todasAulas.filter((a) => a.materiaId === materiaId);
  const totalAulas = aulasDaMateria.length;

  if (totalAulas === 0) {
    return {
      totalAulas: 0,
      aulasEstudadas: 0,
      aulasRevisadas: 0,
      aulasConcluidas: 0,
      progressoGeralPercent: 0,
    };
  }

  const aulasEstudadas = aulasDaMateria.filter((a) => a.status === 'estudada').length;
  const aulasRevisadas = aulasDaMateria.filter((a) => a.status === 'revisada').length;
  const aulasConcluidas = aulasDaMateria.filter(
    (a) => getChecklistProgress(a.checklist).isConcluida
  ).length;

  // Percentual geral: proporção de aulas concluídas em relação ao total
  const progressoGeralPercent = Math.round((aulasConcluidas / totalAulas) * 100);

  return {
    totalAulas,
    aulasEstudadas,
    aulasRevisadas,
    aulasConcluidas,
    progressoGeralPercent,
  };
}

export interface DashboardProgressoResumo {
  totalAulas: number;
  aulasConcluidas: number;
  aulasParaRevisar: number;
  progressoGeralPercent: number;
  progressoPorDisciplina: {
    materia: Materia;
    totalAulas: number;
    aulasConcluidas: number;
    progressoPercent: number;
  }[];
}

export function getDashboardProgresso(
  aulas: Aula[],
  materias: Materia[]
): DashboardProgressoResumo {
  const totalAulas = aulas.length;
  const aulasConcluidas = aulas.filter(
    (a) => getChecklistProgress(a.checklist).isConcluida
  ).length;

  // Aulas para revisar: aulas com status 'estudada' ou 'revisada' ou cujo item 'revisarAula' ainda não foi marcado
  const aulasParaRevisar = aulas.filter(
    (a) => a.status === 'estudada' || a.status === 'revisada' || (!a.checklist?.revisarAula && a.status === 'em_estudo')
  ).length;

  const progressoGeralPercent =
    totalAulas > 0 ? Math.round((aulasConcluidas / totalAulas) * 100) : 0;

  const progressoPorDisciplina = materias.map((m) => {
    const aulasMateria = aulas.filter((a) => a.materiaId === m.id);
    const qtdAulas = aulasMateria.length;
    if (qtdAulas === 0) {
      return {
        materia: m,
        totalAulas: 0,
        aulasConcluidas: 0,
        progressoPercent: 0,
      };
    }
    const concluidas = aulasMateria.filter(
      (a) => getChecklistProgress(a.checklist).isConcluida
    ).length;

    // Média de percentual de checklist de cada aula para maior precisão (ex: 65%, 40%)
    const somaPercentuais = aulasMateria.reduce((acc, aula) => {
      return acc + getChecklistProgress(aula.checklist).percentage;
    }, 0);
    const progressoPercent = Math.round(somaPercentuais / qtdAulas);

    return {
      materia: m,
      totalAulas: qtdAulas,
      aulasConcluidas: concluidas,
      progressoPercent,
    };
  });

  return {
    totalAulas,
    aulasConcluidas,
    aulasParaRevisar,
    progressoGeralPercent,
    progressoPorDisciplina,
  };
}

export interface RevisionLogEntry {
  id: string;
  aulaId: string;
  aulaTitulo: string;
  disciplina: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timestamp: string;
}

export const REVISION_LOG_KEY = 'caderno_direito_revisoes_log';

export function getRevisionLogs(): RevisionLogEntry[] {
  try {
    const saved = localStorage.getItem(REVISION_LOG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Erro ao ler logs de revisão:', e);
  }
  return [];
}

export function saveRevisionLog(log: Omit<RevisionLogEntry, 'id' | 'timestamp'>): RevisionLogEntry[] {
  const current = getRevisionLogs();
  const newEntry: RevisionLogEntry = {
    ...log,
    id: 'rev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    timestamp: new Date().toISOString(),
  };
  const updated = [newEntry, ...current];
  try {
    localStorage.setItem(REVISION_LOG_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Erro ao salvar log de revisão:', e);
  }
  return updated;
}

export interface RevisionEstatisticas {
  totalRevisoes: number;
  mediaAproveitamento: number;
  melhorResultado: number;
  qtd80Mais: number;
  temRevisoes: boolean;
}

export function getRevisionEstatisticas(aulas: Aula[]): RevisionEstatisticas {
  const logs = getRevisionLogs();
  let percentages: number[] = logs.map((l) => l.percentage);

  if (percentages.length === 0) {
    const aulasComRevisao = aulas.filter(
      (a) => a.checklist?.revisarAula || a.status === 'revisada'
    );
    if (aulasComRevisao.length > 0) {
      percentages = aulasComRevisao.map(() => 100);
    }
  }

  if (percentages.length === 0) {
    return {
      totalRevisoes: 0,
      mediaAproveitamento: 0,
      melhorResultado: 0,
      qtd80Mais: 0,
      temRevisoes: false,
    };
  }

  const totalRevisoes = percentages.length;
  const soma = percentages.reduce((acc, val) => acc + val, 0);
  const mediaAproveitamento = Math.round(soma / totalRevisoes);
  const melhorResultado = Math.max(...percentages);
  const qtd80Mais = percentages.filter((val) => val >= 80).length;

  return {
    totalRevisoes,
    mediaAproveitamento,
    melhorResultado,
    qtd80Mais,
    temRevisoes: true,
  };
}

export interface AulaAtencaoItem {
  aula: Aula;
  materia?: Materia;
  motivo: string;
  scoreOuProgresso: number;
  prioridade: number;
}

export function getAulasAtencao(aulas: Aula[], materias: Materia[]): AulaAtencaoItem[] {
  const logs = getRevisionLogs();
  const result: AulaAtencaoItem[] = [];

  aulas.forEach((aula) => {
    const materia = materias.find((m) => m.id === aula.materiaId);
    const progress = getChecklistProgress(aula.checklist);
    const aulaLogs = logs.filter((l) => l.aulaId === aula.id);
    const lastLog = aulaLogs[0];

    if (lastLog && lastLog.percentage < 60) {
      result.push({
        aula,
        materia,
        motivo: `Revisão com ${lastLog.percentage}% de aproveitamento`,
        scoreOuProgresso: lastLog.percentage,
        prioridade: 100 - lastLog.percentage,
      });
    } else if (progress.percentage < 60 && aula.status !== 'nao_iniciada') {
      result.push({
        aula,
        materia,
        motivo: `Progresso baixo (${progress.percentage}% do checklist)`,
        scoreOuProgresso: progress.percentage,
        prioridade: 60 - progress.percentage,
      });
    }
  });

  result.sort((a, b) => b.prioridade - a.prioridade);
  return result;
}

export interface AtividadeRecente {
  id: string;
  tipo: 'aula_concluida' | 'pdf_lido' | 'revisao_realizada' | 'resumo_feito' | 'mapa_mental_feito' | 'estudo';
  titulo: string;
  disciplina: string;
  descricaoAcao: string;
  data: string;
  aulaId?: string;
  materiaId?: string;
  corMateria?: string;
}

export function getUltimasAtividades(
  aulas: Aula[],
  anotacoes: Anotacao[],
  sessoes: SessaoEstudo[],
  materias: Materia[]
): AtividadeRecente[] {
  const logs = getRevisionLogs();
  const atividades: AtividadeRecente[] = [];

  logs.forEach((log) => {
    const materia = materias.find((m) => m.nome.toLowerCase() === log.disciplina.toLowerCase());
    atividades.push({
      id: log.id,
      tipo: 'revisao_realizada',
      titulo: log.aulaTitulo,
      disciplina: log.disciplina,
      descricaoAcao: `Revisão realizada com ${log.percentage}% de aproveitamento`,
      data: log.timestamp ? log.timestamp.split('T')[0] : new Date().toISOString().split('T')[0],
      aulaId: log.aulaId,
      materiaId: materia?.id,
      corMateria: materia?.cor,
    });
  });

  anotacoes.forEach((anotacao) => {
    const materia = materias.find((m) => m.id === anotacao.disciplinaId || m.nome === anotacao.disciplina);
    let desc = 'Resumo feito';
    let tipo: AtividadeRecente['tipo'] = 'resumo_feito';
    if (anotacao.tipo === 'mapa_mental') {
      desc = 'Mapa mental feito';
      tipo = 'mapa_mental_feito';
    } else if (anotacao.tipo === 'quadros') {
      desc = 'Resumo em quadros feito';
      tipo = 'resumo_feito';
    }
    atividades.push({
      id: anotacao.id,
      tipo,
      titulo: anotacao.titulo,
      disciplina: anotacao.disciplina,
      descricaoAcao: desc,
      data: anotacao.data,
      aulaId: anotacao.aulaRelacionadaId,
      materiaId: materia?.id,
      corMateria: materia?.cor,
    });
  });

  aulas.forEach((aula) => {
    const materia = materias.find((m) => m.id === aula.materiaId);
    const progress = getChecklistProgress(aula.checklist);
    if (progress.isConcluida) {
      atividades.push({
        id: aula.id + '-concluuida',
        tipo: 'aula_concluida',
        titulo: aula.titulo,
        disciplina: aula.disciplina,
        descricaoAcao: 'Aula concluída (100%)',
        data: aula.data,
        aulaId: aula.id,
        materiaId: materia?.id,
        corMateria: materia?.cor,
      });
    } else if (aula.checklist?.estudarPdf) {
      atividades.push({
        id: aula.id + '-pdf',
        tipo: 'pdf_lido',
        titulo: aula.titulo,
        disciplina: aula.disciplina,
        descricaoAcao: 'PDF lido',
        data: aula.data,
        aulaId: aula.id,
        materiaId: materia?.id,
        corMateria: materia?.cor,
      });
    }
  });

  sessoes.forEach((sessao) => {
    const materia = materias.find((m) => m.nome.toLowerCase() === sessao.disciplina.toLowerCase());
    atividades.push({
      id: sessao.id,
      tipo: 'estudo',
      titulo: sessao.titulo,
      disciplina: sessao.disciplina,
      descricaoAcao: `Sessão de estudo (${sessao.tipo} - ${sessao.duracaoMinutos} min)`,
      data: sessao.data,
      materiaId: materia?.id,
      corMateria: materia?.cor,
    });
  });

  atividades.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  const uniqueList: AtividadeRecente[] = [];
  const seenKeys = new Set<string>();

  for (const item of atividades) {
    const key = `${item.tipo}-${item.aulaId || item.id}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueList.push(item);
    }
  }

  return uniqueList.slice(0, 6);
}

export function calcularSequenciaEstudos(
  aulas: Aula[],
  anotacoes: Anotacao[],
  sessoes: SessaoEstudo[]
): { diasConsecutivos: number; temSequencia: boolean } {
  const logDates = getRevisionLogs().map((l) => l.timestamp.split('T')[0]);
  const aulaDates = aulas
    .filter((a) => a.status !== 'nao_iniciada' || (a.checklist && Object.values(a.checklist).some(Boolean)))
    .map((a) => a.data);
  const anotacaoDates = anotacoes.map((n) => n.data);
  const sessaoDates = sessoes.map((s) => s.data);

  const setDatas = new Set<string>([...logDates, ...aulaDates, ...anotacaoDates, ...sessaoDates].filter(Boolean));

  if (setDatas.size === 0) {
    return { diasConsecutivos: 0, temSequencia: false };
  }

  let checkDate = new Date();
  let currentStr = checkDate.toISOString().split('T')[0];

  if (!setDatas.has(currentStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
    currentStr = checkDate.toISOString().split('T')[0];
    if (!setDatas.has(currentStr)) {
      return { diasConsecutivos: 0, temSequencia: false };
    }
  }

  let streak = 0;
  while (setDatas.has(currentStr)) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
    currentStr = checkDate.toISOString().split('T')[0];
  }

  return {
    diasConsecutivos: streak,
    temSequencia: streak > 0,
  };
}

