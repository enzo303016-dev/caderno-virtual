import React, { useState, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Highlighter,
  Quote,
  Scale,
  Minus,
  Eye,
  Edit3,
} from 'lucide-react';

interface AnotacaoLivreEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export const AnotacaoLivreEditor: React.FC<AnotacaoLivreEditorProps> = ({
  value,
  onChange,
  placeholder = 'Escreva sua anotação jurídica aqui... Use a barra de ferramentas para formatar conceitos, leis e citações.',
}) => {
  const [modoVisualizacao, setModoVisualizacao] = useState<'editor' | 'preview'>('editor');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const aplicarFormatacao = (prefixo: string, sufixo: string = '', textoPadrao: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textoCompleto = textarea.value;
    const textoSelecionado = textoCompleto.substring(start, end);

    const textoInserido = textoSelecionado || textoPadrao;
    const novoTexto =
      textoCompleto.substring(0, start) +
      prefixo +
      textoInserido +
      sufixo +
      textoCompleto.substring(end);

    onChange(novoTexto);

    setTimeout(() => {
      textarea.focus();
      const novoCursor = start + prefixo.length + textoInserido.length + sufixo.length;
      textarea.setSelectionRange(novoCursor, novoCursor);
    }, 10);
  };

  const inserirNoInicioLinha = (marcador: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const texto = textarea.value;
    const inicioLinha = texto.lastIndexOf('\n', start - 1) + 1;
    const novoTexto =
      texto.substring(0, inicioLinha) + marcador + texto.substring(inicioLinha);

    onChange(novoTexto);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + marcador.length, start + marcador.length);
    }, 10);
  };

  // Renderizador simples e seguro de formatação textual e jurídica
  const renderPreview = (texto: string) => {
    if (!texto.trim()) {
      return (
        <p className="text-stone-400 italic text-sm py-8 text-center">
          Nenhum conteúdo para pré-visualizar. Comece a digitar na aba &quot;Editor&quot;.
        </p>
      );
    }

    const linhas = texto.split('\n');
    return (
      <div className="space-y-3 font-sans text-stone-800 leading-relaxed text-sm">
        {linhas.map((linha, idx) => {
          if (linha.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-base font-bold text-stone-900 font-serif mt-3">
                {linha.replace('### ', '')}
              </h3>
            );
          }
          if (linha.startsWith('## ')) {
            return (
              <h2 key={idx} className="text-lg font-bold text-stone-900 font-serif mt-4 border-b border-stone-200 pb-1">
                {linha.replace('## ', '')}
              </h2>
            );
          }
          if (linha.startsWith('# ')) {
            return (
              <h1 key={idx} className="text-xl font-bold text-stone-900 font-serif mt-5 border-b-2 border-amber-600 pb-1">
                {linha.replace('# ', '')}
              </h1>
            );
          }
          if (linha.startsWith('> ')) {
            return (
              <blockquote
                key={idx}
                className="border-l-4 border-amber-600 bg-amber-50/60 pl-3 py-1.5 text-stone-700 italic rounded-r-md text-xs sm:text-sm font-serif my-2"
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
                <span dangerouslySetInnerHTML={{ __html: formatInline(linha.replace(/^\d+\.\s/, '')) }} />
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
    let out = str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Negrito: **texto**
    out = out.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Itálico: *texto*
    out = out.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Destaque marcador: ==texto==
    out = out.replace(/==(.*?)==/g, '<mark class="bg-amber-200/80 px-1 rounded text-stone-900">$1</mark>');
    // Artigo de lei com estilo destacado
    out = out.replace(/(Art\.\s*\d+[º\d\w\s\-]*)/gi, '<span class="font-semibold text-amber-900 bg-amber-100/70 px-1 rounded">$1</span>');

    return out;
  };

  const countWords = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);
  const countChars = (t: string) => t.length;

  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-xs">
      {/* Barra de Ferramentas Superior */}
      <div className="bg-stone-50 border-b border-stone-200 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {/* Formatação Básica */}
          <div className="flex items-center gap-0.5 bg-white border border-stone-200 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => aplicarFormatacao('**', '**', 'negrito')}
              title="Negrito (**texto**)"
              className="p-1.5 hover:bg-stone-100 rounded text-stone-700 transition hover:text-stone-900"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => aplicarFormatacao('*', '*', 'itálico')}
              title="Itálico (*texto*)"
              className="p-1.5 hover:bg-stone-100 rounded text-stone-700 transition hover:text-stone-900"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => aplicarFormatacao('<u>', '</u>', 'sublinhado')}
              title="Sublinhado"
              className="p-1.5 hover:bg-stone-100 rounded text-stone-700 transition hover:text-stone-900"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => aplicarFormatacao('==', '==', 'destaque')}
              title="Destaque Marcador (==texto==)"
              className="p-1.5 hover:bg-stone-100 rounded text-amber-600 transition hover:text-amber-700"
            >
              <Highlighter className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Títulos */}
          <div className="flex items-center gap-0.5 bg-white border border-stone-200 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => inserirNoInicioLinha('# ')}
              title="Título Principal (H1)"
              className="p-1.5 hover:bg-stone-100 rounded text-stone-700 transition hover:text-stone-900"
            >
              <Heading1 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => inserirNoInicioLinha('## ')}
              title="Subtítulo (H2)"
              className="p-1.5 hover:bg-stone-100 rounded text-stone-700 transition hover:text-stone-900"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => inserirNoInicioLinha('### ')}
              title="Seção / Tópico (H3)"
              className="p-1.5 hover:bg-stone-100 rounded text-stone-700 transition hover:text-stone-900"
            >
              <Heading3 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Listas & Citações */}
          <div className="flex items-center gap-0.5 bg-white border border-stone-200 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => inserirNoInicioLinha('- ')}
              title="Lista com Marcadores"
              className="p-1.5 hover:bg-stone-100 rounded text-stone-700 transition hover:text-stone-900"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => inserirNoInicioLinha('1. ')}
              title="Lista Numerada"
              className="p-1.5 hover:bg-stone-100 rounded text-stone-700 transition hover:text-stone-900"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => inserirNoInicioLinha('> ')}
              title="Citação Doutrinária / Jurisprudência"
              className="p-1.5 hover:bg-stone-100 rounded text-stone-700 transition hover:text-stone-900"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => aplicarFormatacao('> **Art. ', '** - [Texto da Lei]', 'Número do Artigo')}
              title="Inserir Artigo / Lei"
              className="px-2 py-1 hover:bg-amber-50 rounded text-amber-800 text-xs font-semibold transition flex items-center gap-1"
            >
              <Scale className="w-3.5 h-3.5 text-amber-600" />
              <span>Artigo</span>
            </button>
            <button
              type="button"
              onClick={() => aplicarFormatacao('\n---\n')}
              title="Linha Divisória"
              className="p-1.5 hover:bg-stone-100 rounded text-stone-700 transition hover:text-stone-900"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Abas Editor / Pré-visualização */}
        <div className="flex items-center gap-1 bg-stone-200/70 p-0.5 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => setModoVisualizacao('editor')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition ${
              modoVisualizacao === 'editor'
                ? 'bg-white text-stone-900 font-semibold shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setModoVisualizacao('preview')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition ${
              modoVisualizacao === 'preview'
                ? 'bg-white text-stone-900 font-semibold shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Leitura</span>
          </button>
        </div>
      </div>

      {/* Área de Conteúdo */}
      <div className="p-3">
        {modoVisualizacao === 'editor' ? (
          <textarea
            ref={textareaRef}
            rows={14}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full text-sm text-stone-800 leading-relaxed font-sans placeholder-stone-400 focus:outline-none border-0 resize-y p-1"
          />
        ) : (
          <div className="min-h-[280px] p-2 bg-stone-50/50 rounded-lg overflow-y-auto max-h-[400px]">
            {renderPreview(value)}
          </div>
        )}
      </div>

      {/* Barra Inferior com Estatísticas */}
      <div className="bg-stone-50 border-t border-stone-200 px-3 py-1.5 text-2xs text-stone-500 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span>{countWords(value)} palavras</span>
          <span>•</span>
          <span>{countChars(value)} caracteres</span>
        </div>
        <div className="text-stone-400">
          {modoVisualizacao === 'editor' ? 'Edição livre com atalhos markdown' : 'Modo de leitura formatada'}
        </div>
      </div>
    </div>
  );
};
