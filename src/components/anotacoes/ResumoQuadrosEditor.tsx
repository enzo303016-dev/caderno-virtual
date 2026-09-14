import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Copy,
  BookOpen,
  Scale,
  Key,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  Edit2,
  Check,
  Eye,
  Printer,
  FileText,
  LayoutGrid,
  Sparkles,
} from 'lucide-react';
import { QuadroDireito } from '../../types';

interface ResumoQuadrosEditorProps {
  quadros: QuadroDireito[];
  onChange: (quadros: QuadroDireito[]) => void;
}

export const ResumoQuadrosEditor: React.FC<ResumoQuadrosEditorProps> = ({
  quadros,
  onChange,
}) => {
  // Controle do modo leitura dentro do editor (Requisito 3)
  const [modoLeitura, setModoLeitura] = useState(false);

  // Controle de qual quadro está em edição ativa
  const [editingQuadroId, setEditingQuadroId] = useState<string | null>(
    quadros.length > 0 ? quadros[0].id : null
  );

  // 1. Adicionar Quadro Padrão de Direito
  const handleAddQuadroPadrao = () => {
    const novoQuadro: QuadroDireito = {
      id: `quadro-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tipoQuadro: 'padrao',
      titulo: '',
      conceito: '',
      artigoLei: '',
      palavrasChave: '',
      exemplo: '',
      pegadinhaProva: '',
      oQueMemorizar: '',
    };
    const novos = [...quadros, novoQuadro];
    onChange(novos);
    setEditingQuadroId(novoQuadro.id);
  };

  // 2. Adicionar Quadro Personalizado (Requisito 2)
  const handleAddQuadroPersonalizado = () => {
    const novoQuadro: QuadroDireito = {
      id: `quadro-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tipoQuadro: 'personalizado',
      titulo: '',
      conceito: '',
      conteudoPersonalizado: '',
    };
    const novos = [...quadros, novoQuadro];
    onChange(novos);
    setEditingQuadroId(novoQuadro.id);
  };

  // 3. Atualizar campo do quadro
  const handleUpdateQuadro = (
    id: string,
    campo: keyof QuadroDireito,
    valor: unknown
  ) => {
    const novos = quadros.map((q) => (q.id === id ? { ...q, [campo]: valor } : q));
    onChange(novos);
  };

  // 4. Alternar tipo do quadro (padrão <-> personalizado)
  const handleToggleTipoQuadro = (id: string) => {
    const quadro = quadros.find((q) => q.id === id);
    if (!quadro) return;
    const novoTipo = quadro.tipoQuadro === 'personalizado' ? 'padrao' : 'personalizado';
    handleUpdateQuadro(id, 'tipoQuadro', novoTipo);
  };

  // 5. Excluir quadro
  const handleDeleteQuadro = (id: string) => {
    if (quadros.length <= 1) {
      if (!window.confirm('Deseja excluir este quadro do resumo?')) return;
    }
    const novos = quadros.filter((q) => q.id !== id);
    onChange(novos);
    if (editingQuadroId === id) {
      setEditingQuadroId(novos[0]?.id || null);
    }
  };

  // 6. Duplicar quadro (Requisito 1)
  const handleDuplicarQuadro = (quadro: QuadroDireito) => {
    const clone: QuadroDireito = {
      ...quadro,
      id: `quadro-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      titulo: quadro.titulo ? `${quadro.titulo} (Cópia)` : 'Novo Quadro',
    };
    const idx = quadros.findIndex((q) => q.id === quadro.id);
    const novos = [...quadros];
    novos.splice(idx + 1, 0, clone);
    onChange(novos);
    setEditingQuadroId(clone.id);
  };

  // 7. Reordenar quadros (mover para cima / para baixo) (Requisito 1)
  const handleMoveQuadro = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= quadros.length) return;

    const novos = [...quadros];
    const [moved] = novos.splice(index, 1);
    novos.splice(targetIndex, 0, moved);
    onChange(novos);
  };

  // 8. Impressão (Requisito 3)
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Barra de Ações Superior do Resumo em Quadros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5 text-amber-700" />
              <span>Quadros de Estudo Jurídico</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-stone-200 text-stone-700 text-3xs font-bold">
              {quadros.length} {quadros.length === 1 ? 'quadro' : 'quadros'}
            </span>
          </div>
          <p className="text-2xs text-stone-500 mt-0.5">
            Organize institutos, leis, pegadinhas e notas de memorização em cartões visuais
          </p>
        </div>

        {/* Botões de Modo Leitura, Impressão e Adição */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Botão Modo Leitura (Requisito 3) */}
          <button
            type="button"
            onClick={() => setModoLeitura(!modoLeitura)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition shadow-2xs ${
              modoLeitura
                ? 'bg-amber-600 text-white border-amber-700'
                : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-300'
            }`}
            title="Alternar entre modo de edição e modo de leitura limpa"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{modoLeitura ? 'Voltar para Edição' : '👁 Modo Leitura'}</span>
          </button>

          {/* Botão Imprimir (Requisito 3) */}
          {modoLeitura && (
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-xl text-xs font-semibold transition shadow-2xs"
              title="Imprimir resumo utilizando os recursos do navegador"
            >
              <Printer className="w-3.5 h-3.5 text-stone-600" />
              <span>🖨 Imprimir</span>
            </button>
          )}

          {/* Botões de Adição quando em modo edição */}
          {!modoLeitura && (
            <div className="flex items-center gap-1.5">
              {/* Adicionar Quadro Padrão */}
              <button
                type="button"
                onClick={handleAddQuadroPadrao}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition"
                title="Adicionar quadro padrão de Direito (Conceito, Artigo, Exemplo, etc.)"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Quadro Padrão</span>
              </button>

              {/* Adicionar Quadro Personalizado (Requisito 2) */}
              <button
                type="button"
                onClick={handleAddQuadroPersonalizado}
                className="flex items-center gap-1 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-2xs transition"
                title="Adicionar quadro livre/personalizado para qualquer comparação jurídica"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Personalizado</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Se não houver nenhum quadro */}
      {quadros.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50 p-6 space-y-3">
          <BookOpen className="w-8 h-8 mx-auto text-stone-400" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-stone-800">Nenhum quadro criado neste resumo</h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Sintetize a matéria através de cartões visuais para facilitar a memorização e revisão para provas.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleAddQuadroPadrao}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Criar Quadro Padrão</span>
            </button>
            <button
              type="button"
              onClick={handleAddQuadroPersonalizado}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-2xs transition"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Criar Quadro Personalizado</span>
            </button>
          </div>
        </div>
      ) : modoLeitura ? (
        /* ====================================================================== */
        /* MODO LEITURA (Requisito 3): Limpo, sem botões de edição, pronto p/ revisão */
        /* ====================================================================== */
        <div className="space-y-4 print:space-y-6">
          <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs text-amber-900 print:hidden">
            <span className="font-semibold">
              👁 Visualizando no Modo Leitura ({quadros.length} {quadros.length === 1 ? 'quadro' : 'quadros'})
            </span>
            <span className="text-2xs text-amber-800/80">
              Pronto para revisão concentrada ou impressão
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-4">
            {quadros.map((quadro, idx) => {
              const isPersonalizado = quadro.tipoQuadro === 'personalizado';

              return (
                <div
                  key={quadro.id}
                  className="bg-white rounded-2xl border-2 border-stone-300/80 overflow-hidden shadow-xs flex flex-col justify-between print:break-inside-avoid print:border-stone-400"
                >
                  {/* Topo do Cartão de Estudo */}
                  <div className="px-4 py-3 bg-stone-100 border-b-2 border-stone-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-stone-800 text-white font-serif font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <h3 className="font-serif font-bold text-stone-950 text-sm truncate uppercase tracking-wide">
                        {quadro.titulo.trim() || `Quadro ${idx + 1}`}
                      </h3>
                    </div>
                    <span className="text-3xs uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-white text-stone-600 border border-stone-300 shrink-0">
                      {isPersonalizado ? 'Personalizado' : 'Direito'}
                    </span>
                  </div>

                  {/* Conteúdo do Cartão em Seções Visuais Rígidas */}
                  {isPersonalizado ? (
                    /* QUADRO PERSONALIZADO (Requisito 2) */
                    <div className="p-4 flex-1">
                      <span className="text-3xs font-bold uppercase tracking-wider text-stone-400 block mb-1">
                        Conteúdo
                      </span>
                      <div className="text-xs text-stone-800 leading-relaxed whitespace-pre-line font-sans">
                        {quadro.conteudoPersonalizado || quadro.conceito || (
                          <span className="text-stone-400 italic">Nenhum conteúdo registrado.</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* QUADRO PADRÃO EM CARTÃO VISUAL */
                    <div className="divide-y divide-stone-200 text-xs text-stone-800 flex-1">
                      {/* 1. CONCEITO */}
                      {quadro.conceito && (
                        <div className="p-3.5 space-y-1">
                          <span className="text-3xs font-bold uppercase tracking-wider text-stone-500 block">
                            Conceito
                          </span>
                          <p className="text-stone-900 leading-relaxed font-sans">
                            {quadro.conceito}
                          </p>
                        </div>
                      )}

                      {/* 2. ARTIGO / LEI */}
                      {quadro.artigoLei && (
                        <div className="p-3.5 bg-amber-50/30 space-y-1">
                          <span className="text-3xs font-bold uppercase tracking-wider text-amber-900/80 block flex items-center gap-1">
                            <Scale className="w-3 h-3 text-amber-700" />
                            <span>Artigo / Lei</span>
                          </span>
                          <span className="font-mono text-xs font-semibold text-amber-950 bg-amber-100/70 px-2 py-0.5 rounded border border-amber-300/70 inline-block">
                            {quadro.artigoLei}
                          </span>
                        </div>
                      )}

                      {/* 3. PALAVRAS-CHAVE */}
                      {quadro.palavrasChave && (
                        <div className="p-3.5 space-y-1">
                          <span className="text-3xs font-bold uppercase tracking-wider text-stone-500 block flex items-center gap-1">
                            <Key className="w-3 h-3 text-stone-400" />
                            <span>Palavras-chave</span>
                          </span>
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {quadro.palavrasChave.split(/[,;]/).map((palavra, pIdx) => (
                              <span
                                key={pIdx}
                                className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-stone-800 text-3xs font-semibold"
                              >
                                {palavra.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 4. EXEMPLO */}
                      {quadro.exemplo && (
                        <div className="p-3.5 space-y-1">
                          <span className="text-3xs font-bold uppercase tracking-wider text-stone-500 block flex items-center gap-1">
                            <HelpCircle className="w-3 h-3 text-stone-400" />
                            <span>Exemplo Prático</span>
                          </span>
                          <p className="text-stone-700 italic bg-stone-50 p-2.5 rounded-lg border border-stone-200/80 leading-relaxed font-sans">
                            &quot;{quadro.exemplo}&quot;
                          </p>
                        </div>
                      )}

                      {/* 5. PEGADINHA DE PROVA */}
                      {quadro.pegadinhaProva && (
                        <div className="p-3.5 bg-rose-50/50 space-y-1">
                          <span className="text-3xs font-bold uppercase tracking-wider text-rose-800 block flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Pegadinha de Prova / Atenção</span>
                          </span>
                          <p className="text-rose-950 font-medium text-xs leading-relaxed">
                            {quadro.pegadinhaProva}
                          </p>
                        </div>
                      )}

                      {/* 6. O QUE MEMORIZAR */}
                      {quadro.oQueMemorizar && (
                        <div className="p-3.5 bg-amber-50/60 space-y-1">
                          <span className="text-3xs font-bold uppercase tracking-wider text-amber-900 block flex items-center gap-1">
                            <Lightbulb className="w-3 h-3 text-amber-600" />
                            <span>O Que Memorizar (Ponto Nuclear)</span>
                          </span>
                          <p className="text-amber-950 font-semibold text-xs leading-relaxed">
                            {quadro.oQueMemorizar}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ====================================================================== */
        /* MODO EDIÇÃO COMPLETO COM TODAS AS FERRAMENTAS DE GESTÃO (Requisito 1)   */
        /* ====================================================================== */
        <div className="space-y-3.5">
          {quadros.map((quadro, index) => {
            const isEditing = editingQuadroId === quadro.id;
            const isPersonalizado = quadro.tipoQuadro === 'personalizado';

            return (
              <div
                key={quadro.id}
                className={`border rounded-2xl transition-all duration-200 bg-white overflow-hidden shadow-xs ${
                  isEditing ? 'border-amber-500 ring-2 ring-amber-500/15' : 'border-stone-200/90'
                }`}
              >
                {/* Cabeçalho do Quadro */}
                <div
                  className={`px-4 py-3 flex items-center justify-between gap-2 border-b cursor-pointer select-none transition ${
                    isEditing
                      ? 'bg-amber-50/80 border-amber-200'
                      : 'bg-stone-50/90 border-stone-200 hover:bg-stone-100/80'
                  }`}
                  onClick={() => setEditingQuadroId(isEditing ? null : quadro.id)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-md bg-stone-200 text-stone-800 font-bold text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="font-serif font-bold text-stone-900 text-sm truncate block">
                        {quadro.titulo.trim() || `Quadro ${index + 1} (Sem título)`}
                      </span>
                      <span className="text-3xs text-stone-500 block">
                        {isPersonalizado ? 'Quadro Personalizado' : 'Quadro Padrão de Direito'}
                      </span>
                    </div>
                  </div>

                  {/* Ações de Reordenação, Duplicação e Edição (Requisito 1) */}
                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Mover para cima */}
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveQuadro(index, 'up')}
                      title="Mover quadro para cima"
                      className="p-1.5 hover:bg-stone-200/80 disabled:opacity-25 rounded-lg text-stone-600 transition"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Mover para baixo */}
                    <button
                      type="button"
                      disabled={index === quadros.length - 1}
                      onClick={() => handleMoveQuadro(index, 'down')}
                      title="Mover quadro para baixo"
                      className="p-1.5 hover:bg-stone-200/80 disabled:opacity-25 rounded-lg text-stone-600 transition"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Duplicar Quadro */}
                    <button
                      type="button"
                      onClick={() => handleDuplicarQuadro(quadro)}
                      title="Duplicar este quadro"
                      className="p-1.5 hover:bg-stone-200/80 rounded-lg text-stone-600 transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Excluir Quadro */}
                    <button
                      type="button"
                      onClick={() => handleDeleteQuadro(quadro.id)}
                      title="Excluir quadro"
                      className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Botão de Concluir / Editar */}
                    <button
                      type="button"
                      onClick={() => setEditingQuadroId(isEditing ? null : quadro.id)}
                      className={`ml-1 px-2.5 py-1 text-2xs font-semibold rounded-lg transition flex items-center gap-1 ${
                        isEditing
                          ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-2xs'
                          : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                      }`}
                    >
                      {isEditing ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Concluir</span>
                        </>
                      ) : (
                        <>
                          <Edit2 className="w-3 h-3" />
                          <span>Editar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Form de Edição do Quadro */}
                {isEditing ? (
                  <div className="p-4 sm:p-5 space-y-4 bg-white animate-in fade-in duration-150">
                    {/* Barra de Tipo de Quadro */}
                    <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                      <div className="flex items-center gap-2">
                        <span className="text-2xs font-bold uppercase tracking-wider text-stone-500">
                          Formato deste quadro:
                        </span>
                        <span className="text-2xs font-semibold text-stone-800">
                          {isPersonalizado ? 'Personalizado (Livre)' : 'Padrão (Campos Jurídicos)'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleTipoQuadro(quadro.id)}
                        className="text-2xs font-semibold text-amber-700 hover:text-amber-800 underline"
                      >
                        Alternar para {isPersonalizado ? 'Campos Padrão' : 'Personalizado'}
                      </button>
                    </div>

                    {/* Título do Quadro (Opcional) */}
                    <div>
                      <label className="block text-2xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                        Título do Quadro (Opcional)
                      </label>
                      <input
                        type="text"
                        value={quadro.titulo}
                        onChange={(e) => handleUpdateQuadro(quadro.id, 'titulo', e.target.value)}
                        placeholder="Ex: Contratos, Prescrição vs Decadência, Teoria da Imprevisão..."
                        className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>

                    {/* Se for QUADRO PERSONALIZADO (Requisito 2) */}
                    {isPersonalizado ? (
                      <div>
                        <label className="block text-2xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-stone-500" />
                          <span>Conteúdo Personalizado (Opcional)</span>
                        </label>
                        <textarea
                          rows={6}
                          value={quadro.conteudoPersonalizado || quadro.conceito || ''}
                          onChange={(e) =>
                            handleUpdateQuadro(quadro.id, 'conteudoPersonalizado', e.target.value)
                          }
                          placeholder="Digite as distinções, notas ou tabela livre para este instituto jurídico (ex: Prescrição atinge a pretensão; Decadência atinge o próprio direito potestativo)..."
                          className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-sans leading-relaxed"
                        />
                      </div>
                    ) : (
                      /* QUADRO PADRÃO COM TODOS OS CAMPOS OPCIONAIS (Requisito 1) */
                      <div className="space-y-3.5">
                        {/* Conceito (Opcional) */}
                        <div>
                          <label className="block text-2xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-amber-600" />
                            <span>Conceito (Opcional)</span>
                          </label>
                          <textarea
                            rows={3}
                            value={quadro.conceito || ''}
                            onChange={(e) =>
                              handleUpdateQuadro(quadro.id, 'conceito', e.target.value)
                            }
                            placeholder="Definição do instituto, doutrina ou lição explicada em aula..."
                            className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-sans"
                          />
                        </div>

                        {/* Grid: Artigo/Lei & Palavras-chave (Opcionais) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-2xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                              <Scale className="w-3 h-3 text-amber-600" />
                              <span>Artigo / Lei (Opcional)</span>
                            </label>
                            <input
                              type="text"
                              value={quadro.artigoLei || ''}
                              onChange={(e) =>
                                handleUpdateQuadro(quadro.id, 'artigoLei', e.target.value)
                              }
                              placeholder="Ex: Art. 481 CC, Súmula 381 STJ..."
                              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                            />
                          </div>

                          <div>
                            <label className="block text-2xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                              <Key className="w-3 h-3 text-amber-600" />
                              <span>Palavras-chave (Opcional)</span>
                            </label>
                            <input
                              type="text"
                              value={quadro.palavrasChave || ''}
                              onChange={(e) =>
                                handleUpdateQuadro(quadro.id, 'palavrasChave', e.target.value)
                              }
                              placeholder="Ex: Sinalagma, consenso, coisa, preço..."
                              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                            />
                          </div>
                        </div>

                        {/* Exemplo Prático (Opcional) */}
                        <div>
                          <label className="block text-2xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <HelpCircle className="w-3 h-3 text-amber-600" />
                            <span>Exemplo (Opcional)</span>
                          </label>
                          <textarea
                            rows={2}
                            value={quadro.exemplo || ''}
                            onChange={(e) =>
                              handleUpdateQuadro(quadro.id, 'exemplo', e.target.value)
                            }
                            placeholder="Exemplo fático ou caso hipotético..."
                            className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-sans"
                          />
                        </div>

                        {/* Grid: Pegadinha de Prova & O Que Memorizar (Opcionais) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-200">
                            <label className="block text-2xs font-bold text-rose-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>Pegadinha de Prova (Opcional)</span>
                            </label>
                            <textarea
                              rows={2}
                              value={quadro.pegadinhaProva || ''}
                              onChange={(e) =>
                                handleUpdateQuadro(quadro.id, 'pegadinhaProva', e.target.value)
                              }
                              placeholder="Cuidado com prazos, inversões conceituais ou exceções legais..."
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-rose-200 rounded-lg text-stone-900 placeholder-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-sans"
                            />
                          </div>

                          <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                            <label className="block text-2xs font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1">
                              <Lightbulb className="w-3 h-3 text-amber-600" />
                              <span>O Que Memorizar (Opcional)</span>
                            </label>
                            <textarea
                              rows={2}
                              value={quadro.oQueMemorizar || ''}
                              onChange={(e) =>
                                handleUpdateQuadro(quadro.id, 'oQueMemorizar', e.target.value)
                              }
                              placeholder="Regra mnemônica ou frase-chave nuclear..."
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-200 rounded-lg text-stone-900 placeholder-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-sans"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingQuadroId(null)}
                        className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition shadow-2xs"
                      >
                        Salvar e Recolher Quadro
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Modo de Visualização do Cartão Sintético */
                  <div className="p-4 space-y-3 text-xs text-stone-800">
                    {isPersonalizado ? (
                      <div>
                        <span className="text-3xs font-bold uppercase tracking-wider text-stone-400 block mb-1">
                          Conteúdo Personalizado
                        </span>
                        <p className="text-stone-700 leading-relaxed font-sans whitespace-pre-line">
                          {quadro.conteudoPersonalizado ||
                            quadro.conceito ||
                            'Nenhum conteúdo preenchido.'}
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-stone-100 space-y-2">
                        {quadro.conceito && (
                          <div className="pt-1">
                            <span className="text-3xs font-bold uppercase tracking-wider text-stone-400 block mb-0.5">
                              Conceito
                            </span>
                            <p className="text-stone-800 leading-relaxed font-sans">
                              {quadro.conceito}
                            </p>
                          </div>
                        )}

                        {quadro.artigoLei && (
                          <div className="pt-2 flex items-center gap-2">
                            <Scale className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            <span className="font-mono text-2xs font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                              {quadro.artigoLei}
                            </span>
                          </div>
                        )}

                        {quadro.oQueMemorizar && (
                          <div className="pt-2 bg-amber-50/50 p-2 rounded-lg border border-amber-200/60">
                            <span className="text-3xs font-bold uppercase tracking-wider text-amber-900 block mb-0.5 flex items-center gap-1">
                              <Lightbulb className="w-3 h-3 text-amber-600" />
                              <span>Memorizar</span>
                            </span>
                            <p className="text-amber-950 font-semibold text-xs leading-relaxed">
                              {quadro.oQueMemorizar}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
