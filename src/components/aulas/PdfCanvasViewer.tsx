import React, { useEffect, useRef, useState } from 'react';
import {
  FileText,
  Download,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  ChevronUp,
  ChevronDown,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Polyfills essenciais para compatibilidade de motores JS (resolve "toHex is not a function" e "withResolvers")
if (typeof Uint8Array !== 'undefined' && !(Uint8Array.prototype as any).toHex) {
  (Uint8Array.prototype as any).toHex = function () {
    let hex = '';
    for (let i = 0; i < this.length; i++) {
      hex += this[i].toString(16).padStart(2, '0');
    }
    return hex;
  };
}

if (typeof (Promise as any).withResolvers === 'undefined') {
  (Promise as any).withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

// Configura o worker empacotado localmente pelo Vite (sem dependência de CDN externo)
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.mjs',
        import.meta.url
      ).toString();
    } catch (e) {
      console.warn('Worker PDF local fallback:', e);
    }
  }
}

interface PdfCanvasViewerProps {
  pdfBinaryData: ArrayBuffer | Uint8Array;
  fileName: string;
  fileSize?: string;
  onClose: () => void;
  onDownload?: () => void;
}

interface PageRenderItemProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  rotation: number;
}

const PageCanvas: React.FC<PageRenderItemProps> = ({
  pdfDoc,
  pageNumber,
  scale,
  rotation,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRendering, setIsRendering] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    let isCancelled = false;

    async function renderPage() {
      try {
        setIsRendering(true);
        setRenderError(null);

        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const viewport = page.getViewport({ scale, rotation });
        const outputScale = window.devicePixelRatio || 1;

        // Dimensões reais do canvas ajustadas para alta densidade de pixels (Retina / High-DPI)
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Cancela tarefa de renderização anterior na mesma página caso haja alteração rápida de zoom
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {
            // ignora cancelamento prévio
          }
        }

        const renderContext: any = {
          canvasContext: ctx,
          canvas,
          viewport,
          transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        if (!isCancelled) {
          setIsRendering(false);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const errorObj = err as { name?: string; message?: string };
          if (errorObj?.name !== 'RenderingCancelledException') {
            console.error(`Erro ao renderizar página ${pageNumber}:`, err);
            setRenderError('Erro ao renderizar página');
            setIsRendering(false);
          }
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignora cancelamento
        }
      }
    };
  }, [pdfDoc, pageNumber, scale, rotation]);

  return (
    <div className="relative flex flex-col items-center my-4">
      {/* Indicador de número de página */}
      <div className="self-end mb-1 text-3xs font-mono text-stone-400 bg-stone-800/80 px-2 py-0.5 rounded shadow-xs">
        Pág. {pageNumber} de {pdfDoc.numPages}
      </div>

      {/* Container da Página */}
      <div className="relative shadow-2xl bg-white rounded border border-stone-300 overflow-hidden min-h-[300px] flex items-center justify-center">
        {isRendering && (
          <div className="absolute inset-0 bg-stone-50/80 backdrop-blur-xs flex items-center justify-center z-10">
            <div className="flex items-center gap-2 text-stone-600 text-xs font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
              <span>Renderizando pág. {pageNumber}...</span>
            </div>
          </div>
        )}

        {renderError ? (
          <div className="p-8 text-center text-xs text-rose-500 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{renderError}</span>
          </div>
        ) : (
          <canvas ref={canvasRef} className="block max-w-full" />
        )}
      </div>
    </div>
  );
};

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  pdfBinaryData,
  fileName,
  fileSize,
  onClose,
  onDownload,
}) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.15);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const viewerContainerRef = useRef<HTMLDivElement | null>(null);

  // Carrega o documento PDF a partir dos dados binários recuperados do IndexedDB
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setErrorMessage(null);

    async function loadDocument() {
      try {
        // Clona os dados binários para evitar detached ArrayBuffer em workers
        const dataBuffer =
          pdfBinaryData instanceof ArrayBuffer
            ? new Uint8Array(pdfBinaryData.slice(0))
            : new Uint8Array(pdfBinaryData.buffer.slice(0));

        const loadingTask = pdfjsLib.getDocument({
          data: dataBuffer,
        });

        const doc = await loadingTask.promise;
        if (!isCancelled) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          console.error('Erro ao carregar documento PDF:', err);
          setErrorMessage('Não foi possível ler o arquivo PDF. O arquivo pode estar corrompido ou em formato incompatível.');
          setLoading(false);
        }
      }
    }

    loadDocument();

    return () => {
      isCancelled = true;
    };
  }, [pdfBinaryData]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 2.5));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.6));
  };

  const handleResetZoom = () => {
    setScale(1.15);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const scrollToTop = () => {
    if (viewerContainerRef.current) {
      viewerContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    if (viewerContainerRef.current) {
      viewerContainerRef.current.scrollTo({
        top: viewerContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  const pageNumbers = Array.from({ length: numPages }, (_, i) => i + 1);

  return (
    <div
      className={`bg-stone-900 rounded-2xl border-2 border-amber-300 shadow-xl overflow-hidden flex flex-col transition-all duration-200 ${
        isFullscreen ? 'fixed inset-4 z-50 rounded-2xl' : 'w-full my-4'
      }`}
      style={{ height: isFullscreen ? 'calc(100vh - 32px)' : '78vh' }}
    >
      {/* Barra Superior de Controle */}
      <div className="bg-stone-800 px-4 py-3 border-b border-stone-700 flex flex-wrap items-center justify-between gap-3 text-white">
        {/* Informações do Arquivo */}
        <div className="flex items-center gap-2.5 truncate min-w-0">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-rose-400" />
          </div>
          <div className="truncate">
            <p className="font-serif font-bold text-xs sm:text-sm text-stone-100 truncate" title={fileName}>
              {fileName}
            </p>
            <div className="flex items-center gap-2 text-3xs text-stone-400 font-mono">
              {numPages > 0 && <span>{numPages} {numPages === 1 ? 'página' : 'páginas'}</span>}
              {fileSize && <span>• {fileSize}</span>}
            </div>
          </div>
        </div>

        {/* Ferramentas de Zoom, Rotação e Navegação */}
        {!loading && !errorMessage && (
          <div className="flex items-center gap-1.5 bg-stone-900/90 px-2 py-1 rounded-xl border border-stone-700">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-stone-800 rounded-lg text-stone-300 hover:text-white transition"
              title="Reduzir Zoom (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2 py-1 text-3xs font-mono font-bold text-amber-400 hover:bg-stone-800 rounded transition"
              title="Resetar Zoom"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-stone-800 rounded-lg text-stone-300 hover:text-white transition"
              title="Aumentar Zoom (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-4 bg-stone-700 mx-1" />

            <button
              type="button"
              onClick={handleRotate}
              className="p-1.5 hover:bg-stone-800 rounded-lg text-stone-300 hover:text-white transition"
              title="Girar 90°"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={scrollToTop}
              className="p-1.5 hover:bg-stone-800 rounded-lg text-stone-300 hover:text-white transition hidden sm:inline-flex"
              title="Ir para o topo"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={scrollToBottom}
              className="p-1.5 hover:bg-stone-800 rounded-lg text-stone-300 hover:text-white transition hidden sm:inline-flex"
              title="Ir para o final"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Ações de Download e Fechar */}
        <div className="flex items-center gap-2">
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Baixar PDF</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg transition"
            title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 hover:text-white rounded-lg text-xs font-bold transition"
          >
            <X className="w-3.5 h-3.5" />
            <span>Voltar para aula</span>
          </button>
        </div>
      </div>

      {/* Área de Visualização com Scroll Vertical das Páginas */}
      <div
        ref={viewerContainerRef}
        className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-8 flex flex-col items-center bg-stone-950/90"
        style={{ scrollBehavior: 'smooth' }}
      >
        {loading && (
          <div className="my-auto py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
            <p className="text-xs text-stone-300 font-medium">
              Carregando e processando documento PDF...
            </p>
            <p className="text-3xs text-stone-500">
              Renderizando páginas via Canvas integrado
            </p>
          </div>
        )}

        {errorMessage && !loading && (
          <div className="my-auto py-16 text-center space-y-3 max-w-md bg-stone-900 p-6 rounded-2xl border border-rose-500/30">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-sm font-semibold text-rose-400">Erro ao exibir PDF</p>
            <p className="text-xs text-stone-300">{errorMessage}</p>
            {onDownload && (
              <button
                type="button"
                onClick={onDownload}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar arquivo PDF</span>
              </button>
            )}
          </div>
        )}

        {!loading && !errorMessage && pdfDoc && (
          <div className="flex flex-col items-center w-full max-w-full">
            {pageNumbers.map((pNum) => (
              <PageCanvas
                key={`page-${pNum}`}
                pdfDoc={pdfDoc}
                pageNumber={pNum}
                scale={scale}
                rotation={rotation}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
