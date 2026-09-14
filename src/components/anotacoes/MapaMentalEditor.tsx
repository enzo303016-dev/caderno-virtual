import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  GitBranch,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Layout,
  ListTree,
  Eye,
  Printer,
  Sparkles,
  Edit2,
  Check,
  Palette,
  CornerDownRight,
  HelpCircle,
} from 'lucide-react';
import { MapaMentalData, RamificacaoMapa, SubTopicoMapa } from '../../types';

interface MapaMentalEditorProps {
  data: MapaMentalData;
  onChange: (data: MapaMentalData) => void;
}

const PALETA_CORES = [
  { id: 'amber', nome: 'Âmbar Dourado', bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-950', badge: 'bg-amber-600', ring: 'ring-amber-400', line: 'bg-amber-500' },
  { id: 'stone', nome: 'Ardósia / Jurídico', bg: 'bg-stone-100', border: 'border-stone-400', text: 'text-stone-900', badge: 'bg-stone-700', ring: 'ring-stone-400', line: 'bg-stone-500' },
  { id: 'indigo', nome: 'Índigo Clássico', bg: 'bg-indigo-50', border: 'border-indigo-400', text: 'text-indigo-950', badge: 'bg-indigo-600', ring: 'ring-indigo-400', line: 'bg-indigo-500' },
  { id: 'emerald', nome: 'Esmeralda', bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-950', badge: 'bg-emerald-600', ring: 'ring-emerald-400', line: 'bg-emerald-500' },
  { id: 'rose', nome: 'Rubi / Alerta', bg: 'bg-rose-50', border: 'border-rose-400', text: 'text-rose-950', badge: 'bg-rose-600', ring: 'ring-rose-400', line: 'bg-rose-500' },
  { id: 'sky', nome: 'Azul Celeste', bg: 'bg-sky-50', border: 'border-sky-400', text: 'text-sky-950', badge: 'bg-sky-600', ring: 'ring-sky-400', line: 'bg-sky-500' },
];

export const MapaMentalEditor: React.FC<MapaMentalEditorProps> = ({
  data,
  onChange,
}) => {
  // Controle do modo de visualização: 'editor' | 'ver_mapa' (Requisito 7)
  const [modoVerMapa, setModoVerMapa] = useState(false);
  const [ramoAtivoId, setRamoAtivoId] = useState<string | null>(
    data.ramificacoes[0]?.id || null
  );

  const getCorConfig = (corId?: string) => {
    return PALETA_CORES.find((c) => c.id === corId) || PALETA_CORES[0];
  };

  // 1. Nó Central
  const handleUpdateNoCentral = (noCentral: string) => {
    onChange({
      ...data,
      noCentral,
    });
  };

  const handleUpdateDescricaoCentral = (descricaoCentral: string) => {
    onChange({
      ...data,
      descricaoCentral,
    });
  };

  // 2. Adicionar Ramo
  const handleAddRamo = () => {
    const corEscolhida = PALETA_CORES[data.ramificacoes.length % PALETA_CORES.length].id;
    const novoRamo: RamificacaoMapa = {
      id: `ramo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      titulo: '',
      conteudo: '',
      cor: corEscolhida,
      subTopicos: [],
    };
    const novasRamificacoes = [...data.ramificacoes, novoRamo];
    onChange({
      ...data,
      ramificacoes: novasRamificacoes,
    });
    setRamoAtivoId(novoRamo.id);
  };

  // 3. Atualizar Ramo
  const handleUpdateRamo = (ramoId: string, campo: keyof RamificacaoMapa, valor: unknown) => {
    const novas = data.ramificacoes.map((r) =>
      r.id === ramoId ? { ...r, [campo]: valor } : r
    );
    onChange({
      ...data,
      ramificacoes: novas,
    });
  };

  // 4. Excluir Ramo
  const handleDeleteRamo = (ramoId: string) => {
    const novas = data.ramificacoes.filter((r) => r.id !== ramoId);
    onChange({
      ...data,
      ramificacoes: novas,
    });
    if (ramoAtivoId === ramoId) {
      setRamoAtivoId(novas[0]?.id || null);
    }
  };

  // 5. Reordenar Ramos (mover para cima / para baixo) (Requisito 4)
  const handleMoveRamo = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= data.ramificacoes.length) return;

    const novas = [...data.ramificacoes];
    const [moved] = novas.splice(index, 1);
    novas.splice(targetIndex, 0, moved);
    onChange({
      ...data,
      ramificacoes: novas,
    });
  };

  // 6. Adicionar Subramificação (Nível 1)
  const handleAddSubTopico = (ramoId: string) => {
    const novoSub: SubTopicoMapa = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      texto: '',
      detalhes: '',
      subTopicos: [],
    };
    const novas = data.ramificacoes.map((r) => {
      if (r.id === ramoId) {
        return {
          ...r,
          subTopicos: [...r.subTopicos, novoSub],
        };
      }
      return r;
    });
    onChange({
      ...data,
      ramificacoes: novas,
    });
  };

  // 7. Atualizar Subramificação (Nível 1)
  const handleUpdateSubTopico = (
    ramoId: string,
    subId: string,
    campo: keyof SubTopicoMapa,
    valor: unknown
  ) => {
    const novas = data.ramificacoes.map((r) => {
      if (r.id === ramoId) {
        return {
          ...r,
          subTopicos: r.subTopicos.map((s) =>
            s.id === subId ? { ...s, [campo]: valor } : s
          ),
        };
      }
      return r;
    });
    onChange({
      ...data,
      ramificacoes: novas,
    });
  };

  // 8. Excluir Subramificação (Nível 1)
  const handleDeleteSubTopico = (ramoId: string, subId: string) => {
    const novas = data.ramificacoes.map((r) => {
      if (r.id === ramoId) {
        return {
          ...r,
          subTopicos: r.subTopicos.filter((s) => s.id !== subId),
        };
      }
      return r;
    });
    onChange({
      ...data,
      ramificacoes: novas,
    });
  };

  // 9. Adicionar Sub-subramificação (Nível 2 - Requisito 5)
  const handleAddSubSubTopico = (ramoId: string, parentSubId: string) => {
    const novoSubSub: SubTopicoMapa = {
      id: `subsub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      texto: '',
      detalhes: '',
    };
    const novas = data.ramificacoes.map((r) => {
      if (r.id === ramoId) {
        return {
          ...r,
          subTopicos: r.subTopicos.map((s) => {
            if (s.id === parentSubId) {
              return {
                ...s,
                subTopicos: [...(s.subTopicos || []), novoSubSub],
              };
            }
            return s;
          }),
        };
      }
      return r;
    });
    onChange({
      ...data,
      ramificacoes: novas,
    });
  };

  // 10. Atualizar Sub-subramificação (Nível 2)
  const handleUpdateSubSubTopico = (
    ramoId: string,
    parentSubId: string,
    subSubId: string,
    campo: keyof SubTopicoMapa,
    valor: unknown
  ) => {
    const novas = data.ramificacoes.map((r) => {
      if (r.id === ramoId) {
        return {
          ...r,
          subTopicos: r.subTopicos.map((s) => {
            if (s.id === parentSubId) {
              return {
                ...s,
                subTopicos: (s.subTopicos || []).map((ss) =>
                  ss.id === subSubId ? { ...ss, [campo]: valor } : ss
                ),
              };
            }
            return s;
          }),
        };
      }
      return r;
    });
    onChange({
      ...data,
      ramificacoes: novas,
    });
  };

  // 11. Excluir Sub-subramificação (Nível 2)
  const handleDeleteSubSubTopico = (ramoId: string, parentSubId: string, subSubId: string) => {
    const novas = data.ramificacoes.map((r) => {
      if (r.id === ramoId) {
        return {
          ...r,
          subTopicos: r.subTopicos.map((s) => {
            if (s.id === parentSubId) {
              return {
                ...s,
                subTopicos: (s.subTopicos || []).filter((ss) => ss.id !== subSubId),
              };
            }
            return s;
          }),
        };
      }
      return r;
    });
    onChange({
      ...data,
      ramificacoes: novas,
    });
  };

  // 12. Impressão (Requisito 7)
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Barra de Controle de Visualização do Mapa Mental */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-amber-700" />
              <span>Mapa Mental da Aula</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-stone-200 text-stone-700 text-3xs font-bold">
              {data.ramificacoes.length}{' '}
              {data.ramificacoes.length === 1 ? 'ramificação' : 'ramificações'}
            </span>
          </div>
          <p className="text-2xs text-stone-500 mt-0.5">
            Estruture a hierarquia conceitual a partir da ideia central e seus sub-ramos
          </p>
        </div>

        {/* Botão Ver Mapa / Voltar para Edição (Requisito 7) e Impressão */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setModoVerMapa(!modoVerMapa)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition shadow-2xs ${
              modoVerMapa
                ? 'bg-amber-600 text-white border-amber-700'
                : 'bg-white hover:bg-stone-100 text-stone-800 border-stone-300'
            }`}
            title="Alternar entre modo de edição e visualização limpa do mapa"
          >
            {modoVerMapa ? (
              <>
                <ListTree className="w-3.5 h-3.5" />
                <span>Voltar para Edição</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-amber-600" />
                <span>👁 Ver Mapa (Modo Leitura)</span>
              </>
            )}
          </button>

          {modoVerMapa && (
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-xl text-xs font-semibold transition shadow-2xs"
              title="Imprimir mapa mental"
            >
              <Printer className="w-3.5 h-3.5 text-stone-600" />
              <span>🖨 Imprimir</span>
            </button>
          )}

          {!modoVerMapa && (
            <button
              type="button"
              onClick={handleAddRamo}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Adicionar Ramo</span>
            </button>
          )}
        </div>
      </div>

      {/* Nó Central (Sempre visível no topo da edição e no mapa) */}
      <div className="p-4 sm:p-5 bg-gradient-to-br from-amber-50/90 to-stone-50 border-2 border-amber-500/40 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 bg-amber-700 text-white font-bold text-2xs uppercase tracking-wider rounded-md">
            Ideia Central (Nó Raiz)
          </span>
          <span className="text-2xs text-amber-950/70 hidden sm:inline">
            O instituto ou grande tema que orienta todas as ramificações
          </span>
        </div>

        {modoVerMapa ? (
          <div className="text-center py-2">
            <h2 className="text-lg sm:text-xl font-serif font-bold text-stone-950 uppercase tracking-wide">
              {data.noCentral || '(Ideia Central Não Definida)'}
            </h2>
            {data.descricaoCentral && (
              <p className="text-xs text-stone-600 mt-1 max-w-xl mx-auto font-sans leading-relaxed">
                {data.descricaoCentral}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              value={data.noCentral}
              onChange={(e) => handleUpdateNoCentral(e.target.value)}
              placeholder="Ex: TEORIA GERAL DO CRIME, CONTROLE DE CONSTITUCIONALIDADE, DIREITO DAS OBRIGAÇÕES..."
              className="w-full px-3 py-2 text-sm sm:text-base font-serif font-bold text-stone-950 bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />

            <input
              type="text"
              value={data.descricaoCentral || ''}
              onChange={(e) => handleUpdateDescricaoCentral(e.target.value)}
              placeholder="Descrição sucinta ou escopo temático (opcional)..."
              className="w-full px-3 py-1.5 text-xs text-stone-700 bg-white/90 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>
        )}
      </div>

      {/* ====================================================================== */}
      {/* 1. MODO VER MAPA (Requisito 6 & 7): Diagrama Estilizado / Modo Leitura  */}
      {/* ====================================================================== */}
      {modoVerMapa ? (
        <div className="bg-stone-50/70 border-2 border-stone-200/90 rounded-2xl p-4 sm:p-6 overflow-x-auto print:bg-white print:border-none print:p-0">
          <div className="min-w-[550px] flex flex-col items-center space-y-6 print:min-w-0">
            {/* Nó Central destacado no Diagrama */}
            <div className="max-w-lg w-full text-center px-6 py-4 bg-stone-900 text-white rounded-2xl shadow-md border-2 border-amber-600/60 print:border-stone-800">
              <span className="text-3xs font-bold text-amber-400 uppercase tracking-widest block mb-1">
                Ideia Central
              </span>
              <h2 className="text-base sm:text-lg font-serif font-bold tracking-wide">
                {data.noCentral || '(Defina a Ideia Central)'}
              </h2>
              {data.descricaoCentral && (
                <p className="text-xs text-stone-300 mt-1 font-sans leading-relaxed">
                  {data.descricaoCentral}
                </p>
              )}
            </div>

            {/* Conector Vertical do Nó Central para as Ramificações */}
            {data.ramificacoes.length > 0 && (
              <div className="w-1 h-8 bg-amber-500 rounded-full -my-3" />
            )}

            {/* Grid de Ramificações Estilizadas */}
            {data.ramificacoes.length === 0 ? (
              <div className="text-center py-8 text-stone-400 text-xs">
                Nenhuma ramificação criada ainda. Clique em &quot;Voltar para Edição&quot; para adicionar ramos.
              </div>
            ) : (
              <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 print:grid-cols-2 print:gap-4">
                {data.ramificacoes.map((ramo, rIdx) => {
                  const corCfg = getCorConfig(ramo.cor);

                  return (
                    <div
                      key={ramo.id}
                      className={`rounded-2xl border-2 p-4 bg-white shadow-xs space-y-3.5 relative overflow-hidden flex flex-col justify-between ${corCfg.border} print:break-inside-avoid`}
                    >
                      {/* Faixa lateral colorida com indicador */}
                      <div className={`absolute top-0 left-0 bottom-0 w-2 ${corCfg.badge}`} />

                      {/* Cabeçalho do Ramo */}
                      <div className="pl-2">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span
                            className={`w-5 h-5 rounded-md ${corCfg.badge} text-white text-3xs font-bold flex items-center justify-center shrink-0`}
                          >
                            {rIdx + 1}
                          </span>
                          <span className="text-3xs font-bold uppercase tracking-wider text-stone-400">
                            Ramificação
                          </span>
                        </div>

                        <h3 className="font-serif font-bold text-stone-900 text-sm leading-snug">
                          {ramo.titulo || `Ramo ${rIdx + 1}`}
                        </h3>

                        {ramo.conteudo && (
                          <p className="text-xs text-stone-600 mt-1 font-sans leading-relaxed">
                            {ramo.conteudo}
                          </p>
                        )}
                      </div>

                      {/* Subramificações (Hierarquia Visual) */}
                      {ramo.subTopicos.length > 0 && (
                        <div className="pl-3 border-l-2 border-stone-200 ml-3 space-y-2 pt-1 flex-1">
                          <span className="text-3xs font-bold uppercase tracking-widest text-stone-400 block">
                            Sub-ramos e Conceitos
                          </span>

                          {ramo.subTopicos.map((sub, sIdx) => (
                            <div key={sub.id} className="space-y-1.5">
                              {/* Subtópico Nível 1 */}
                              <div
                                className={`p-2 rounded-xl text-xs ${corCfg.bg} ${corCfg.text} border ${corCfg.border} font-medium space-y-0.5`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`w-2 h-2 rounded-full ${corCfg.line} shrink-0`}
                                  />
                                  <span className="font-bold">
                                    {sub.texto || `Sub-ramo ${sIdx + 1}`}
                                  </span>
                                </div>
                                {sub.detalhes && (
                                  <p className="text-2xs opacity-85 pl-3.5 font-normal leading-relaxed">
                                    {sub.detalhes}
                                  </p>
                                )}
                              </div>

                              {/* Sub-subtópicos Nível 2 (Requisito 5) */}
                              {sub.subTopicos && sub.subTopicos.length > 0 && (
                                <div className="pl-4 border-l-2 border-dashed border-stone-300 ml-3 space-y-1">
                                  {sub.subTopicos.map((subSub) => (
                                    <div
                                      key={subSub.id}
                                      className="p-1.5 rounded-lg text-2xs bg-stone-50 border border-stone-200 text-stone-800"
                                    >
                                      <div className="flex items-center gap-1">
                                        <CornerDownRight className="w-3 h-3 text-stone-400 shrink-0" />
                                        <span className="font-semibold">{subSub.texto}</span>
                                      </div>
                                      {subSub.detalhes && (
                                        <p className="text-3xs text-stone-600 pl-4 mt-0.5">
                                          {subSub.detalhes}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ====================================================================== */
        /* 2. MODO EDIÇÃO DOS RAMOS E SUBTÓPICOS (Requisito 4 & 5)                 */
        /* ====================================================================== */
        <div className="space-y-3.5">
          {data.ramificacoes.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50 p-6 space-y-3">
              <GitBranch className="w-8 h-8 mx-auto text-stone-400" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-stone-800">Nenhum ramo criado</h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Crie ramos principais conectados à ideia central (ex: Requisitos, Espécies, Efeitos, Prazos).
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddRamo}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Criar Primeiro Ramo</span>
              </button>
            </div>
          ) : (
            data.ramificacoes.map((ramo, rIndex) => {
              const isExpanded = ramoAtivoId === ramo.id;
              const corCfg = getCorConfig(ramo.cor);

              return (
                <div
                  key={ramo.id}
                  className={`border rounded-2xl bg-white overflow-hidden transition-all shadow-xs ${
                    isExpanded
                      ? 'border-stone-400 ring-2 ring-stone-200'
                      : 'border-stone-200/90'
                  }`}
                >
                  {/* Cabeçalho do Ramo */}
                  <div
                    className="px-4 py-3 flex items-center justify-between gap-2 bg-stone-50/90 cursor-pointer select-none hover:bg-stone-100/90 border-b border-stone-200 transition"
                    onClick={() => setRamoAtivoId(isExpanded ? null : ramo.id)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-md ${corCfg.badge} text-white font-bold text-xs flex items-center justify-center shrink-0`}
                      >
                        {rIndex + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="font-serif font-bold text-stone-900 text-sm truncate block">
                          {ramo.titulo.trim() || `Ramificação ${rIndex + 1}`}
                        </span>
                        <span className="text-3xs text-stone-500">
                          {ramo.subTopicos.length}{' '}
                          {ramo.subTopicos.length === 1 ? 'subtópico' : 'subtópicos'}
                        </span>
                      </div>
                    </div>

                    {/* Ações do Ramo: Mover para cima/baixo, Paleta de Cores, Excluir, Expandir */}
                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Mover ramo para cima (Requisito 4) */}
                      <button
                        type="button"
                        disabled={rIndex === 0}
                        onClick={() => handleMoveRamo(rIndex, 'up')}
                        title="Mover ramificação para cima"
                        className="p-1.5 hover:bg-stone-200/80 disabled:opacity-25 rounded-lg text-stone-600 transition"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Mover ramo para baixo (Requisito 4) */}
                      <button
                        type="button"
                        disabled={rIndex === data.ramificacoes.length - 1}
                        onClick={() => handleMoveRamo(rIndex, 'down')}
                        title="Mover ramificação para baixo"
                        className="p-1.5 hover:bg-stone-200/80 disabled:opacity-25 rounded-lg text-stone-600 transition"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Seletor Rápido de Cor */}
                      <div className="flex items-center gap-1 mx-1.5 hidden sm:flex">
                        {PALETA_CORES.map((cor) => (
                          <button
                            key={cor.id}
                            type="button"
                            onClick={() => handleUpdateRamo(ramo.id, 'cor', cor.id)}
                            className={`w-3.5 h-3.5 rounded-full ${cor.badge} transition-transform ${
                              ramo.cor === cor.id
                                ? 'scale-125 ring-2 ring-offset-1 ring-stone-400'
                                : 'opacity-60 hover:opacity-100'
                            }`}
                            title={cor.nome}
                          />
                        ))}
                      </div>

                      {/* Excluir Ramo */}
                      <button
                        type="button"
                        onClick={() => handleDeleteRamo(ramo.id)}
                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition"
                        title="Excluir ramificação"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Toggle Expandir */}
                      <button
                        type="button"
                        onClick={() => setRamoAtivoId(isExpanded ? null : ramo.id)}
                        className="p-1 text-stone-500 hover:text-stone-700"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Corpo do Ramo */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 space-y-4 bg-white animate-in fade-in duration-150">
                      {/* Título da Ramificação */}
                      <div>
                        <label className="block text-2xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                          Título da Ramificação *
                        </label>
                        <input
                          type="text"
                          value={ramo.titulo}
                          onChange={(e) => handleUpdateRamo(ramo.id, 'titulo', e.target.value)}
                          placeholder="Ex: Requisitos de Validade, Espécies, Excludentes de Ilicitude..."
                          className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        />
                      </div>

                      {/* Conteúdo Opcional do Ramo */}
                      <div>
                        <label className="block text-2xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                          Conteúdo / Síntese do Ramo (Opcional)
                        </label>
                        <textarea
                          rows={2}
                          value={ramo.conteudo || ''}
                          onChange={(e) => handleUpdateRamo(ramo.id, 'conteudo', e.target.value)}
                          placeholder="Breve explicação, doutrina ou dispositivo de lei conexo..."
                          className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-sans"
                        />
                      </div>

                      {/* Seção de Subramificações / Sub-ramos (Requisito 4 & 5) */}
                      <div className="space-y-3 pt-3 border-t border-stone-100">
                        <div className="flex items-center justify-between">
                          <span className="text-2xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                            <GitBranch className="w-3.5 h-3.5 text-stone-400" />
                            <span>Sub-ramos e Conceitos Derivados</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddSubTopico(ramo.id)}
                            className="text-2xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Adicionar Sub-ramo</span>
                          </button>
                        </div>

                        {ramo.subTopicos.length === 0 ? (
                          <p className="text-2xs text-stone-400 italic py-2">
                            Nenhum sub-ramo adicionado neste nó. Clique acima para detalhar os institutos.
                          </p>
                        ) : (
                          <div className="space-y-2.5">
                            {ramo.subTopicos.map((sub, subIdx) => (
                              <div
                                key={sub.id}
                                className="bg-stone-50 p-3 rounded-xl border border-stone-200/90 space-y-2"
                              >
                                {/* Linha do Subtópico Nível 1 */}
                                <div className="flex items-start gap-2">
                                  <span className="w-5 h-5 rounded-md bg-stone-300 text-stone-800 text-3xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                    {subIdx + 1}
                                  </span>

                                  <div className="flex-1 space-y-1.5 min-w-0">
                                    <input
                                      type="text"
                                      value={sub.texto}
                                      onChange={(e) =>
                                        handleUpdateSubTopico(
                                          ramo.id,
                                          sub.id,
                                          'texto',
                                          e.target.value
                                        )
                                      }
                                      placeholder="Título do sub-ramo (ex: Capacidade do agente)..."
                                      className="w-full px-2.5 py-1 text-xs bg-white border border-stone-300 rounded-lg text-stone-900 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    />
                                    <input
                                      type="text"
                                      value={sub.detalhes || ''}
                                      onChange={(e) =>
                                        handleUpdateSubTopico(
                                          ramo.id,
                                          sub.id,
                                          'detalhes',
                                          e.target.value
                                        )
                                      }
                                      placeholder="Detalhes ou artigo de lei (ex: Art. 104, I, CC)..."
                                      className="w-full px-2.5 py-1 text-2xs bg-white/95 border border-stone-200 rounded-lg text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    />
                                  </div>

                                  {/* Botões do Subtópico: + Sub-subtópico e Excluir */}
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleAddSubSubTopico(ramo.id, sub.id)}
                                      className="p-1 hover:bg-stone-200 text-stone-600 rounded-md transition text-3xs font-semibold"
                                      title="Adicionar sub-sub-ramo (Nível 2)"
                                    >
                                      <CornerDownRight className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSubTopico(ramo.id, sub.id)}
                                      className="p-1 hover:bg-rose-100 text-rose-500 rounded-md transition"
                                      title="Remover sub-ramo"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Seção de Sub-subramificações (Nível 2 - Requisito 5) */}
                                {sub.subTopicos && sub.subTopicos.length > 0 && (
                                  <div className="pl-6 border-l-2 border-dashed border-stone-300 ml-2 space-y-1.5 pt-1">
                                    <span className="text-3xs font-bold uppercase tracking-wider text-stone-400 block">
                                      Nível 2 (Sub-subramificação):
                                    </span>
                                    {sub.subTopicos.map((subSub) => (
                                      <div
                                        key={subSub.id}
                                        className="flex items-center gap-2 bg-white p-2 rounded-lg border border-stone-200"
                                      >
                                        <CornerDownRight className="w-3 h-3 text-stone-400 shrink-0" />
                                        <input
                                          type="text"
                                          value={subSub.texto}
                                          onChange={(e) =>
                                            handleUpdateSubSubTopico(
                                              ramo.id,
                                              sub.id,
                                              subSub.id,
                                              'texto',
                                              e.target.value
                                            )
                                          }
                                          placeholder="Sub-subtópico..."
                                          className="flex-1 px-2 py-0.5 text-2xs bg-stone-50 border border-stone-200 rounded text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                        />
                                        <input
                                          type="text"
                                          value={subSub.detalhes || ''}
                                          onChange={(e) =>
                                            handleUpdateSubSubTopico(
                                              ramo.id,
                                              sub.id,
                                              subSub.id,
                                              'detalhes',
                                              e.target.value
                                            )
                                          }
                                          placeholder="Nota extra..."
                                          className="w-32 px-2 py-0.5 text-3xs bg-stone-50 border border-stone-200 rounded text-stone-600 focus:outline-none focus:ring-1 focus:ring-amber-500 hidden sm:block"
                                        />
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleDeleteSubSubTopico(ramo.id, sub.id, subSub.id)
                                          }
                                          className="p-1 hover:bg-rose-50 text-rose-500 rounded transition"
                                          title="Remover"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
