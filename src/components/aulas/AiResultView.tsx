import React from 'react';
import {
  Sparkles,
  GitBranch,
  LayoutGrid,
  FileText,
  Tag,
  BookOpen,
  ListChecks,
  AlertTriangle,
  Lightbulb,
  Scale,
  Star,
  Bookmark,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

interface AiResultViewProps {
  type: string;
  resultText: string;
  parsedData?: any;
}

export const AiResultView: React.FC<AiResultViewProps> = ({
  type,
  resultText,
  parsedData,
}) => {
  // Safe helper to extract parsed data even if Gemini wraps it in an outer object key
  const getData = () => {
    if (parsedData) return parsedData;
    if (!resultText) return null;
    try {
      // Remove potential markdown code blocks if raw text was passed
      const cleanText = resultText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();
      return JSON.parse(cleanText);
    } catch {
      return null;
    }
  };

  const data = getData();

  // ---------------------------------------------------------------------------
  // 1. MAPA MENTAL
  // ---------------------------------------------------------------------------
  if (type === 'mapa_mental') {
    const temaCentral = data?.temaCentral || data?.tema || 'Tema Central';
    const topicos: any[] = Array.isArray(data?.topicos)
      ? data.topicos
      : Array.isArray(data)
      ? data
      : [];

    return (
      <div className="space-y-5 animate-in fade-in duration-300">
        {/* Tema Central Node */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-5 rounded-2xl shadow-sm border border-amber-500/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <GitBranch className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-3xs uppercase tracking-wider font-bold text-amber-200">
              Tema Central do Mapa Mental
            </span>
            <h3 className="text-lg font-serif font-bold leading-tight">
              {temaCentral}
            </h3>
          </div>
        </div>

        {/* Topicos Tree */}
        {topicos.length > 0 ? (
          <div className="space-y-4 pl-2 sm:pl-4 border-l-2 border-amber-200/80 ml-4 sm:ml-6">
            {topicos.map((topico: any, idx: number) => {
              const titulo = topico?.titulo || topico?.nome || `Tópico ${idx + 1}`;
              const descricao = topico?.descricao || topico?.explicacao || '';
              const subtopicos: string[] = Array.isArray(topico?.subtopicos)
                ? topico.subtopicos
                : Array.isArray(topico?.itens)
                ? topico.itens
                : [];

              return (
                <div
                  key={idx}
                  className="relative bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-3 group hover:border-amber-300 transition"
                >
                  {/* Connector Line Dot */}
                  <div className="absolute -left-[1.65rem] sm:-left-[2.15rem] top-6 w-3 h-3 rounded-full bg-amber-500 border-2 border-white shadow-xs" />

                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-base font-bold text-stone-900">
                        {titulo}
                      </h4>
                      {descricao && (
                        <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                          {descricao}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Subtopicos Chips */}
                  {subtopicos.length > 0 && (
                    <div className="pt-2 border-t border-stone-100 flex flex-wrap gap-1.5 items-center">
                      <span className="text-2xs font-semibold text-stone-400 uppercase tracking-wider mr-1">
                        Subtópicos:
                      </span>
                      {subtopicos.map((sub: string, sIdx: number) => (
                        <span
                          key={sIdx}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 font-medium border border-stone-200/60"
                        >
                          <ChevronRight className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>{typeof sub === 'string' ? sub : (sub as any)?.titulo || JSON.stringify(sub)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 bg-stone-50 rounded-xl text-xs text-stone-600 leading-relaxed">
            {resultText}
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. RESUMO EM QUADROS
  // ---------------------------------------------------------------------------
  if (type === 'quadros') {
    let quadrosList: any[] = [];
    if (Array.isArray(data)) {
      quadrosList = data;
    } else if (data && typeof data === 'object') {
      quadrosList = data.quadros || data.resumoQuadros || data.itens || [data];
    }

    if (quadrosList.length > 0) {
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          {quadrosList.map((quadro: any, qIdx: number) => {
            const titulo = quadro?.titulo || `Quadro ${qIdx + 1}`;
            const conceito = quadro?.conceito || quadro?.descricao || '';
            const artigoLei = quadro?.artigoLei || quadro?.artigo || quadro?.lei || '';
            const palavrasChave: string[] = Array.isArray(quadro?.palavrasChave)
              ? quadro.palavrasChave
              : [];
            const exemplo = quadro?.exemplo || '';
            const pegadinha = quadro?.pegadinha || quadro?.alerta || '';
            const oQueMemorizar = quadro?.oQueMemorizar || quadro?.memorizar || '';

            return (
              <div
                key={qIdx}
                className="bg-white rounded-2xl border border-amber-200/90 shadow-xs overflow-hidden"
              >
                {/* Quadro Header */}
                <div className="bg-gradient-to-r from-amber-700 to-amber-800 text-white px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-amber-300" />
                    <span className="text-xs uppercase tracking-wider font-bold text-amber-200">
                      QUADRO {qIdx + 1}
                    </span>
                  </div>
                  <h4 className="text-base font-serif font-bold text-white">
                    {titulo}
                  </h4>
                </div>

                {/* Quadro Fields Grid */}
                <div className="p-5 space-y-4 text-xs">
                  {/* Conceito */}
                  {conceito && (
                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80 space-y-1">
                      <div className="flex items-center gap-1.5 text-2xs uppercase tracking-wider font-bold text-stone-500">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                        <span>Conceito</span>
                      </div>
                      <p className="text-stone-800 leading-relaxed font-sans text-xs">
                        {conceito}
                      </p>
                    </div>
                  )}

                  {/* Artigo / Lei */}
                  {artigoLei && (
                    <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 space-y-1">
                      <div className="flex items-center gap-1.5 text-2xs uppercase tracking-wider font-bold text-amber-800">
                        <Scale className="w-3.5 h-3.5 text-amber-700" />
                        <span>Artigo / Lei</span>
                      </div>
                      <p className="text-amber-950 font-semibold text-xs">
                        {artigoLei}
                      </p>
                    </div>
                  )}

                  {/* Palavras-Chave */}
                  {palavrasChave.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-2xs uppercase tracking-wider font-bold text-stone-500">
                        <Tag className="w-3.5 h-3.5 text-amber-600" />
                        <span>Palavras-Chave</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {palavrasChave.map((kw: string, kIdx: number) => (
                          <span
                            key={kIdx}
                            className="bg-amber-100/70 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-md font-medium text-xs"
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Exemplo */}
                    {exemplo && (
                      <div className="bg-sky-50/60 p-3.5 rounded-xl border border-sky-200/70 space-y-1">
                        <div className="flex items-center gap-1.5 text-2xs uppercase tracking-wider font-bold text-sky-800">
                          <Bookmark className="w-3.5 h-3.5 text-sky-600" />
                          <span>Exemplo Prático</span>
                        </div>
                        <p className="text-sky-950 leading-relaxed">
                          {exemplo}
                        </p>
                      </div>
                    )}

                    {/* Pegadinha */}
                    {pegadinha && (
                      <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200/70 space-y-1">
                        <div className="flex items-center gap-1.5 text-2xs uppercase tracking-wider font-bold text-rose-800">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Atenção / Pegadinha</span>
                        </div>
                        <p className="text-rose-950 leading-relaxed">
                          {pegadinha}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* O que memorizar */}
                  {oQueMemorizar && (
                    <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-2xs uppercase tracking-wider font-bold text-emerald-800">
                        <Star className="w-3.5 h-3.5 text-emerald-600" />
                        <span>O Que Memorizar</span>
                      </div>
                      <p className="text-emerald-950 font-medium leading-relaxed">
                        {oQueMemorizar}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 3. RESUMIR AULA
  // ---------------------------------------------------------------------------
  if (type === 'resumir') {
    const titulo = data?.titulo || 'Resumo da Aula';
    const resumo = data?.resumo || (typeof data === 'string' ? data : resultText);
    const pontosPrincipais: string[] = Array.isArray(data?.pontosPrincipais)
      ? data.pontosPrincipais
      : Array.isArray(data?.topicos)
      ? data.topicos
      : [];
    const conclusao = data?.conclusao || '';

    return (
      <div className="bg-white p-6 rounded-2xl border border-amber-200/90 shadow-xs space-y-5 animate-in fade-in duration-300">
        <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xs uppercase tracking-wider font-bold text-stone-400">
              Síntese da Aula
            </span>
            <h3 className="text-lg font-serif font-bold text-stone-900">
              {titulo}
            </h3>
          </div>
        </div>

        {/* Resumo Textual */}
        <div className="text-sm text-stone-800 leading-relaxed font-sans space-y-3">
          {typeof resumo === 'string'
            ? resumo.split('\n\n').map((paragraph: string, pIdx: number) => (
                <p key={pIdx}>{paragraph}</p>
              ))
            : JSON.stringify(resumo)}
        </div>

        {/* Pontos Principais */}
        {pontosPrincipais.length > 0 && (
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Pontos-Chave da Aula</span>
            </h4>
            <ul className="space-y-1.5">
              {pontosPrincipais.map((ponto: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-stone-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                  <span>{typeof ponto === 'string' ? ponto : JSON.stringify(ponto)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Conclusão */}
        {conclusao && (
          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Conclusão</span>
            </h4>
            <p className="text-xs text-amber-950 leading-relaxed">{conclusao}</p>
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 4. IDENTIFICAR CONCEITOS PRINCIPAIS
  // ---------------------------------------------------------------------------
  if (type === 'conceitos') {
    let conceitosList: any[] = [];
    if (Array.isArray(data)) {
      conceitosList = data;
    } else if (data && typeof data === 'object') {
      conceitosList = data.conceitos || data.termos || data.itens || [data];
    }

    if (conceitosList.length > 0) {
      return (
        <div className="space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-4 h-4 text-amber-600" />
            <h4 className="text-sm font-bold text-stone-900">
              Conceitos Fundamentais Identificados ({conceitosList.length})
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {conceitosList.map((c: any, idx: number) => {
              const termo = c?.termo || c?.nome || c?.conceito || `Conceito ${idx + 1}`;
              const definicao = c?.definicao || c?.explicacao || c?.descricao || '';
              const relacao = c?.relacao || c?.contexto || '';

              return (
                <div
                  key={idx}
                  className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-2xs space-y-2 flex flex-col justify-between hover:border-amber-300 transition"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold">
                        {termo}
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed">
                      {definicao}
                    </p>
                  </div>

                  {relacao && (
                    <div className="pt-2 border-t border-stone-100 flex items-center gap-1.5 text-2xs text-stone-500">
                      <span className="font-semibold text-stone-400 uppercase">Relação:</span>
                      <span className="italic">{relacao}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 5. IDENTIFICAR ARTIGOS E LEIS
  // ---------------------------------------------------------------------------
  if (type === 'artigos') {
    let artigosList: any[] = [];
    if (Array.isArray(data)) {
      artigosList = data;
    } else if (data && typeof data === 'object') {
      artigosList = data.artigos || data.leis || data.legislacao || [data];
    }

    if (artigosList.length > 0) {
      return (
        <div className="space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 mb-2">
            <Scale className="w-4 h-4 text-amber-700" />
            <h4 className="text-sm font-bold text-stone-900">
              Legislação e Dispositivos Legais Mencionados ({artigosList.length})
            </h4>
          </div>

          <div className="space-y-3">
            {artigosList.map((art: any, idx: number) => {
              const legislacao = art?.legislacao || art?.lei || 'Legislação';
              const artigo = art?.artigo || art?.numero || '';
              const descricao = art?.descricao || art?.explicacao || art?.conteudo || '';

              return (
                <div
                  key={idx}
                  className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-2xs space-y-2 hover:border-amber-400 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2">
                    <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                      ⚖️ {legislacao}
                    </span>
                    {artigo && (
                      <span className="text-xs font-serif font-bold text-stone-800">
                        {artigo}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed font-sans">
                    {descricao}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 6. CRIAR PONTOS PARA MEMORIZAR
  // ---------------------------------------------------------------------------
  if (type === 'memorizar') {
    let memorizarList: any[] = [];
    if (Array.isArray(data)) {
      memorizarList = data;
    } else if (data && typeof data === 'object') {
      memorizarList = data.memorizar || data.pontos || data.checklist || [data];
    }

    if (memorizarList.length > 0) {
      return (
        <div className="space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 mb-2">
            <ListChecks className="w-4 h-4 text-amber-600" />
            <h4 className="text-sm font-bold text-stone-900">
              Pontos Cruciais para Memorização ({memorizarList.length})
            </h4>
          </div>

          <div className="space-y-2.5">
            {memorizarList.map((item: any, idx: number) => {
              const ponto = item?.ponto || item?.titulo || item?.item || `Ponto ${idx + 1}`;
              const explicacao = item?.explicacao || item?.detalhe || item?.descricao || '';

              return (
                <div
                  key={idx}
                  className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex items-start gap-3 hover:border-amber-300 transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Star className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-stone-900">
                      {ponto}
                    </h5>
                    {explicacao && (
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {explicacao}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  }

  // Fallback for general markdown or plain text response
  return (
    <div className="bg-white p-5 rounded-xl border border-amber-200/90 shadow-xs space-y-3 animate-in fade-in duration-300">
      <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
        <Sparkles className="w-4 h-4 text-amber-600" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
          Resultado do Assistente
        </h4>
      </div>
      <div className="text-xs text-stone-800 leading-relaxed whitespace-pre-wrap font-sans">
        {resultText}
      </div>
    </div>
  );
};
