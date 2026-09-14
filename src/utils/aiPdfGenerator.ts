import { jsPDF } from 'jspdf';

interface GeneratePdfOptions {
  type: string;
  resultText: string;
  parsedData?: any;
  aulaTitulo?: string;
  disciplina?: string;
}

export const generateAIResultPdf = async ({
  type,
  resultText,
  parsedData,
  aulaTitulo,
  disciplina,
}: GeneratePdfOptions): Promise<void> => {
  // Parse data if needed
  let data = parsedData;
  if (!data && resultText) {
    try {
      const cleanText = resultText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();
      data = JSON.parse(cleanText);
    } catch {
      data = null;
    }
  }

  // Create jsPDF instance (A4 size: 595.28 x 841.89 pt)
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginLeft = 40;
  const marginRight = 40;
  const marginTop = 40;
  const marginBottom = 40;
  const contentWidth = pageWidth - marginLeft - marginRight;

  let y = marginTop;

  // Helper: check page height and add page if needed
  const checkNewPage = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - marginBottom) {
      doc.addPage();
      y = marginTop;
      // Re-add top light header on secondary pages
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(150, 150, 150);
      doc.text('Caderno Virtual - Assistente de IA', marginLeft, 25);
      doc.setDrawColor(230, 230, 230);
      doc.line(marginLeft, 30, pageWidth - marginRight, 30);
    }
  };

  // Helper: print text wrapped with font settings
  const printWrappedText = (
    text: string,
    fontSize = 10,
    isBold = false,
    color = [40, 40, 40] as [number, number, number],
    indent = 0,
    spaceAfter = 6
  ) => {
    if (!text) return;
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(color[0], color[1], color[2]);

    const lineHeight = fontSize * 1.35;
    const availableWidth = contentWidth - indent;
    const lines = doc.splitTextToSize(text, availableWidth);

    for (const line of lines) {
      checkNewPage(lineHeight);
      doc.text(line, marginLeft + indent, y);
      y += lineHeight;
    }
    y += spaceAfter;
  };

  // Helper: draw horizontal rule
  const drawDivider = () => {
    checkNewPage(12);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.75);
    doc.line(marginLeft, y, pageWidth - marginRight, y);
    y += 12;
  };

  // ---------------------------------------------------------------------------
  // HEADER DO DOCUMENTO
  // ---------------------------------------------------------------------------
  // Header Box / Top Banner
  doc.setFillColor(180, 83, 9); // Amber-700
  doc.rect(marginLeft, y, contentWidth, 42, 'F');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Caderno Virtual - Material de Estudo', marginLeft + 12, y + 26);

  y += 54;

  // Meta Information
  if (disciplina) {
    printWrappedText(`Matéria: ${disciplina}`, 9, true, [120, 120, 120], 0, 2);
  }
  if (aulaTitulo) {
    printWrappedText(`Aula: ${aulaTitulo}`, 11, true, [30, 30, 30], 0, 4);
  }

  // Type label map
  const typeLabels: Record<string, string> = {
    mapa_mental: 'MAPA MENTAL',
    quadros: 'RESUMO EM QUADROS',
    resumir: 'RESUMO DA AULA',
    conceitos: 'CONCEITOS PRINCIPAIS',
    artigos: 'LEGISLAÇÃO E ARTIGOS',
    memorizar: 'PONTOS PARA MEMORIZAR',
  };

  const labelStr = typeLabels[type] || 'RESULTADO DA IA';
  printWrappedText(`Tipo de Material: ${labelStr}`, 10, true, [180, 83, 9], 0, 10);
  drawDivider();

  // ---------------------------------------------------------------------------
  // RENDERIZAÇÃO DO CONTEÚDO DEPENDENDO DO TIPO
  // ---------------------------------------------------------------------------

  // 1. MAPA MENTAL
  if (type === 'mapa_mental') {
    const temaCentral = data?.temaCentral || data?.tema || 'Tema Central';
    const topicos: any[] = Array.isArray(data?.topicos)
      ? data.topicos
      : Array.isArray(data)
      ? data
      : [];

    // Box Tema Central
    checkNewPage(40);
    doc.setFillColor(254, 243, 199); // Amber-100
    doc.setDrawColor(245, 158, 11); // Amber-500
    doc.rect(marginLeft, y, contentWidth, 32, 'DF');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(146, 64, 14); // Amber-900
    doc.text(`TEMA CENTRAL: ${temaCentral}`, marginLeft + 10, y + 20);
    y += 44;

    if (topicos.length > 0) {
      topicos.forEach((topico: any, idx: number) => {
        const titulo = topico?.titulo || topico?.nome || `Tópico ${idx + 1}`;
        const descricao = topico?.descricao || topico?.explicacao || '';
        const subtopicos: string[] = Array.isArray(topico?.subtopicos)
          ? topico.subtopicos
          : Array.isArray(topico?.itens)
          ? topico.itens
          : [];

        printWrappedText(`${idx + 1}. ${titulo}`, 11, true, [180, 83, 9], 0, 3);
        if (descricao) {
          printWrappedText(descricao, 9.5, false, [60, 60, 60], 12, 4);
        }

        if (subtopicos.length > 0) {
          subtopicos.forEach((sub: any) => {
            const subText = typeof sub === 'string' ? sub : sub?.titulo || JSON.stringify(sub);
            printWrappedText(`• ${subText}`, 9, false, [90, 90, 90], 24, 2);
          });
          y += 4;
        }
        y += 6;
      });
    } else {
      printWrappedText(resultText, 10, false, [50, 50, 50], 0, 6);
    }
  }

  // 2. RESUMO EM QUADROS
  else if (type === 'quadros') {
    let quadrosList: any[] = [];
    if (Array.isArray(data)) {
      quadrosList = data;
    } else if (data && typeof data === 'object') {
      quadrosList = data.quadros || data.resumoQuadros || data.itens || [data];
    }

    if (quadrosList.length > 0) {
      quadrosList.forEach((quadro: any, qIdx: number) => {
        const titulo = quadro?.titulo || `Quadro ${qIdx + 1}`;
        const conceito = quadro?.conceito || quadro?.descricao || '';
        const artigoLei = quadro?.artigoLei || quadro?.artigo || quadro?.lei || '';
        const palavrasChave: string[] = Array.isArray(quadro?.palavrasChave)
          ? quadro.palavrasChave
          : [];
        const exemplo = quadro?.exemplo || '';
        const pegadinha = quadro?.pegadinha || quadro?.alerta || '';
        const oQueMemorizar = quadro?.oQueMemorizar || quadro?.memorizar || '';

        checkNewPage(30);
        doc.setFillColor(245, 245, 244); // Stone-100
        doc.setDrawColor(214, 211, 209);
        doc.rect(marginLeft, y, contentWidth, 24, 'DF');

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 40, 37);
        doc.text(`QUADRO ${qIdx + 1}: ${titulo.toUpperCase()}`, marginLeft + 8, y + 16);
        y += 32;

        if (conceito) {
          printWrappedText('CONCEITO:', 9, true, [180, 83, 9], 8, 2);
          printWrappedText(conceito, 9.5, false, [40, 40, 40], 16, 6);
        }

        if (artigoLei) {
          printWrappedText('ARTIGO / LEI:', 9, true, [146, 64, 14], 8, 2);
          printWrappedText(artigoLei, 9.5, true, [120, 53, 15], 16, 6);
        }

        if (palavrasChave.length > 0) {
          printWrappedText('PALAVRAS-CHAVE:', 9, true, [180, 83, 9], 8, 2);
          printWrappedText(palavrasChave.map((k) => `#${k}`).join('  '), 9, false, [100, 100, 100], 16, 6);
        }

        if (exemplo) {
          printWrappedText('EXEMPLO PRÁTICO:', 9, true, [14, 116, 144], 8, 2);
          printWrappedText(exemplo, 9, false, [30, 41, 59], 16, 6);
        }

        if (pegadinha) {
          printWrappedText('ATENÇÃO / PEGADINHA:', 9, true, [190, 18, 60], 8, 2);
          printWrappedText(pegadinha, 9, false, [136, 19, 55], 16, 6);
        }

        if (oQueMemorizar) {
          printWrappedText('O QUE MEMORIZAR:', 9, true, [4, 120, 87], 8, 2);
          printWrappedText(oQueMemorizar, 9.5, true, [6, 95, 70], 16, 6);
        }

        drawDivider();
      });
    } else {
      printWrappedText(resultText, 10, false, [50, 50, 50], 0, 6);
    }
  }

  // 3. RESUMIR AULA
  else if (type === 'resumir') {
    const titulo = data?.titulo || 'Resumo da Aula';
    const resumo = data?.resumo || (typeof data === 'string' ? data : resultText);
    const pontosPrincipais: string[] = Array.isArray(data?.pontosPrincipais)
      ? data.pontosPrincipais
      : Array.isArray(data?.topicos)
      ? data.topicos
      : [];
    const conclusao = data?.conclusao || '';

    printWrappedText(titulo, 12, true, [30, 30, 30], 0, 8);

    if (typeof resumo === 'string') {
      resumo.split('\n\n').forEach((paragraph) => {
        printWrappedText(paragraph, 10, false, [50, 50, 50], 0, 8);
      });
    } else {
      printWrappedText(JSON.stringify(resumo), 10, false, [50, 50, 50], 0, 8);
    }

    if (pontosPrincipais.length > 0) {
      drawDivider();
      printWrappedText('PONTOS-CHAVE DA AULA:', 10, true, [180, 83, 9], 0, 6);
      pontosPrincipais.forEach((ponto) => {
        const pontoStr = typeof ponto === 'string' ? ponto : JSON.stringify(ponto);
        printWrappedText(`• ${pontoStr}`, 9.5, false, [40, 40, 40], 10, 3);
      });
      y += 6;
    }

    if (conclusao) {
      drawDivider();
      printWrappedText('CONCLUSÃO:', 10, true, [146, 64, 14], 0, 4);
      printWrappedText(conclusao, 9.5, false, [60, 60, 60], 10, 6);
    }
  }

  // 4. CONCEITOS PRINCIPAIS
  else if (type === 'conceitos') {
    let conceitosList: any[] = [];
    if (Array.isArray(data)) {
      conceitosList = data;
    } else if (data && typeof data === 'object') {
      conceitosList = data.conceitos || data.termos || data.itens || [data];
    }

    if (conceitosList.length > 0) {
      conceitosList.forEach((c: any, idx: number) => {
        const termo = c?.termo || c?.nome || c?.conceito || `Conceito ${idx + 1}`;
        const definicao = c?.definicao || c?.explicacao || c?.descricao || '';
        const relacao = c?.relacao || c?.contexto || '';

        printWrappedText(`${idx + 1}. ${termo}`, 11, true, [180, 83, 9], 0, 3);
        if (definicao) {
          printWrappedText(`Definição: ${definicao}`, 9.5, false, [40, 40, 40], 12, 3);
        }
        if (relacao) {
          printWrappedText(`Relação: ${relacao}`, 9, true, [100, 100, 100], 12, 4);
        }
        y += 4;
      });
    } else {
      printWrappedText(resultText, 10, false, [50, 50, 50], 0, 6);
    }
  }

  // 5. IDENTIFICAR ARTIGOS E LEIS
  else if (type === 'artigos') {
    let artigosList: any[] = [];
    if (Array.isArray(data)) {
      artigosList = data;
    } else if (data && typeof data === 'object') {
      artigosList = data.artigos || data.leis || data.legislacao || [data];
    }

    if (artigosList.length > 0) {
      artigosList.forEach((art: any, idx: number) => {
        const legislacao = art?.legislacao || art?.lei || 'Legislação';
        const artigo = art?.artigo || art?.numero || '';
        const descricao = art?.descricao || art?.explicacao || art?.conteudo || '';

        printWrappedText(`${idx + 1}. Legislação: ${legislacao} ${artigo ? `(${artigo})` : ''}`, 10.5, true, [146, 64, 14], 0, 3);
        if (descricao) {
          printWrappedText(descricao, 9.5, false, [40, 40, 40], 12, 4);
        }
        y += 4;
      });
    } else {
      printWrappedText(resultText, 10, false, [50, 50, 50], 0, 6);
    }
  }

  // 6. PONTOS PARA MEMORIZAR
  else if (type === 'memorizar') {
    let memorizarList: any[] = [];
    if (Array.isArray(data)) {
      memorizarList = data;
    } else if (data && typeof data === 'object') {
      memorizarList = data.memorizar || data.pontos || data.checklist || [data];
    }

    if (memorizarList.length > 0) {
      memorizarList.forEach((item: any, idx: number) => {
        const ponto = item?.ponto || item?.titulo || item?.item || `Ponto ${idx + 1}`;
        const explicacao = item?.explicacao || item?.detalhe || item?.descricao || '';

        printWrappedText(`[ PONTO ${idx + 1} ]  ${ponto}`, 10.5, true, [180, 83, 9], 0, 3);
        if (explicacao) {
          printWrappedText(explicacao, 9.5, false, [50, 50, 50], 12, 4);
        }
        y += 4;
      });
    } else {
      printWrappedText(resultText, 10, false, [50, 50, 50], 0, 6);
    }
  } else {
    printWrappedText(resultText, 10, false, [50, 50, 50], 0, 6);
  }

  // Footer on final page
  checkNewPage(24);
  y += 10;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150, 150, 150);
  doc.text('Gerado pelo Assistente de IA do Caderno Virtual', marginLeft, y);

  // Download PDF
  const filename = `Caderno-Virtual-Resultado-IA.pdf`;
  doc.save(filename);
};
