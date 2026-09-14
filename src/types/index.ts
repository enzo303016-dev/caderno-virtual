export type DiaSemana =
  | 'Segunda-feira'
  | 'Terça-feira'
  | 'Quarta-feira'
  | 'Quinta-feira'
  | 'Sexta-feira'
  | 'Sábado';

export type TipoEvento =
  | 'aula'
  | 'prova'
  | 'trabalho'
  | 'prazo'
  | 'estudo'
  | 'institucional'
  | 'feriado';

export interface Materia {
  id: string;
  nome: string;
  professor: string;
  semestre: string;
  diaSemana: DiaSemana;
  horario: string; // Ex: "08:00 - 09:40"
  sala: string;
  cor: string; // Hex color code
  descricao: string;
}

export interface AulaMaterialPdf {
  nome: string;
  tamanho?: number; // Tamanho em bytes
  tamanhoFormatado?: string; // Ex: "1.8 MB", "340 KB"
  dataUpload?: string;
  tipo?: string;
  storageId?: string; // ID único para recuperação no IndexedDB ou storage futuro
  url?: string; // Data URL ou URL remota
  provider?: 'local_indexeddb' | 'supabase_storage' | 'external_url';
}

export type StatusAula = 'nao_iniciada' | 'em_estudo' | 'estudada' | 'revisada';

export interface ChecklistEstudo {
  assistirConteudo: boolean; // Assistir/ler o conteúdo da aula
  estudarPdf: boolean; // Estudar o PDF/material
  fazerAnotacoes: boolean; // Fazer anotações
  fazerResumoQuadros: boolean; // Fazer resumo em quadros
  criarMapaMental: boolean; // Criar mapa mental
  revisarAula: boolean; // Revisar a aula
  resolverQuestoes: boolean; // Resolver questões
}

export interface Aula {
  id: string;
  materiaId: string;
  disciplina: string; // Nome da disciplina
  professor?: string; // Professor da disciplina/aula
  data: string; // YYYY-MM-DD
  diaSemana?: string; // Dia da semana identificado automaticamente
  horario: string;
  titulo: string;
  conteudo: string;
  observacoes: string;
  materialPdf?: AulaMaterialPdf; // Material em PDF vinculado
  linkAula?: string; // Link da aula ou vídeo online (YouTube, Drive, Teams, etc.)
  status?: StatusAula; // Status de estudo da aula
  checklist?: ChecklistEstudo; // Checklist de estudo da aula
}

export type TipoAnotacao = 'livre' | 'quadros' | 'mapa_mental';

export interface QuadroDireito {
  id: string;
  titulo: string;
  conceito: string;
  artigoLei?: string;
  palavrasChave?: string;
  exemplo?: string;
  pegadinhaProva?: string;
  oQueMemorizar?: string;
  // Suporte a quadros personalizados (Requisito 2)
  tipoQuadro?: 'padrao' | 'personalizado';
  conteudoPersonalizado?: string;
}

export interface SubTopicoMapa {
  id: string;
  texto: string;
  detalhes?: string;
  subTopicos?: SubTopicoMapa[]; // Suporte a múltiplos níveis de subramificações (Requisito 5)
}

export interface RamificacaoMapa {
  id: string;
  titulo: string;
  conteudo?: string;
  subTopicos: SubTopicoMapa[];
  cor?: string; // Cor visual para a ramificação
}

export interface MapaMentalData {
  noCentral: string;
  descricaoCentral?: string;
  ramificacoes: RamificacaoMapa[];
}

export interface Anotacao {
  id: string;
  titulo: string;
  tipo: TipoAnotacao;
  disciplinaId: string;
  disciplina: string;
  professor?: string;
  dataAula?: string;
  aulaRelacionadaId?: string;
  aulaRelacionadaTitulo?: string;
  conteudo: string; // Utilizado na Anotação Livre
  quadros?: QuadroDireito[]; // Utilizado no Resumo em Quadros
  mapaMental?: MapaMentalData; // Utilizado no Mapa Mental
  data: string; // YYYY-MM-DD
  tags: string[];
  favorito: boolean;
  createdAt?: string;
  updatedAt?: string;
  ultimaModificacao?: string;
}

export interface EventoCalendario {
  id: string;
  titulo: string;
  tipo: TipoEvento;
  data: string; // YYYY-MM-DD
  dataFim?: string; // YYYY-MM-DD (para períodos como P1, P2, férias)
  horario?: string;
  disciplinaId?: string;
  disciplina?: string;
  descricao?: string;
  concluido?: boolean;
}

export interface MetaEstudo {
  id: string;
  titulo: string;
  categoria: 'Vade Mecum & Leis' | 'Doutrina' | 'Jurisprudência' | 'Questões OAB' | 'Geral';
  horasSemanaisMeta: number;
  horasRealizadas: number;
  concluida: boolean;
}

export interface SessaoEstudo {
  id: string;
  titulo: string;
  disciplina: string;
  materiaId?: string;
  aulaId?: string;
  aulaTitulo?: string;
  data: string; // YYYY-MM-DD
  duracaoMinutos: number;
  tipo: 'Leitura de Código' | 'Doutrina' | 'Resumo' | 'Questões' | 'Revisão';
  observacoes?: string;
  objetivo?: string;
  status?: 'planejado' | 'em_andamento' | 'concluido';
  horario?: string;
}

export type TurnoType =
  | 'Matutino'
  | 'Vespertino'
  | 'Tarde'
  | 'Noturno'
  | 'Integral';

export interface PerfilUsuario {
  nome: string;
  curso: string;
  semestreAtual: string; // Ex: "3º semestre"
  instituicao: string;
  turno: TurnoType;
  metaHorasSemanais: number;
}

export type MenuSection =
  | 'dashboard'
  | 'semestre'
  | 'materias'
  | 'aulas'
  | 'anotacoes'
  | 'calendario'
  | 'estudos'
  | 'configuracoes';
