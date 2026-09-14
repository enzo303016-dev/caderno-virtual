import React, { useState } from 'react';
import {
  X,
  Edit2,
  Copy,
  Star,
  BookOpen,
  Calendar,
  User,
  Link2,
  FileText,
  Video,
  LayoutGrid,
  GitBranch,
  Tag,
  Scale,
  Key,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  Printer,
  Eye,
  CornerDownRight,
  ListTree,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Anotacao, Aula } from '../../types';

interface AnotacaoVisualizadorModalProps {
  isOpen: boolean;
  onClose: () => void;
  anotacao: Anotacao | null;
  aulaRelacionada?: Aula | null;
  onEdit: (anotacao: Anotacao) => void;
  onDuplicate: (id: string) => void;
  onToggleFavorito: (id: string) => void;
  onAbrirAula: (aulaId: string) => void;
  onAbrirPdfAula?: (aula: Aula) => void;
}

export const AnotacaoVisualizadorModal: React.FC<AnotacaoVisualizadorModalProps> = ({
  isOpen,
  onClose,
  anotacao,
  aulaRelacionada,
  onEdit,
  onDuplicate,
  onToggleFavorito,
  onAbrirAula,
  onAbrirPdfAula,
}) => {
  // Controle de Modo Leitura (Requisito 3 & 7)
  const [modoLeitura, setModoLeitura] = useState(false);

  if (!isOpen || !anotacao) return null;

  const handlePrint = () => {
    window.print();
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'quadros':
        return {
          icon: LayoutGrid,
          label: 'Resumo em Quadros',
          color: 'bg-amber-100 text-amber-900 border-amber-300',
        };
      case 'mapa_mental':
        return {
          icon: GitBranch,
          label: 'Mapa Mental',
          color: 'bg-stone-800 text-stone-100 border-stone-700',
        };
      default:
        return {
          icon: FileText,
          label: 'Anotação Livre',
          color: 'bg-stone-100 text-stone-800 border-stone-300',
        };
    }
  };

  const tipoBadge = getTipoBadge(anotacao.tipo || 'livre');
  const TipoIcon = tipoBadge.icon;

  // Renderizador seguro do texto livre
  const renderTextoLivre = (texto: string) => {
    if (!texto.trim()) {
      return (
        <p className="text-stone-400 italic text-sm">
          Nenhum texto registrado nesta anotação.
        </p>
      );
    }

    const linhas = texto.split('\n');
    return (
      <div className="space-y-3 font-sans text-stone-800 leading-relaxed text-sm max-w-4xl">
        {linhas.map((linha, idx) => {
          if (linha.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-base font-bold text-stone-900 font-serif mt-4">
                {linha.replace('### ', '')}
              </h3>
            );
          }
          if (linha.startsWith('## ')) {
            return (
              <h2
                key={idx}
                className="text-lg font-bold text-stone-900 font-serif mt-5 border-b border-stone-200 pb-1"
              >
                {linha.replace('## ', '')}
              </h2>
            );
          }
          if (linha.startsWith('# ')) {
            return (
              <h1
                key={idx}
                className="text-xl font-bold text-stone-900 font-serif mt-6 border-b-2 border-amber-600 pb-1"
              >
                {linha.replace('# ', '')}
              </h1>
            );
          }
          if (linha.startsWith('> ')) {
            return (
              <blockquote
                key={idx}
                className="border-l-4 border-amber-600 bg-amber-50/70 pl-3 py-2 text-stone-800 italic rounded-r-md text-xs sm:text-sm font-serif my-2"
              >
                {linha.replace('> ', '')}
              </blockquote>
            );
          }
          if (linha.startsWith('- ') || linha.startsWith('* ')) {
            return (
              <li key={idx} className="ml-5 list-disc text-stone-700">
                <span dangerouslySetInnerHTML={{ __html: formatInline(linha.substring(2)) }} />
              </li>
            );
          }
          if (/^\d+\.\s/.test(linha)) {
            return (
              <li key={idx} className="ml-5 list-decimal text-stone-700">
                <span
                  dangerouslySetInnerHTML={{
                    __html: formatInline(linha.replace(/^\d+\.\s/, '')),
                  }}
                />
              </li>
            );
          }
          if (linha.trim() === '---') {
            return <hr key={idx} className="my-4 border-stone-200" />;
          }
          if (!linha.trim()) {
            return <div key={idx} className="h-2" />;
          }

          return (
            <p key={idx} className="text-stone-700">
              <span dangerouslySetInnerHTML={{ __html: formatInline(linha) }} />
            </p>
          );
        })}
      </div>
    );
  };

  const formatInline = (str: string) => {
    let out = str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    out = out.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/\*(.*?)\*/g, '<em>$1</em>');
    out = out.replace(
      /==(.*?)==/g,
      '<mark class="bg-amber-200/80 px-1 rounded text-stone-900">$1</mark>'
    );
    out = out.replace(
      /(Art\.\s*\d+[º\d\w\s\-]*)/gi,
      '<span class="font-semibold text-amber-900 bg-amber-100/70 px-1 rounded">$1</span>'
    );

    return out;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={anotacao.titulo} maxWidth="6xl">
      <div className="flex flex-col max-h-[85vh]">
        {/* Barra superior de Metadados e Ações */}
        <div className="p-4 sm:p-5 bg-stone-50 border-b border-stone-200 shrink-0 space-y-3 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {/* Badge de Tipo */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${tipoBadge.color}`}
              >
                <TipoIcon className="w-3.5 h-3.5" />
                <span>{tipoBadge.label}</span>
              </span>

              {/* Matéria */}
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-stone-300 text-stone-800">
                {anotacao.disciplina}
              </span>

              {/* Data */}
              <span className="flex items-center gap-1 text-2xs text-stone-500">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>{anotacao.data.split('-').reverse().join('/')}</span>
              </span>

              {/* Professor */}
              {anotacao.professor && (
                <span className="flex items-center gap-1 text-2xs text-stone-500">
                  <User className="w-3.5 h-3.5 text-stone-400" />
                  <span>Prof. {anotacao.professor}</span>
                </span>
              )}
            </div>

            {/* Ações Rápidas: Modo Leitura / Ver Mapa, Imprimir, Editar, Favorito */}
            <div className="flex items-center gap-1.5">
              {/* Botão Modo Leitura / Ver Mapa (Requisito 3 & 7) */}
              <button
                type="button"
                onClick={() => setModoLeitura(!modoLeitura)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition shadow-2xs ${
                  modoLeitura
                    ? 'bg-amber-600 text-white border-amber-700'
                    : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-300'
                }`}
                title="Alternar modo de leitura e revisão limpa"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>
                  {modoLeitura
                    ? 'Voltar da Leitura'
                    : anotacao.tipo === 'mapa_mental'
                    ? '👁 Ver Mapa'
                    : '👁 Modo Leitura'}
                </span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-700 rounded-lg border border-stone-300 text-xs font-semibold transition shadow-2xs"
                title="Imprimir anotação / resumo"
              >
                <Printer className="w-3.5 h-3.5 text-stone-600" />
                <span className="hidden sm:inline">🖨 Imprimir</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleFavorito(anotacao.id)}
                className={`p-1.5 rounded-lg border transition ${
                  anotacao.favorito
                    ? 'bg-amber-100 border-amber-300 text-amber-900'
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
                title={anotacao.favorito ? 'Remover dos favoritos' : 'Favoritar anotação'}
              >
                <Star
                  className={`w-4 h-4 ${
                    anotacao.favorito ? 'fill-amber-500 text-amber-500' : 'text-stone-400'
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={() => onDuplicate(anotacao.id)}
                className="p-1.5 bg-white hover:bg-stone-100 text-stone-600 rounded-lg border border-stone-200 transition"
                title="Duplicar anotação"
              >
                <Copy className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(anotacao);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition ml-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
            </div>
          </div>

          {/* Seção de Aula Relacionada (Oculta no Modo Leitura para foco puro) */}
          {!modoLeitura && aulaRelacionada && (
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Link2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="text-2xs font-bold uppercase tracking-wider text-amber-900/70 block">
                    Aula Relacionada
                  </span>
                  <span className="font-semibold text-xs sm:text-sm text-stone-900">
                    {aulaRelacionada.titulo}
                  </span>
                  <span className="text-2xs text-stone-500 block mt-0.5">
                    Ministrada em {aulaRelacionada.data.split('-').reverse().join('/')}
                    {aulaRelacionada.horario ? ` às ${aulaRelacionada.horario}` : ''}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onAbrirAula(aulaRelacionada.id);
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1.5"
                >
                  <span>Abrir aula</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                {aulaRelacionada.materialPdf && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onAbrirPdfAula) onAbrirPdfAula(aulaRelacionada);
                      else onAbrirAula(aulaRelacionada.id);
                    }}
                    className="px-2.5 py-1.5 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 rounded-lg text-xs font-medium transition flex items-center gap-1"
                    title={`Abrir PDF: ${aulaRelacionada.materialPdf.nome}`}
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-700" />
                    <span className="truncate max-w-[130px]">
                      PDF: {aulaRelacionada.materialPdf.nome}
                    </span>
                  </button>
                )}

                {aulaRelacionada.linkAula && (
                  <a
                    href={aulaRelacionada.linkAula}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 rounded-lg text-xs font-medium transition flex items-center gap-1"
                  >
                    <Video className="w-3.5 h-3.5 text-red-600" />
                    <span>Vídeo / Aula Online</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {!modoLeitura && anotacao.tags && anotacao.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <Tag className="w-3 h-3 text-stone-400" />
              {anotacao.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-stone-200/80 text-stone-700 text-2xs font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Corpo de Visualização */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 print:p-0">
          {/* TIPO 1: ANOTAÇÃO LIVRE */}
          {(!anotacao.tipo || anotacao.tipo === 'livre') && (
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-stone-200 shadow-xs print:border-none">
              {renderTextoLivre(anotacao.conteudo)}
            </div>
          )}

          {/* TIPO 2: RESUMO EM QUADROS */}
          {anotacao.tipo === 'quadros' && (
            <div className="space-y-4">
              {!anotacao.quadros || anotacao.quadros.length === 0 ? (
                <div className="text-center py-12 text-stone-400 text-xs">
                  Nenhum quadro preenchido neste resumo. Clique no botão &quot;Editar&quot; para adicionar
                  quadros.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-4">
                  {anotacao.quadros.map((quadro, idx) => {
                    const isPersonalizado = quadro.tipoQuadro === 'personalizado';

                    return (
                      <div
                        key={quadro.id || idx}
                        className="border-2 border-stone-300 rounded-2xl bg-white shadow-xs overflow-hidden flex flex-col justify-between print:break-inside-avoid"
                      >
                        {/* Topo do Cartão com Título */}
                        <div className="p-3.5 bg-stone-100 border-b-2 border-stone-200 flex items-center justify-between">
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

                        {/* Conteúdo do Cartão */}
                        {isPersonalizado ? (
                          /* Quadro Personalizado (Requisito 2) */
                          <div className="p-4 flex-1">
                            <span className="text-3xs font-bold uppercase tracking-wider text-stone-400 block mb-1">
                              Conteúdo
                            </span>
                            <div className="text-xs text-stone-800 leading-relaxed whitespace-pre-line font-sans">
                              {quadro.conteudoPersonalizado ||
                                quadro.conceito ||
                                'Nenhum conteúdo registrado.'}
                            </div>
                          </div>
                        ) : (
                          /* Quadro Padrão com os 7 campos */
                          <div className="divide-y divide-stone-200 text-xs text-stone-800 flex-1">
                            {/* Conceito */}
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

                            {/* Artigo / Lei */}
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

                            {/* Palavras-chave */}
                            {quadro.palavrasChave && (
                              <div className="p-3.5 space-y-1">
                                <span className="text-3xs font-bold uppercase tracking-wider text-stone-500 block flex items-center gap-1">
                                  <Key className="w-3 h-3 text-stone-400" />
                                  <span>Palavras-chave</span>
                                </span>
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                  {quadro.palavrasChave.split(/[,;]/).map((p, pIdx) => (
                                    <span
                                      key={pIdx}
                                      className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-stone-800 text-3xs font-semibold"
                                    >
                                      {p.trim()}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Exemplo */}
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

                            {/* Pegadinha de Prova */}
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

                            {/* O que memorizar */}
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
              )}
            </div>
          )}

          {/* TIPO 3: MAPA MENTAL (Requisito 6 & 7) */}
          {anotacao.tipo === 'mapa_mental' && (
            <div className="space-y-6">
              {!anotacao.mapaMental || anotacao.mapaMental.ramificacoes.length === 0 ? (
                <div className="text-center py-12 text-stone-400 text-xs">
                  Nenhuma ramificação registrada no mapa mental. Clique em &quot;Editar&quot; para adicionar
                  ramos e subtópicos.
                </div>
              ) : (
                <div className="bg-stone-50/70 border-2 border-stone-200/90 rounded-2xl p-4 sm:p-6 overflow-x-auto print:bg-white print:border-none print:p-0">
                  <div className="min-w-[550px] flex flex-col items-center space-y-6 print:min-w-0">
                    {/* Nó Central */}
                    <div className="max-w-lg w-full text-center px-6 py-4 bg-stone-900 text-white rounded-2xl shadow-md border-2 border-amber-600/60 print:border-stone-800">
                      <span className="text-3xs font-bold text-amber-400 uppercase tracking-widest block mb-1">
                        Ideia Central
                      </span>
                      <h2 className="text-base sm:text-lg font-serif font-bold tracking-wide">
                        {anotacao.mapaMental.noCentral || anotacao.titulo}
                      </h2>
                      {anotacao.mapaMental.descricaoCentral && (
                        <p className="text-xs text-stone-300 mt-1 font-sans leading-relaxed">
                          {anotacao.mapaMental.descricaoCentral}
                        </p>
                      )}
                    </div>

                    <div className="w-1 h-8 bg-amber-500 rounded-full -my-3" />

                    {/* Ramificações */}
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 print:grid-cols-2 print:gap-4">
                      {anotacao.mapaMental.ramificacoes.map((ramo, rIdx) => (
                        <div
                          key={ramo.id || rIdx}
                          className="rounded-2xl border-2 border-stone-300 p-4 bg-white shadow-xs space-y-3.5 relative overflow-hidden flex flex-col justify-between print:break-inside-avoid"
                        >
                          <div className="absolute top-0 left-0 bottom-0 w-2 bg-amber-600" />
                          <div className="pl-2">
                            <span className="text-3xs font-bold uppercase tracking-wider text-stone-400 block mb-0.5">
                              Ramo {rIdx + 1}
                            </span>
                            <h3 className="font-serif font-bold text-stone-900 text-sm">
                              {ramo.titulo}
                            </h3>
                            {ramo.conteudo && (
                              <p className="text-xs text-stone-600 mt-1 font-sans leading-relaxed">
                                {ramo.conteudo}
                              </p>
                            )}
                          </div>

                          {/* Subtópicos e Sub-subtópicos */}
                          {ramo.subTopicos && ramo.subTopicos.length > 0 && (
                            <div className="pl-3 border-l-2 border-stone-200 ml-3 space-y-2 pt-1 flex-1">
                              <span className="text-3xs font-bold uppercase tracking-widest text-stone-400 block">
                                Sub-ramos
                              </span>

                              {ramo.subTopicos.map((sub, sIdx) => (
                                <div key={sub.id || sIdx} className="space-y-1.5">
                                  <div className="p-2 rounded-xl text-xs bg-amber-50/70 border border-amber-200/80 font-medium text-stone-900">
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" />
                                      <span className="font-bold">{sub.texto}</span>
                                    </div>
                                    {sub.detalhes && (
                                      <p className="text-2xs text-stone-600 mt-0.5 pl-3.5">
                                        {sub.detalhes}
                                      </p>
                                    )}
                                  </div>

                                  {/* Sub-subtópicos nível 2 */}
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
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé do Visualizador */}
        <div className="bg-stone-50 border-t border-stone-200 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 print:hidden">
          <span className="text-2xs text-stone-500">
            Última modificação:{' '}
            {anotacao.ultimaModificacao ||
              (anotacao.updatedAt
                ? new Date(anotacao.updatedAt).toLocaleString('pt-BR')
                : anotacao.data)}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold rounded-lg transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};
