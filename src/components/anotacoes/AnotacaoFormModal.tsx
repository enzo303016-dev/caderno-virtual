import React, { useState, useEffect } from 'react';
import {
  FileText,
  LayoutGrid,
  GitBranch,
  Star,
  Tag,
  Calendar,
  User,
  BookOpen,
  Link2,
  X,
  Check,
  Info,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Anotacao, TipoAnotacao, QuadroDireito, MapaMentalData, Materia, Aula } from '../../types';
import { AnotacaoLivreEditor } from './AnotacaoLivreEditor';
import { ResumoQuadrosEditor } from './ResumoQuadrosEditor';
import { MapaMentalEditor } from './MapaMentalEditor';

interface AnotacaoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (anotacaoData: Omit<Anotacao, 'id'>) => void;
  editingAnotacao: Anotacao | null;
  materias: Materia[];
  aulas: Aula[];
  fixedAula?: Aula | null;
  prefilledDraft?: {
    aula?: Aula;
    initialTipo?: TipoAnotacao;
    disciplinaId?: string;
  } | null;
}

const TAG_SUGESTOES = [
  'prova',
  'P1',
  'P2',
  'revisão',
  'OAB',
  'importante',
  'artigo',
  'conceito',
];

export const AnotacaoFormModal: React.FC<AnotacaoFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingAnotacao,
  materias,
  aulas,
  fixedAula,
  prefilledDraft,
}) => {
  const [tipo, setTipo] = useState<TipoAnotacao>('livre');
  const [titulo, setTitulo] = useState('');
  const [disciplinaId, setDisciplinaId] = useState('');
  const [professor, setProfessor] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [aulaRelacionadaId, setAulaRelacionadaId] = useState('');
  const [favorito, setFavorito] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [tagsArray, setTagsArray] = useState<string[]>([]);

  // Conteúdos específicos por tipo
  const [conteudoLivre, setConteudoLivre] = useState('');
  const [quadros, setQuadros] = useState<QuadroDireito[]>([]);
  const [mapaMental, setMapaMental] = useState<MapaMentalData>({
    noCentral: '',
    descricaoCentral: '',
    ramificacoes: [],
  });

  const [erroValidacao, setErroValidacao] = useState<string | null>(null);

  // Inicialização do formulário ao abrir
  useEffect(() => {
    if (!isOpen) return;

    setErroValidacao(null);

    if (editingAnotacao) {
      // Edição de nota existente
      setTipo(editingAnotacao.tipo || 'livre');
      setTitulo(editingAnotacao.titulo);
      setDisciplinaId(editingAnotacao.disciplinaId);
      setProfessor(editingAnotacao.professor || '');
      setData(editingAnotacao.data);
      setAulaRelacionadaId(editingAnotacao.aulaRelacionadaId || '');
      setFavorito(editingAnotacao.favorito);
      setTagsArray(editingAnotacao.tags || []);
      setTagsInput(editingAnotacao.tags?.join(', ') || '');
      setConteudoLivre(editingAnotacao.conteudo || '');
      setQuadros(editingAnotacao.quadros ? JSON.parse(JSON.stringify(editingAnotacao.quadros)) : []);
      setMapaMental(
        editingAnotacao.mapaMental
          ? JSON.parse(JSON.stringify(editingAnotacao.mapaMental))
          : { noCentral: editingAnotacao.titulo, descricaoCentral: '', ramificacoes: [] }
      );
    } else if (fixedAula || prefilledDraft?.aula) {
      // Criação vinculada diretamente à aula atual
      const aula = (fixedAula || prefilledDraft?.aula)!;
      const initialTipo = prefilledDraft?.initialTipo || 'livre';
      setTipo(initialTipo);
      setTitulo('');
      setDisciplinaId(aula.materiaId);
      setProfessor(aula.professor || '');
      setData(aula.data);
      setAulaRelacionadaId(aula.id);
      setFavorito(false);
      setTagsArray([aula.disciplina.split(' ')[0], 'Aula']);
      setTagsInput(`${aula.disciplina.split(' ')[0]}, Aula`);
      
      // Conteúdo inicial estruturado
      setConteudoLivre(
        `### Aula: ${aula.titulo}\n**Disciplina:** ${aula.disciplina}${aula.professor ? ` (Prof. ${aula.professor})` : ''}\n**Data:** ${aula.data.split('-').reverse().join('/')}\n\n---\n\n### Conteúdo da Aula:\n${aula.conteudo}\n\n### Minhas Anotações:\n- `
      );
      setQuadros([
        {
          id: `quadro-${Date.now()}`,
          titulo: aula.titulo,
          conceito: aula.conteudo || '',
          artigoLei: '',
          palavrasChave: '',
          exemplo: '',
          pegadinhaProva: '',
          oQueMemorizar: '',
        },
      ]);
      setMapaMental({
        noCentral: aula.titulo.toUpperCase(),
        descricaoCentral: aula.disciplina,
        ramificacoes: [],
      });
    } else {
      // Nova anotação limpa
      const defaultMateria = materias[0];
      setTipo(prefilledDraft?.initialTipo || 'livre');
      setTitulo('');
      setDisciplinaId(defaultMateria?.id || '');
      setProfessor(defaultMateria?.professor || '');
      setData(new Date().toISOString().split('T')[0]);
      setAulaRelacionadaId('');
      setFavorito(false);
      setTagsArray([]);
      setTagsInput('');
      setConteudoLivre('');
      setQuadros([]);
      setMapaMental({
        noCentral: '',
        descricaoCentral: '',
        ramificacoes: [],
      });
    }
  }, [isOpen, editingAnotacao, prefilledDraft, fixedAula, materias]);

  // Alteração de matéria: atualiza professor padrão caso não preenchido
  const handleMateriaChange = (newMateriaId: string) => {
    setDisciplinaId(newMateriaId);
    const mat = materias.find((m) => m.id === newMateriaId);
    if (mat && !professor) {
      setProfessor(mat.professor || '');
    }
    // Se a aula vinculada não pertencer à nova matéria, desvincula
    if (aulaRelacionadaId) {
      const aula = aulas.find((a) => a.id === aulaRelacionadaId);
      if (aula && aula.materiaId !== newMateriaId) {
        setAulaRelacionadaId('');
      }
    }
  };

  // Alteração de aula vinculada
  const handleAulaChange = (aulaId: string) => {
    setAulaRelacionadaId(aulaId);
    if (aulaId) {
      const aula = aulas.find((a) => a.id === aulaId);
      if (aula) {
        setDisciplinaId(aula.materiaId);
        if (aula.professor) setProfessor(aula.professor);
        setData(aula.data);
        if (!titulo.trim()) {
          setTitulo(`Anotações: ${aula.titulo}`);
        }
      }
    }
  };

  // Manipulação de Tags
  const handleAddTag = (novaTag: string) => {
    const t = novaTag.trim();
    if (!t) return;
    if (!tagsArray.includes(t)) {
      const updated = [...tagsArray, t];
      setTagsArray(updated);
      setTagsInput(updated.join(', '));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = tagsArray.filter((t) => t !== tagToRemove);
    setTagsArray(updated);
    setTagsInput(updated.join(', '));
  };

  const handleTagsInputChange = (val: string) => {
    setTagsInput(val);
    const parsed = val
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    setTagsArray(Array.from(new Set(parsed)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setErroValidacao('Informe o título da anotação.');
      return;
    }
    if (!disciplinaId) {
      setErroValidacao('Selecione uma matéria.');
      return;
    }

    const mat = materias.find((m) => m.id === disciplinaId);
    const aula = aulas.find((a) => a.id === aulaRelacionadaId);

    // Ajusta nó central do mapa mental caso deixado em branco
    const mapaFinal: MapaMentalData = {
      ...mapaMental,
      noCentral: mapaMental.noCentral.trim() || titulo.trim().toUpperCase(),
    };

    onSave({
      titulo: titulo.trim(),
      tipo,
      disciplinaId,
      disciplina: mat ? mat.nome : 'Geral',
      professor: professor.trim() || undefined,
      data,
      aulaRelacionadaId: aulaRelacionadaId || undefined,
      aulaRelacionadaTitulo: aula ? aula.titulo : undefined,
      conteudo: conteudoLivre,
      quadros: tipo === 'quadros' ? quadros : undefined,
      mapaMental: tipo === 'mapa_mental' ? mapaFinal : undefined,
      tags: tagsArray,
      favorito,
    });

    onClose();
  };

  const aulasDisponiveis = disciplinaId
    ? aulas.filter((a) => a.materiaId === disciplinaId)
    : aulas;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingAnotacao ? 'Editar Anotação' : 'Nova Anotação de Estudo'}
      maxWidth="5xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col max-h-[82vh]">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Alerta de validação */}
          {erroValidacao && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center justify-between">
              <span>{erroValidacao}</span>
              <button
                type="button"
                onClick={() => setErroValidacao(null)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 1. SELEÇÃO DO TIPO DE ANOTAÇÃO */}
          <div>
            <label className="block text-2xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Tipo de Anotação *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Opção 1: Anotação Livre */}
              <button
                type="button"
                onClick={() => setTipo('livre')}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  tipo === 'livre'
                    ? 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        tipo === 'livre' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-stone-900">Anotação livre</span>
                  </div>
                  {tipo === 'livre' && <Check className="w-4 h-4 text-amber-600" />}
                </div>
                <p className="text-2xs text-stone-500 leading-relaxed">
                  Para escrever normalmente durante ou depois da aula, com formatação jurídica.
                </p>
              </button>

              {/* Opção 2: Resumo em Quadro */}
              <button
                type="button"
                onClick={() => setTipo('quadros')}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  tipo === 'quadros'
                    ? 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        tipo === 'quadros' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-stone-900">Resumo em quadro</span>
                  </div>
                  {tipo === 'quadros' && <Check className="w-4 h-4 text-amber-600" />}
                </div>
                <p className="text-2xs text-stone-500 leading-relaxed">
                  Para organizar o conteúdo de forma visual e objetiva em cartões temáticos de Direito.
                </p>
              </button>

              {/* Opção 3: Mapa Mental */}
              <button
                type="button"
                onClick={() => setTipo('mapa_mental')}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  tipo === 'mapa_mental'
                    ? 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        tipo === 'mapa_mental' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      <GitBranch className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-stone-900">Mapa mental</span>
                  </div>
                  {tipo === 'mapa_mental' && <Check className="w-4 h-4 text-amber-600" />}
                </div>
                <p className="text-2xs text-stone-500 leading-relaxed">
                  Para estruturar uma ideia central, ramificações e subtópicos analíticos.
                </p>
              </button>
            </div>
          </div>

          {/* 2. DADOS PRINCIPAIS (Título, Matéria, Aula, Professor, Data, Favorito) */}
          <div className="bg-stone-50/60 p-4 rounded-xl border border-stone-200 space-y-4">
            {/* Título & Favorito */}
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <label className="block text-2xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Título da Anotação *
                </label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Fatos e Negócios Jurídicos, Teoria Geral da Prova..."
                  className="w-full px-3 py-2 text-sm font-semibold text-stone-900 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Botão de Favoritar */}
              <div className="pt-6 shrink-0">
                <button
                  type="button"
                  onClick={() => setFavorito(!favorito)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition ${
                    favorito
                      ? 'bg-amber-100/90 border-amber-300 text-amber-900 shadow-2xs'
                      : 'bg-white border-stone-300 text-stone-600 hover:bg-stone-50'
                  }`}
                  title={favorito ? 'Marcada como favorita' : 'Marcar como favorita'}
                >
                  <Star className={`w-4 h-4 ${favorito ? 'fill-amber-500 text-amber-500' : 'text-stone-400'}`} />
                  <span className="hidden sm:inline">{favorito ? 'Favorita' : 'Favoritar'}</span>
                </button>
              </div>
            </div>

            {/* Grid 4 Colunas: Matéria, Aula Relacionada, Professor, Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Matéria */}
              <div>
                <label className="block text-2xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-stone-400" />
                  <span>Matéria *</span>
                </label>
                {fixedAula ? (
                  <div className="w-full px-3 py-2 text-xs bg-stone-100 border border-stone-200 rounded-lg text-stone-800 font-semibold truncate">
                    {fixedAula.disciplina}
                  </div>
                ) : (
                  <select
                    value={disciplinaId}
                    onChange={(e) => handleMateriaChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    {materias.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Aula Relacionada */}
              <div>
                <label className="block text-2xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Link2 className="w-3 h-3 text-stone-400" />
                  <span>Aula Relacionada</span>
                </label>
                {fixedAula ? (
                  <div className="w-full px-3 py-2 text-xs bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900 font-semibold truncate flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                    <span className="truncate">{fixedAula.titulo}</span>
                  </div>
                ) : (
                  <select
                    value={aulaRelacionadaId}
                    onChange={(e) => handleAulaChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="">Nenhuma aula vinculada</option>
                    {aulasDisponiveis.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.data.split('-').reverse().join('/')} — {a.titulo}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Professor */}
              <div>
                <label className="block text-2xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-stone-400" />
                  <span>Professor</span>
                </label>
                <input
                  type="text"
                  value={professor}
                  onChange={(e) => setProfessor(e.target.value)}
                  placeholder="Nome do docente..."
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Data da Anotação */}
              <div>
                <label className="block text-2xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-stone-400" />
                  <span>Data *</span>
                </label>
                <input
                  type="date"
                  required
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>

            {/* Tags e Palavras-chave */}
            <div>
              <label className="block text-2xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-stone-400" />
                <span>Palavras-chave e Tags</span>
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => handleTagsInputChange(e.target.value)}
                placeholder="Separe as tags por vírgula (ex: prova, P1, revisão, OAB, artigo)..."
                className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />

              {/* Chips de tags adicionadas + sugestões */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-3xs font-semibold text-stone-400 uppercase tracking-wider">
                  Exemplos rápidos:
                </span>
                {TAG_SUGESTOES.map((sugestao) => {
                  const jaAdicionada = tagsArray.includes(sugestao);
                  return (
                    <button
                      key={sugestao}
                      type="button"
                      onClick={() => (jaAdicionada ? handleRemoveTag(sugestao) : handleAddTag(sugestao))}
                      className={`px-2 py-0.5 rounded-md text-2xs font-medium transition ${
                        jaAdicionada
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-stone-200/70 text-stone-600 hover:bg-stone-300 border border-transparent'
                      }`}
                    >
                      {jaAdicionada ? `✓ ${sugestao}` : `+ ${sugestao}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. EDITOR ESPECÍFICO CONFORME O TIPO */}
          <div className="pt-2">
            {tipo === 'livre' && (
              <div>
                <label className="block text-2xs font-bold text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  <span>Conteúdo da Anotação Livre</span>
                </label>
                <AnotacaoLivreEditor
                  value={conteudoLivre}
                  onChange={setConteudoLivre}
                  placeholder="Escreva sua anotação jurídica aqui... Use a barra de ferramentas para formatar conceitos, leis e citações."
                />
              </div>
            )}

            {tipo === 'quadros' && (
              <div>
                <label className="block text-2xs font-bold text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <LayoutGrid className="w-3.5 h-3.5 text-amber-600" />
                  <span>Quadros de Resumo Jurídico</span>
                </label>
                <ResumoQuadrosEditor quadros={quadros} onChange={setQuadros} />
              </div>
            )}

            {tipo === 'mapa_mental' && (
              <div>
                <label className="block text-2xs font-bold text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-amber-600" />
                  <span>Editor de Mapa Mental</span>
                </label>
                <MapaMentalEditor data={mapaMental} onChange={setMapaMental} />
              </div>
            )}
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="bg-stone-50 border-t border-stone-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-200 rounded-lg transition"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              {editingAnotacao ? 'Salvar Alterações' : 'Criar Anotação'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
