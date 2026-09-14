import * as pdfjsLib from 'pdfjs-dist';

// Define the worker script path (same as the viewer)
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

/**
 * Extrai todo o texto de um buffer de PDF usando a biblioteca pdfjs-dist.
 * Limitado a um certo número de páginas/caracteres para evitar travamentos
 * em PDFs muito grandes.
 */
export async function extractTextFromPdfBuffer(pdfBinaryData: ArrayBuffer | Uint8Array, maxPages: number = 20): Promise<string> {
  try {
    const dataBuffer =
      pdfBinaryData instanceof ArrayBuffer
        ? new Uint8Array(pdfBinaryData.slice(0))
        : new Uint8Array(pdfBinaryData.buffer.slice(0));

    const loadingTask = pdfjsLib.getDocument({
      data: dataBuffer,
    });

    const doc = await loadingTask.promise;
    const numPagesToExtract = Math.min(doc.numPages, maxPages);
    
    let fullText = "";

    for (let i = 1; i <= numPagesToExtract; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      
      // textContent.items é um array de objetos TextItem
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
        
      fullText += `--- PÁGINA ${i} ---\n${pageText}\n\n`;
    }

    if (doc.numPages > maxPages) {
      fullText += `\n[Nota: Texto truncado nas primeiras ${maxPages} páginas para otimização]`;
    }

    return fullText;
  } catch (error) {
    console.error("Erro ao extrair texto do PDF:", error);
    throw new Error("Não foi possível extrair o texto do PDF.");
  }
}
