import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Presentation,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  BookOpen,
  Search,
  FilePlus,
  FileText,
  Video,
  ExternalLink,
  Eye,
  Download,
  Upload,
  RefreshCw,
  X,
  User,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Link2,
  ArrowUpDown,
  Filter,
  ArrowLeft,
  LayoutGrid,
  GitBranch,
  Star,
  Copy,
  Info,
  Sparkles,
  Maximize2,
  Tag,
  Check,
  Layers,
  ListChecks,
  MessageSquare,
  Send,
  Brain,
  RotateCcw,
  Award,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Aula, AulaMaterialPdf, Anotacao, TipoAnotacao, StatusAula } from '../../types';
import {
  STATUS_AULA_LIST,
  CHECKLIST_ITEMS_CONFIG,
  getChecklistProgress,
  getStatusConfig,
  saveRevisionLog,
} from '../../utils/estudoTracking';
import { Modal } from '../common/Modal';
import { AulaFormModal } from './AulaFormModal';
import { AnotacaoFormModal } from '../anotacoes/AnotacaoFormModal';
import { AnotacaoVisualizadorModal } from '../anotacoes/AnotacaoVisualizadorModal';
import { PdfCanvasViewer } from './PdfCanvasViewer';
import { extractTextFromPdfBuffer } from '../../utils/pdfTextExtractor';
import { AiResultView } from './AiResultView';
import { generateAIResultPdf } from '../../utils/aiPdfGenerator';
import {
  getDiaSemanaFromData,
  formatBytes,
  validateAndNormalizeUrl,
  savePdfToStorage,
  getPdfFromStorage,
  deletePdfFromStorage,
} from '../../utils/pdfStorage';

interface RevisionQuestion {
  pergunta: string;
  alternativas: string[];
  corretaIndex: number;
  explicacao: string;
}

interface AulasViewProps {
  onCriarAnotacaoDaAula?: (aula: Aula) => void;
}

export const AulasView: React.FC<AulasViewProps> = () => {
  const {
    aulas,
    materias,
    addAula,
    updateAula,
    deleteAula,
    updateAulaStatus,
    toggleAulaChecklistItem,
    anotacoes,
    addAnotacao,
    updateAnotacao,
    deleteAnotacao,
    toggleFavoritoAnotacao,
    duplicarAnotacao,
    pendingNoteDraft,
    setPendingNoteDraft,
    selectedAulaIdToView,
    setSelectedAulaIdToView,
    selectedAulaTabToView,
    setSelectedAulaTabToView,
    selectedAnotacaoIdToFocus,
    setSelectedAnotacaoIdToFocus,
    selectedMateriaId,
    setActiveSection,
  } = useApp();

  // Filtros e busca da listagem geral de aulas
  const [busca, setBusca] = useState('');
  const [materiaFiltro, setMateriaFiltro] = useState<string>('todas');
  const [statusFiltro, setStatusFiltro] = useState<string>('todos');
  const [ordemData, setOrdemData] = useState<'recente' | 'antiga'>('recente');

  // Estado da Aula aberta no Espaço de Estudo
  const [viewingAula, setViewingAula] = useState<Aula | null>(null);
  const [activeTab, setActiveTab] = useState<
    'sequencia' | 'informacoes' | 'materiais' | 'checklist' | 'anotacoes' | 'quadros' | 'mapas' | 'assistente_ia' | 'revisao'
  >('sequencia');

  // Modais de Criação/Edição de Aula
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAulaId, setEditingAulaId] = useState<string | null>(null);

  // Modais de Anotações dentro da Aula
  const [isNoteFormOpen, setIsNoteFormOpen] = useState(false);
  const [editingAnotacao, setEditingAnotacao] = useState<Anotacao | null>(null);
  const [noteInitialTipo, setNoteInitialTipo] = useState<TipoAnotacao>('livre');
  const [viewingAnotacaoModal, setViewingAnotacaoModal] = useState<Anotacao | null>(null);
  const [filtroTipoNota, setFiltroTipoNota] = useState<string>('todos');

  // Visualizador de PDF Canvas Inline na Página de Estudo da Aula
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfBinaryData, setPdfBinaryData] = useState<{
    data: ArrayBuffer | Uint8Array;
    nome: string;
    tamanhoFormatado?: string;
  } | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  // Assistente de IA
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ type: string, result: string, parsed?: any } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [extractedPdfText, setExtractedPdfText] = useState<string>('');
  const [aiChatMessages, setAiChatMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiChatLoading, setAiChatLoading] = useState(false);
  const [aiChatError, setAiChatError] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Estado da Revisão da Aula com IA
  const [revisionState, setRevisionState] = useState<'idle' | 'loading' | 'active' | 'completed' | 'error'>('idle');
  const [revisionQuestions, setRevisionQuestions] = useState<RevisionQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [revisionError, setRevisionError] = useState<string | null>(null);

  // Reseta estado da revisão quando mudar de aula
  useEffect(() => {
    setRevisionState('idle');
    setRevisionQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setUserAnswers([]);
    setRevisionError(null);
  }, [viewingAula?.id]);

  const revisionScore = useMemo(() => {
    if (revisionQuestions.length === 0) return 0;
    return userAnswers.reduce((acc, ans, idx) => {
      if (ans === revisionQuestions[idx]?.corretaIndex) {
        return acc + 1;
      }
      return acc;
    }, 0);
  }, [userAnswers, revisionQuestions]);

  const revisionPercentage = useMemo(() => {
    if (revisionQuestions.length === 0) return 0;
    return Math.round((revisionScore / revisionQuestions.length) * 100);
  }, [revisionScore, revisionQuestions.length]);

  const getRevisionClassification = (percentage: number) => {
    if (percentage >= 100) {
      return { text: 'Excelente', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' };
    } else if (percentage >= 80) {
      return { text: 'Muito bom', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' };
    } else if (percentage >= 60) {
      return { text: 'Bom', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' };
    } else if (percentage >= 40) {
      return { text: 'Em desenvolvimento', color: 'text-amber-800', bg: 'bg-amber-50 border-amber-200' };
    } else {
      return { text: 'Precisa revisar', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' };
    }
  };

  const handleStartRevision = async () => {
    if (!viewingAula) return;

    setRevisionState('loading');
    setRevisionError(null);
    setSelectedOption(null);
    setIsAnswered(false);
    setUserAnswers([]);
    setCurrentQuestionIndex(0);

    try {
      let pdfText = extractedPdfText;
      if (!pdfText && viewingAula.materialPdf) {
        try {
          let arrayBuffer: ArrayBuffer | null = null;
          if (pdfBinaryData) {
            arrayBuffer = pdfBinaryData.data;
          } else if (viewingAula.materialPdf.storageId) {
            const record = await getPdfFromStorage(viewingAula.materialPdf.storageId);
            if (record) {
              if (record.blob) {
                arrayBuffer = await record.blob.arrayBuffer();
              } else if (record.dataUrl) {
                const base64 = record.dataUrl.split(',')[1] || record.dataUrl;
                const binaryString = atob(base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                arrayBuffer = bytes.buffer;
              }
            }
          }
          if (arrayBuffer) {
            pdfText = await extractTextFromPdfBuffer(arrayBuffer);
            setExtractedPdfText(pdfText);
          }
        } catch (e) {
          console.warn('Erro ao extrair PDF para revisão:', e);
        }
      }

      let prompt = `Você é um professor universitário e especialista em Direito.\n`;
      prompt += `Gere um teste de revisão com EXATAMENTE 5 PERGUNTAS DE MÚLTIPLA ESCOLHA (4 alternativas cada, com apenas 1 alternativa correta), baseado estritamente no conteúdo desta aula:\n\n`;
      prompt += `Título da Aula: ${viewingAula.titulo}\n`;
      prompt += `Matéria / Disciplina: ${viewingAula.disciplina}\n\n`;
      prompt += `Conteúdo da Aula:\n${viewingAula.conteudo}\n\n`;
      if (viewingAula.observacoes) {
        prompt += `Observações:\n${viewingAula.observacoes}\n\n`;
      }

      prompt += `INSTRUÇÃO DE SAÍDA OBRIGATÓRIA:\n`;
      prompt += `Retorne APENAS um array JSON de 5 objetos com as propriedades: "pergunta", "alternativas" (array de 4 opções), "corretaIndex" (número de 0 a 3 indicando qual o índice da correta), e "explicacao" (uma explicação sucinta da resposta correta baseada no conteúdo da aula).`;

      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, pdfText, type: 'revisao' }),
      });

      if (!response.ok) {
        throw new Error('Erro na requisição para a IA');
      }

      const data = await response.json();
      const cleanText = data.text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();

      let parsed = JSON.parse(cleanText);

      if (!Array.isArray(parsed) && typeof parsed === 'object' && parsed !== null) {
        const keys = Object.keys(parsed);
        for (const k of keys) {
          if (Array.isArray(parsed[k])) {
            parsed = parsed[k];
            break;
          }
        }
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Formato retornado inválido');
      }

      const questions: RevisionQuestion[] = parsed.slice(0, 5).map((q: any, idx: number) => {
        let options: string[] = [];
        if (Array.isArray(q.alternativas) && q.alternativas.length === 4) {
          options = q.alternativas;
        } else if (Array.isArray(q.opcoes) && q.opcoes.length === 4) {
          options = q.opcoes;
        } else {
          options = [
            q.alternativas?.[0] || 'Opção A',
            q.alternativas?.[1] || 'Opção B',
            q.alternativas?.[2] || 'Opção C',
            q.alternativas?.[3] || 'Opção D',
          ];
        }

        let cIndex = 0;
        if (typeof q.corretaIndex === 'number' && q.corretaIndex >= 0 && q.corretaIndex <= 3) {
          cIndex = q.corretaIndex;
        } else if (typeof q.respostaCorreta === 'number' && q.respostaCorreta >= 0 && q.respostaCorreta <= 3) {
          cIndex = q.respostaCorreta;
        }

        return {
          pergunta: q.pergunta || `Pergunta ${idx + 1}`,
          alternativas: options,
          corretaIndex: cIndex,
          explicacao: q.explicacao || 'Explicação com base no conteúdo estudado nesta aula.',
        };
      });

      setRevisionQuestions(questions);
      setRevisionState('active');
    } catch (err) {
      console.error('Erro ao gerar revisão:', err);
      setRevisionError('Não foi possível gerar a revisão desta aula. Tente novamente.');
      setRevisionState('error');
    }
  };

  const handleAnswerQuestion = () => {
    if (selectedOption === null) return;
    setIsAnswered(true);
    setUserAnswers((prev) => [...prev, selectedOption]);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < revisionQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setRevisionState('completed');
      if (currentAula) {
        if (!currentAula.checklist?.revisarAula) {
          toggleAulaChecklistItem(currentAula.id, 'revisarAula');
        }
        saveRevisionLog({
          aulaId: currentAula.id,
          aulaTitulo: currentAula.titulo,
          disciplina: currentAula.disciplina,
          score: revisionScore,
          totalQuestions: revisionQuestions.length,
          percentage: revisionPercentage,
        });
      }
    }
  };

  const handleSavePdf = async () => {
    if (!aiResult) return;
    setIsGeneratingPdf(true);
    try {
      await generateAIResultPdf({
        type: aiResult.type,
        resultText: aiResult.result,
        parsedData: aiResult.parsed,
        aulaTitulo: viewingAula?.titulo,
        disciplina: viewingAula?.disciplina,
      });
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Ocorreu um erro ao gerar o arquivo PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSendAiChat = async () => {
    if (!aiChatInput.trim() || !aiResult || !viewingAula || aiChatLoading) return;

    const userInput = aiChatInput.trim();
    setAiChatInput('');
    setAiChatLoading(true);
    setAiChatError(null);

    const updatedMessages = [...aiChatMessages, { sender: 'user' as const, text: userInput }];
    setAiChatMessages(updatedMessages);

    try {
      let prompt = `Aula: ${viewingAula.titulo}\nMatéria: ${viewingAula.disciplina}\n\n`;
      prompt += `Conteúdo da Aula:\n${viewingAula.conteudo}\n\n`;
      if (viewingAula.observacoes) {
        prompt += `Observações:\n${viewingAula.observacoes}\n\n`;
      }
      prompt += `TIPO DE MATERIAL ATUAL: ${aiResult.type}\n\n`;
      prompt += `RESULTADO ATUAL EXIBIDO AO ALUNO:\n${aiResult.result}\n\n`;

      if (updatedMessages.length > 1) {
        prompt += `HISTÓRICO DA CONVERSA:\n`;
        updatedMessages.forEach((msg) => {
          prompt += `${msg.sender === 'user' ? 'Aluno' : 'IA'}: ${msg.text}\n`;
        });
        prompt += `\n`;
      }

      prompt += `SOLICITAÇÃO DE ALTERAÇÃO DO ALUNO PARA REVISAR O RESULTADO:\n"${userInput}"\n\n`;
      prompt += `INSTRUÇÃO OBRIGATÓRIA:\nRevise e atualize o RESULTADO ATUAL com base estrita no pedido do aluno. Mantenha o formato exato (se o tipo for 'quadros', 'mapa_mental', 'conceitos', 'artigos' ou 'memorizar', retorne APENAS o JSON atualizado e válido no mesmo formato estruturado original).`;

      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, pdfText: extractedPdfText, type: aiResult.type }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro na comunicação com a API');
      }

      const data = await response.json();
      let parsed = null;
      if (aiResult.type !== 'resumir') {
        try {
          const cleanText = data.text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
          parsed = JSON.parse(cleanText);
        } catch (e) {
          console.warn('Could not parse follow-up AI response as JSON', data.text);
        }
      }

      setAiResult({ type: aiResult.type, result: data.text, parsed });
      setAiChatMessages((prev) => [
        ...prev,
        { sender: 'ai' as const, text: `Resultado atualizado (${userInput})` },
      ]);
    } catch (err: any) {
      console.error('Erro na conversa com a IA:', err);
      setAiChatError('Não foi possível processar o pedido. Tente novamente.');
    } finally {
      setAiChatLoading(false);
    }
  };


  // Modal para Adicionar / Editar Link em aula existente
  const [linkModalAula, setLinkModalAula] = useState<Aula | null>(null);
  const [linkInputVal, setLinkInputVal] = useState('');
  const [linkInputError, setLinkInputError] = useState<string | null>(null);

  // Input file invisível para substituir/anexar PDF diretamente em aula existente
  const singleFileInputRef = useRef<HTMLInputElement | null>(null);
  const [pdfTargetAula, setPdfTargetAula] = useState<Aula | null>(null);
  const [pdfOperationLoading, setPdfOperationLoading] = useState(false);

  const handleCloseInlinePdf = () => {
    setShowPdfViewer(false);
    setPdfBinaryData(null);
  };

  const handleDownloadPdf = () => {
    if (!pdfBinaryData) return;
    try {
      const blob = new Blob([pdfBinaryData.data], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = pdfBinaryData.nome || 'documento.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    } catch (err) {
      console.error('Erro ao baixar PDF:', err);
    }
  };

  // Sincroniza visualização de aula quando requisitado externamente
  useEffect(() => {
    if (selectedAulaIdToView) {
      const targetAula = aulas.find((a) => a.id === selectedAulaIdToView);
      if (targetAula) {
        setViewingAula(targetAula);
        if (selectedAulaTabToView) {
          setActiveTab(selectedAulaTabToView);
        }
        if (selectedAnotacaoIdToFocus) {
          const targetNote = anotacoes.find((n) => n.id === selectedAnotacaoIdToFocus);
          if (targetNote) {
            setViewingAnotacaoModal(targetNote);
          }
          setSelectedAnotacaoIdToFocus(null);
        }
      }
      setSelectedAulaIdToView(null);
    }
  }, [selectedAulaIdToView, selectedAulaTabToView, selectedAnotacaoIdToFocus, aulas, anotacoes, setSelectedAulaIdToView, setSelectedAnotacaoIdToFocus]);

  // Se houver rascunho pendente de criação de anotação para a aula aberta
  useEffect(() => {
    if (pendingNoteDraft?.aula) {
      const target = aulas.find((a) => a.id === pendingNoteDraft.aula?.id);
      if (target) {
        setViewingAula(target);
        setActiveTab('anotacoes');
        setEditingAnotacao(null);
        setNoteInitialTipo(pendingNoteDraft.initialTipo || 'livre');
        setIsNoteFormOpen(true);
      }
      setPendingNoteDraft(null);
    }
  }, [pendingNoteDraft, aulas, setPendingNoteDraft]);

  // Mantém viewingAula sincronizada com atualizações no array global de aulas
  useEffect(() => {
    if (viewingAula) {
      const atual = aulas.find((a) => a.id === viewingAula.id);
      if (atual) {
        setViewingAula(atual);
      }
    }
  }, [aulas]);

  // Instância atual da aula sendo visualizada com status e checklist reativos
  const currentAula = useMemo(() => {
    if (!viewingAula) return null;
    return aulas.find((a) => a.id === viewingAula.id) || viewingAula;
  }, [aulas, viewingAula]);

  const currentChecklistProgress = useMemo(() => {
    return getChecklistProgress(currentAula?.checklist);
  }, [currentAula?.checklist]);

  const currentStatusCfg = useMemo(() => {
    return getStatusConfig(currentAula?.status);
  }, [currentAula?.status]);

  // Anotações vinculadas exclusivamente à aula atualmente visualizada
  const notasDestaAula = useMemo(() => {
    if (!currentAula) return [];
    return anotacoes.filter(
      (nota) =>
        nota.aulaRelacionadaId === currentAula.id ||
        (nota.disciplinaId === currentAula.materiaId && nota.data === currentAula.data)
    );
  }, [anotacoes, currentAula]);

  // Sub-listas por formato para a sequência visual de estudo
  const anotacoesLivres = useMemo(() => {
    return notasDestaAula.filter((n) => !n.tipo || n.tipo === 'livre');
  }, [notasDestaAula]);

  const resumosQuadros = useMemo(() => {
    return notasDestaAula.filter((n) => n.tipo === 'quadros');
  }, [notasDestaAula]);

  const mapasMentais = useMemo(() => {
    return notasDestaAula.filter((n) => n.tipo === 'mapa_mental');
  }, [notasDestaAula]);

  // Anotações filtradas por tipo na aba de anotações da aula
  const notasDestaAulaFiltradas = useMemo(() => {
    if (filtroTipoNota === 'todos') return notasDestaAula;
    return notasDestaAula.filter((n) => n.tipo === filtroTipoNota || (!n.tipo && filtroTipoNota === 'livre'));
  }, [notasDestaAula, filtroTipoNota]);

  // Contador de anotações para qualquer aula
  const getQtdAnotacoesDaAula = (aulaId: string, materiaId: string, data: string) => {
    return anotacoes.filter(
      (n) => n.aulaRelacionadaId === aulaId || (n.disciplinaId === materiaId && n.data === data)
    ).length;
  };

  // Abertura do modal para nova aula
  const handleOpenCreateAula = () => {
    setEditingAulaId(null);
    setIsFormModalOpen(true);
  };

  // Abertura do modal para editar aula existente
  const handleOpenEditAula = (aula: Aula) => {
    setEditingAulaId(aula.id);
    setIsFormModalOpen(true);
  };

  // Exclusão com confirmação prévia
  const handleDeleteAula = async (aula: Aula) => {
    const confirmMsg = `Tem certeza que deseja excluir o registro da aula "${aula.titulo}"?\n\nTodos os materiais vinculados a ela serão removidos.`;
    if (window.confirm(confirmMsg)) {
      if (viewingAula?.id === aula.id) {
        setViewingAula(null);
      }
      deleteAula(aula.id);
    }
  };

  // Operações de PDF
const handleRunAi = async (type: string) => {
    if (!viewingAula) return;
    
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    setAiChatMessages([]);
    setAiChatInput('');
    setAiChatError(null);

    try {
      let pdfText = '';
      
      // Load PDF if available
      const materialPdf = viewingAula.materialPdf;
      if (materialPdf) {
        try {
          let arrayBuffer: ArrayBuffer | null = null;
          
          if (pdfBinaryData) {
            arrayBuffer = pdfBinaryData.data;
          } else if (materialPdf.storageId) {
            const record = await getPdfFromStorage(materialPdf.storageId);
            if (record) {
              if (record.blob) {
                arrayBuffer = await record.blob.arrayBuffer();
              } else if (record.dataUrl) {
                const base64 = record.dataUrl.split(',')[1] || record.dataUrl;
                const binaryString = atob(base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                arrayBuffer = bytes.buffer;
              }
            }
          } else if (materialPdf.url) {
            if (materialPdf.url.startsWith('data:')) {
              const base64 = materialPdf.url.split(',')[1] || materialPdf.url;
              const binaryString = atob(base64);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              arrayBuffer = bytes.buffer;
            } else {
              const resp = await fetch(materialPdf.url);
              arrayBuffer = await resp.arrayBuffer();
            }
          }
          
          if (arrayBuffer) {
            pdfText = await extractTextFromPdfBuffer(arrayBuffer);
          }
        } catch (pdfErr) {
          console.warn('Could not extract PDF for AI:', pdfErr);
        }
      }

      setExtractedPdfText(pdfText);

      let prompt = `Aula: ${viewingAula.titulo}\nMateria: ${viewingAula.disciplina}\n\nConteúdo da Aula:\n${viewingAula.conteudo}`;
      if (viewingAula.observacoes) {
        prompt += `\n\nObservações:\n${viewingAula.observacoes}`;
      }

      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, pdfText, type })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro na comunicação com a API');
      }

      const data = await response.json();
      let parsed = null;
      if (type !== 'resumir') {
        try {
          parsed = JSON.parse(data.text);
        } catch(e) {
          console.warn("Could not parse AI response as JSON", data.text);
        }
      }
      
      setAiResult({ type, result: data.text, parsed });

    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Erro inesperado ao rodar IA.');
    } finally {
      setAiLoading(false);
    }
  };
  const handleOpenPdf = async (materialPdf: AulaMaterialPdf) => {
    if (materialPdf.storageId) {
      setLoadingPdf(true);
      setShowPdfViewer(true);
      try {
        const record = await getPdfFromStorage(materialPdf.storageId);
        if (record) {
          let arrayBuffer: ArrayBuffer;
          if (record.blob) {
            arrayBuffer = await record.blob.arrayBuffer();
          } else if (record.dataUrl) {
            const base64 = record.dataUrl.split(',')[1] || record.dataUrl;
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            arrayBuffer = bytes.buffer;
          } else {
            throw new Error('Blob ou dados binários não encontrados no registro do IndexedDB');
          }

          setPdfBinaryData({
            data: arrayBuffer,
            nome: materialPdf.nome,
            tamanhoFormatado: materialPdf.tamanhoFormatado || formatBytes(materialPdf.tamanho),
          });
        } else {
          alert('Arquivo PDF não encontrado no armazenamento local deste dispositivo.');
          setShowPdfViewer(false);
        }
      } catch (err) {
        console.error('Erro ao abrir PDF:', err);
        alert('Não foi possível carregar o arquivo PDF do armazenamento local.');
        setShowPdfViewer(false);
      } finally {
        setLoadingPdf(false);
      }
    } else if (materialPdf.url) {
      setLoadingPdf(true);
      setShowPdfViewer(true);
      try {
        if (materialPdf.url.startsWith('data:')) {
          const base64 = materialPdf.url.split(',')[1] || materialPdf.url;
          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          setPdfBinaryData({
            data: bytes.buffer,
            nome: materialPdf.nome,
            tamanhoFormatado: materialPdf.tamanhoFormatado || formatBytes(materialPdf.tamanho),
          });
        } else {
          const resp = await fetch(materialPdf.url);
          const arrayBuffer = await resp.arrayBuffer();
          setPdfBinaryData({
            data: arrayBuffer,
            nome: materialPdf.nome,
            tamanhoFormatado: materialPdf.tamanhoFormatado || formatBytes(materialPdf.tamanho),
          });
        }
      } catch (err) {
        console.error('Erro ao carregar PDF:', err);
        alert('Não foi possível carregar o arquivo PDF.');
        setShowPdfViewer(false);
      } finally {
        setLoadingPdf(false);
      }
    }
  };

  const triggerPdfAttachment = (aula: Aula) => {
    setPdfTargetAula(aula);
    if (singleFileInputRef.current) {
      singleFileInputRef.current.value = '';
      singleFileInputRef.current.click();
    }
  };

  const handleSingleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pdfTargetAula) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Por favor, selecione exclusivamente um arquivo no formato PDF.');
      return;
    }

    setPdfOperationLoading(true);
    try {
      if (pdfTargetAula.materialPdf?.storageId) {
        await deletePdfFromStorage(pdfTargetAula.materialPdf.storageId);
      }
      const storageId = `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const savedPdfMeta = await savePdfToStorage(storageId, file);

      updateAula(pdfTargetAula.id, {
        materialPdf: savedPdfMeta,
      });
    } catch (err: any) {
      console.error('Erro ao salvar PDF:', err);
      alert(err.message || 'Erro ao processar o arquivo PDF.');
    } finally {
      setPdfOperationLoading(false);
      setPdfTargetAula(null);
    }
  };

  const handleRemovePdfFromAula = async (aula: Aula) => {
    if (!aula.materialPdf) return;
    const confirmMsg = `Deseja remover o arquivo PDF "${aula.materialPdf.nome}" desta aula?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      if (aula.materialPdf.storageId) {
        await deletePdfFromStorage(aula.materialPdf.storageId);
      }
      updateAula(aula.id, {
        materialPdf: undefined,
      });
    } catch (err) {
      console.error('Erro ao remover PDF:', err);
      updateAula(aula.id, {
        materialPdf: undefined,
      });
    }
  };

  // Operações de Link de Vídeo
  const handleOpenLinkModal = (aula: Aula) => {
    setLinkModalAula(aula);
    setLinkInputVal(aula.linkAula || '');
    setLinkInputError(null);
  };

  const handleSaveLinkFromModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkModalAula) return;

    if (!linkInputVal.trim()) {
      updateAula(linkModalAula.id, { linkAula: undefined });
      setLinkModalAula(null);
      return;
    }

    const validation = validateAndNormalizeUrl(linkInputVal);
    if (!validation.isValid) {
      setLinkInputError(validation.error || 'URL inválida.');
      return;
    }

    updateAula(linkModalAula.id, { linkAula: validation.normalizedUrl });
    setLinkModalAula(null);
  };

  const handleRemoveLinkFromAula = (aula: Aula) => {
    if (!window.confirm(`Deseja remover o link de vídeo da aula "${aula.titulo}"?`)) return;
    updateAula(aula.id, { linkAula: undefined });
  };

  // Criação de anotação a partir de botão rápido na aula
  const handleAbrirCriacaoAnotacao = (aula: Aula, tipoDesejado: TipoAnotacao = 'livre') => {
    setViewingAula(aula);
    setActiveTab('anotacoes');
    setEditingAnotacao(null);
    setNoteInitialTipo(tipoDesejado);
    setIsNoteFormOpen(true);
  };

  // Salva anotação criada/editada diretamente para esta aula
  const handleSaveAnotacao = (data: Omit<Anotacao, 'id'>) => {
    if (editingAnotacao) {
      updateAnotacao(editingAnotacao.id, {
        ...data,
        aulaRelacionadaId: viewingAula?.id || data.aulaRelacionadaId,
        aulaRelacionadaTitulo: viewingAula?.titulo || data.aulaRelacionadaTitulo,
      });
    } else {
      addAnotacao({
        ...data,
        aulaRelacionadaId: viewingAula?.id || data.aulaRelacionadaId,
        aulaRelacionadaTitulo: viewingAula?.titulo || data.aulaRelacionadaTitulo,
      });
    }
    setIsNoteFormOpen(false);
    setEditingAnotacao(null);
  };

  // Filtragem e ordenação da listagem geral
  const aulasFiltradas = aulas
    .filter((a) => {
      const q = busca.toLowerCase().trim();
      const matchBusca =
        !q ||
        a.titulo.toLowerCase().includes(q) ||
        a.conteudo.toLowerCase().includes(q) ||
        a.disciplina.toLowerCase().includes(q) ||
        (a.professor && a.professor.toLowerCase().includes(q)) ||
        (a.observacoes && a.observacoes.toLowerCase().includes(q));

      const matchMateria = materiaFiltro === 'todas' || a.materiaId === materiaFiltro;
      const matchStatus = statusFiltro === 'todos' || (a.status || 'nao_iniciada') === statusFiltro;
      return matchBusca && matchMateria && matchStatus;
    })
    .sort((a, b) => {
      const timeA = new Date(a.data).getTime();
      const timeB = new Date(b.data).getTime();
      return ordemData === 'recente' ? timeB - timeA : timeA - timeB;
    });

  const getMateriaCor = (materiaId: string) => {
    const mat = materias.find((m) => m.id === materiaId);
    return mat?.cor || '#d97706';
  };

  // =========================================================================
  // MODO 1: PÁGINA COMPLETA DE ESTUDO DA AULA (SE viewingAula !== null)
  // =========================================================================
  if (viewingAula) {
    const materiaAtual = materias.find((m) => m.id === viewingAula.materiaId);
    const qtdMateriais = (viewingAula.materialPdf ? 1 : 0) + (viewingAula.linkAula ? 1 : 0);

    return (
      <div id="aula-estudo-root" className="space-y-6 animate-in fade-in duration-300">
        {/* Input oculto para upload de PDF */}
        <input
          type="file"
          ref={singleFileInputRef}
          onChange={handleSingleFileSelected}
          accept="application/pdf"
          className="hidden"
        />

        {/* 1. BARRA DE NAVEGAÇÃO SUPERIOR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              id="btn-voltar-aulas"
              type="button"
              onClick={() => {
                setViewingAula(null);
                if (selectedMateriaId) {
                  setActiveSection('materias');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition shadow-2xs"
              title="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{selectedMateriaId ? 'Voltar para Matéria' : 'Voltar para Aulas'}</span>
            </button>

            <div className="h-4 w-px bg-stone-200 hidden sm:block" />

            <div className="text-xs text-stone-500 truncate max-w-[280px] sm:max-w-md">
              <span className="font-semibold text-stone-700">{viewingAula.disciplina}</span>
              <span className="mx-1 text-stone-300">/</span>
              <span className="text-stone-900 font-medium truncate">{viewingAula.titulo}</span>
            </div>
          </div>

          {/* Botões de Ação da Aula */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => handleOpenEditAula(viewingAula)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl text-xs font-semibold transition shadow-2xs"
            >
              <Edit2 className="w-3.5 h-3.5 text-stone-500" />
              <span>Editar Aula</span>
            </button>

            <button
              type="button"
              onClick={() => handleDeleteAula(viewingAula)}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Excluir</span>
            </button>
          </div>
        </div>

        {/* 2. CABEÇALHO DA PÁGINA DA AULA */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: getMateriaCor(viewingAula.materiaId) }}
              />
              <span className="text-xs font-bold text-stone-700 bg-stone-100 px-2.5 py-1 rounded-lg">
                {viewingAula.disciplina}
              </span>
              {viewingAula.professor && (
                <span className="text-xs text-stone-500 flex items-center gap-1 ml-1">
                  <User className="w-3.5 h-3.5 text-stone-400" />
                  <span>Prof. {viewingAula.professor}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-stone-600 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-xl font-medium">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span className="font-semibold text-stone-800">
                  {viewingAula.data.split('-').reverse().join('/')}
                </span>
              </div>
              {viewingAula.diaSemana && (
                <>
                  <span className="text-stone-300">•</span>
                  <span>{viewingAula.diaSemana}</span>
                </>
              )}
              {viewingAula.horario && (
                <>
                  <span className="text-stone-300">•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>{viewingAula.horario}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 leading-tight">
              {currentAula.titulo}
            </h1>
          </div>

          {/* Status de Estudo da Aula & Resumo do Checklist */}
          <div className="pt-4 border-t border-stone-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-2xs font-bold text-stone-500 uppercase tracking-wider">
                Status da Aula:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {STATUS_AULA_LIST.map((st) => {
                  const isCurrent = (currentAula.status || 'nao_iniciada') === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => updateAulaStatus(currentAula.id, st.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                        isCurrent
                          ? `${st.badgeBg} ${st.badgeText} ${st.badgeBorder} shadow-2xs ring-1 ring-amber-500/20 font-bold`
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100 hover:text-stone-800'
                      }`}
                      title={`Definir status como "${st.label}"`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isCurrent ? st.dotColor : 'bg-stone-300'}`} />
                      <span>{st.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Resumo Rápido do Checklist */}
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-xl text-xs self-start lg:self-auto">
              <span className="font-semibold text-stone-700">
                Progresso da aula: {currentChecklistProgress.percentage}%
              </span>
              <div className="w-24 bg-stone-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    currentChecklistProgress.isConcluida ? 'bg-emerald-600' : 'bg-amber-600'
                  }`}
                  style={{ width: `${currentChecklistProgress.percentage}%` }}
                />
              </div>
              {currentChecklistProgress.isConcluida ? (
                <span className="text-2xs font-bold text-emerald-700 ml-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ✓ Aula concluída
                </span>
              ) : (
                <span className="text-2xs font-medium text-amber-800 ml-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Em andamento
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3. BARRA DE ATALHOS RÁPIDOS E ÍNDICE VISUAL DA AULA (Sem Rolagem Horizontal) */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between text-2xs font-bold uppercase tracking-wider text-stone-600">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>Navegação por Seções da Aula</span>
            </span>
            <span className="text-stone-400 font-normal">
              Rolagem Vertical Ativa
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('sequencia');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'sequencia'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Ver Tudo (Visão Completa)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('sequencia');
                document.getElementById('secao-aula-materiais')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-rose-50 hover:text-rose-800 transition border border-stone-200/60"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>📄 Material / PDF ({qtdMateriais})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('sequencia');
                document.getElementById('secao-aula-anotacoes')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-amber-50 hover:text-amber-900 transition border border-stone-200/60"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>📝 Anotações ({notasDestaAula.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('sequencia');
                document.getElementById('secao-aula-ia')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300/80 hover:bg-amber-100 transition shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>🤖 Assistente de IA</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('sequencia');
                document.getElementById('secao-aula-revisao')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-semibold bg-purple-50 text-purple-900 border border-purple-300/80 hover:bg-purple-100 transition shadow-2xs"
            >
              <Brain className="w-3.5 h-3.5 text-purple-700" />
              <span>🧠 Revisar com IA</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('sequencia');
                document.getElementById('secao-aula-checklist')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-emerald-50 hover:text-emerald-900 transition border border-stone-200/60"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>📋 Progresso ({currentChecklistProgress.percentage}%)</span>
            </button>
          </div>
        </div>

        {/* AS SEÇÕES DE ESTUDO NA SEQUÊNCIA VISUAL EXATA */}

        {/* SEÇÃO 1: INFORMAÇÕES DA AULA */}
        {(activeTab === 'sequencia' || activeTab === 'informacoes') && (
          <div id="secao-aula-informacoes" className="space-y-6 animate-in fade-in duration-200">
            {/* Conteúdo Estudado */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-700" />
                  <span>Conteúdo Estudado em Sala</span>
                </h3>
                <span className="text-2xs text-stone-400">
                  {currentAula.disciplina}
                </span>
              </div>
              <div className="text-sm text-stone-800 leading-relaxed whitespace-pre-wrap font-sans bg-stone-50/60 p-5 rounded-xl border border-stone-200/80">
                {currentAula.conteudo}
              </div>
            </div>

            {/* Observações e Leituras Complementares */}
            {currentAula.observacoes && (
              <div className="bg-white p-6 rounded-2xl border border-amber-200/90 bg-amber-50/40 shadow-xs space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-700" />
                  <span>Observações &amp; Recomendações de Leitura</span>
                </h3>
                <div className="text-xs text-amber-950 leading-relaxed whitespace-pre-wrap bg-white/80 p-4 rounded-xl border border-amber-200">
                  {currentAula.observacoes}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SEÇÃO 2: MATERIAIS (PDF & VÍDEO / AULA ONLINE) */}
        {(activeTab === 'sequencia' || activeTab === 'materiais') && (
          <div id="secao-aula-materiais" className="space-y-6 animate-in fade-in duration-200">
            {/* Seção PDF */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">Material da Aula (PDF)</h3>
                    <p className="text-2xs text-stone-500">
                      Documentos, slides, ementas e textos disponibilizados pelo professor
                    </p>
                  </div>
                </div>
                {currentAula.materialPdf && (
                  <span className="text-2xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    Arquivo anexado
                  </span>
                )}
              </div>

              {currentAula.materialPdf ? (
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-lg border border-stone-200">
                    <div className="flex items-center gap-2.5 truncate">
                      <Paperclip className="w-4 h-4 text-stone-400 shrink-0" />
                      <span className="text-xs font-semibold text-stone-800 truncate" title={currentAula.materialPdf.nome}>
                        {currentAula.materialPdf.nome}
                      </span>
                    </div>
                    <span className="text-2xs font-mono text-stone-500 shrink-0">
                      {currentAula.materialPdf.tamanhoFormatado || formatBytes(currentAula.materialPdf.tamanho)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenPdf(currentAula.materialPdf!)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Abrir e Visualizar PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => triggerPdfAttachment(currentAula)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl text-xs font-semibold transition shadow-2xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
                      <span>Substituir PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemovePdfFromAula(currentAula)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-rose-50 text-stone-600 hover:text-rose-600 border border-stone-200 rounded-xl text-xs font-semibold transition shadow-2xs"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Remover</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-stone-50/70 border-2 border-dashed border-stone-200 rounded-xl space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-700">Nenhum PDF anexado</h4>
                    <p className="text-2xs text-stone-500 mt-0.5">
                      Anexe os slides ou textos recomendados para consultar durante os estudos
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => triggerPdfAttachment(currentAula)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Anexar Arquivo PDF</span>
                  </button>
                </div>
              )}

              {/* Visualização de PDF com Canvas (PdfCanvasViewer) dentro da Página de Estudo da Aula */}
              {showPdfViewer && (
                <div className="mt-4 animate-in fade-in duration-200">
                  {loadingPdf && !pdfBinaryData ? (
                    <div className="p-8 bg-stone-900 rounded-2xl border-2 border-amber-400 text-center space-y-2 text-white">
                      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs text-stone-300 font-medium">Carregando arquivo PDF do armazenamento local...</p>
                    </div>
                  ) : pdfBinaryData ? (
                    <PdfCanvasViewer
                      pdfBinaryData={pdfBinaryData.data}
                      fileName={pdfBinaryData.nome}
                      fileSize={pdfBinaryData.tamanhoFormatado}
                      onClose={handleCloseInlinePdf}
                      onDownload={handleDownloadPdf}
                    />
                  ) : null}
                </div>
              )}
            </div>

            {/* Seção Vídeo / Aula Online */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">Vídeo ou Aula Online</h3>
                    <p className="text-2xs text-stone-500">
                      Link da gravação, transmissão remota ou aula complementar no YouTube / Teams
                    </p>
                  </div>
                </div>
                {currentAula.linkAula && (
                  <span className="text-2xs font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                    Link ativo
                  </span>
                )}
              </div>

              {currentAula.linkAula ? (
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                  <div className="text-xs font-mono text-stone-800 bg-white p-3 rounded-lg border border-stone-200 flex items-center gap-2 truncate">
                    <Link2 className="w-4 h-4 text-stone-400 shrink-0" />
                    <span className="truncate flex-1">{currentAula.linkAula}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={currentAula.linkAula}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir Transmissão / Vídeo</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleOpenLinkModal(currentAula)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl text-xs font-semibold transition shadow-2xs"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-stone-500" />
                      <span>Editar Link</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveLinkFromAula(currentAula)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-rose-50 text-stone-600 hover:text-rose-600 border border-stone-200 rounded-xl text-xs font-semibold transition shadow-2xs"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Remover</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-stone-50/70 border-2 border-dashed border-stone-200 rounded-xl space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-700">Nenhum link vinculado</h4>
                    <p className="text-2xs text-stone-500 mt-0.5">
                      Vincule gravações no Teams, Zoom ou videoaulas do YouTube
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenLinkModal(currentAula)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Link de Vídeo</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SEÇÃO 3: CHECKLIST E PROGRESSO DA AULA */}
        {(activeTab === 'sequencia' || activeTab === 'checklist') && (
          <div id="secao-aula-checklist" className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs space-y-5 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100/80 text-amber-800 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-serif">
                    📋 Progresso da Aula
                  </h3>
                  <p className="text-2xs text-stone-500">
                    Acompanhe as etapas de fixação, síntese e revisão desta aula
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-start sm:self-auto">
                <span className="text-xs font-bold text-stone-700 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200">
                  Progresso da aula: {currentChecklistProgress.percentage}%
                </span>
                {currentChecklistProgress.isConcluida ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold shadow-2xs">
                    <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                    <span>✓ Aula concluída</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Em andamento</span>
                  </span>
                )}
              </div>
            </div>

            {/* Barra de Progresso Visual */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
                <span>Progresso da aula: {currentChecklistProgress.percentage}%</span>
                <span className={currentChecklistProgress.isConcluida ? 'text-emerald-700 font-bold' : 'text-stone-500'}>
                  {currentChecklistProgress.completedCount} de {currentChecklistProgress.totalCount} etapas ({currentChecklistProgress.percentage}%)
                </span>
              </div>
              <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden border border-stone-200/80 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    currentChecklistProgress.isConcluida
                      ? 'bg-emerald-600'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600'
                  }`}
                  style={{ width: `${currentChecklistProgress.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-3xs text-stone-400 font-medium">
                <span>0 (0%)</span>
                <span>1 (20%)</span>
                <span>2 (40%)</span>
                <span>3 (60%)</span>
                <span>4 (80%)</span>
                <span>5 (100% Concluída)</span>
              </div>
            </div>

            {/* Lista dos 5 Itens do Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {CHECKLIST_ITEMS_CONFIG.map((item) => {
                const isChecked = !!currentAula.checklist?.[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleAulaChecklistItem(currentAula.id, item.key)}
                    className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition cursor-pointer ${
                      isChecked
                        ? 'bg-emerald-50/70 border-emerald-300 hover:bg-emerald-50 text-stone-800 shadow-2xs'
                        : 'bg-stone-50/70 border-stone-200/80 hover:bg-white hover:border-amber-300 text-stone-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md shrink-0 mt-0.5 flex items-center justify-center border transition ${
                        isChecked
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white border-stone-300 text-transparent hover:border-amber-500'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-xs font-semibold leading-tight ${
                            isChecked ? 'text-emerald-950 font-bold' : 'text-stone-800'
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>
                      <p className="text-3xs text-stone-500 mt-1 leading-snug">
                        {item.descricao}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SEÇÃO 4: REVISÃO DA AULA COM IA */}
        {(activeTab === 'sequencia' || activeTab === 'checklist' || activeTab === 'revisao') && (
          <div id="secao-aula-revisao" className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs space-y-5 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100/80 text-purple-800 flex items-center justify-center">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-serif">
                    🧠 Revisar esta Aula
                  </h3>
                  <p className="text-2xs text-stone-500">
                    Simulado rápido de 5 perguntas geradas por IA a partir do conteúdo desta aula
                  </p>
                </div>
              </div>
            </div>

            {/* ESTADO 1: IDLE */}
            {revisionState === 'idle' && (
              <div className="p-6 bg-purple-50/50 border border-purple-200/70 rounded-2xl text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
                  <Brain className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h4 className="text-sm font-bold text-stone-900 font-serif">
                    Pronto para testar seus conhecimentos?
                  </h4>
                  <p className="text-xs text-stone-600">
                    A IA analisará o conteúdo cadastrado e o material PDF da aula para criar 5 perguntas exclusivas de múltipla escolha com explicações.
                  </p>
                </div>
                <button
                  id="btn-iniciar-revisao"
                  type="button"
                  onClick={handleStartRevision}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <Brain className="w-4 h-4" />
                  <span>🧠 Iniciar revisão</span>
                </button>
              </div>
            )}

            {/* ESTADO 2: LOADING */}
            {revisionState === 'loading' && (
              <div className="p-8 text-center bg-purple-50/40 border border-purple-200/60 rounded-2xl space-y-3">
                <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold text-purple-900">
                  Analisando conteúdo da aula e elaborando 5 perguntas...
                </p>
                <p className="text-3xs text-stone-500">
                  Isso levará apenas alguns segundos.
                </p>
              </div>
            )}

            {/* ESTADO 3: ERROR */}
            {revisionState === 'error' && (
              <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl space-y-3 text-center">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-rose-800">
                  {revisionError || 'Não foi possível gerar a revisão desta aula. Tente novamente.'}
                </p>
                <button
                  id="btn-tentar-novamente-revisao"
                  type="button"
                  onClick={handleStartRevision}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Tentar novamente</span>
                </button>
              </div>
            )}

            {/* ESTADO 4: ACTIVE QUESTION */}
            {revisionState === 'active' && revisionQuestions.length > 0 && (
              <div className="space-y-5">
                {/* Cabeçalho da pergunta */}
                <div className="flex items-center justify-between text-xs pb-3 border-b border-stone-100">
                  <span className="font-bold text-stone-800">
                    Pergunta {currentQuestionIndex + 1} de {revisionQuestions.length}
                  </span>
                  <span className="text-3xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                    {Math.round(((currentQuestionIndex + 1) / revisionQuestions.length) * 100)}% concluído
                  </span>
                </div>

                {/* Questão */}
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-stone-900 leading-relaxed">
                    {revisionQuestions[currentQuestionIndex].pergunta}
                  </p>

                  {/* Alternativas */}
                  <div className="space-y-2">
                    {revisionQuestions[currentQuestionIndex].alternativas.map((alt, idx) => {
                      const letter = String.fromCharCode(65 + idx); // A, B, C, D
                      const isSelected = selectedOption === idx;
                      const isCorrectIndex = idx === revisionQuestions[currentQuestionIndex].corretaIndex;

                      let btnStyle = 'bg-stone-50 border-stone-200 text-stone-800 hover:bg-white hover:border-purple-300';
                      let badgeStyle = 'bg-stone-200 text-stone-700';

                      if (isAnswered) {
                        if (isCorrectIndex) {
                          btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-medium shadow-2xs';
                          badgeStyle = 'bg-emerald-600 text-white font-bold';
                        } else if (isSelected) {
                          btnStyle = 'bg-rose-50 border-rose-300 text-rose-950';
                          badgeStyle = 'bg-rose-600 text-white font-bold';
                        } else {
                          btnStyle = 'bg-stone-50/50 border-stone-200 text-stone-400 opacity-60';
                          badgeStyle = 'bg-stone-200 text-stone-500';
                        }
                      } else if (isSelected) {
                        btnStyle = 'bg-purple-50 border-purple-500 text-purple-950 font-medium shadow-2xs ring-1 ring-purple-500/30';
                        badgeStyle = 'bg-purple-700 text-white font-bold';
                      }

                      return (
                        <button
                          key={idx}
                          id={`opcao-revisao-${idx}`}
                          type="button"
                          disabled={isAnswered}
                          onClick={() => setSelectedOption(idx)}
                          className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition cursor-pointer ${btnStyle}`}
                        >
                          <span className={`w-6 h-6 rounded-lg text-2xs flex items-center justify-center shrink-0 font-semibold ${badgeStyle}`}>
                            {letter}
                          </span>
                          <span className="text-xs leading-snug pt-0.5 flex-1">{alt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Botão Responder / Feedback */}
                  {!isAnswered ? (
                    <div className="pt-2">
                      <button
                        id="btn-responder-revisao"
                        type="button"
                        disabled={selectedOption === null}
                        onClick={handleAnswerQuestion}
                        className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-40 text-white font-semibold text-xs rounded-xl transition shadow-2xs cursor-pointer"
                      >
                        Responder
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-2 animate-in fade-in duration-200">
                      {/* Box de resposta correta / incorreta */}
                      <div
                        className={`p-4 rounded-xl border space-y-2 ${
                          selectedOption === revisionQuestions[currentQuestionIndex].corretaIndex
                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                            : 'bg-rose-50/80 border-rose-300 text-rose-950'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-xs">
                          {selectedOption === revisionQuestions[currentQuestionIndex].corretaIndex ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>✓ Resposta correta</span>
                            </>
                          ) : (
                            <>
                              <X className="w-4 h-4 text-rose-600" />
                              <span>✗ Resposta incorreta</span>
                            </>
                          )}
                        </div>

                        <div className="text-xs leading-relaxed space-y-1">
                          <span className="font-semibold block text-stone-700">Explicação:</span>
                          <p>{revisionQuestions[currentQuestionIndex].explicacao}</p>
                        </div>
                      </div>

                      {/* Botão Próxima pergunta / Ver resultado */}
                      <div>
                        <button
                          id="btn-proxima-revisao"
                          type="button"
                          onClick={handleNextQuestion}
                          className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xl transition shadow-2xs flex items-center gap-2 cursor-pointer"
                        >
                          <span>
                            {currentQuestionIndex < revisionQuestions.length - 1 ? 'Próxima pergunta' : 'Ver resultado'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ESTADO 5: COMPLETED RESULT */}
            {revisionState === 'completed' && (
              <div className="p-6 bg-stone-50 border border-stone-200/90 rounded-2xl text-center space-y-5 animate-in fade-in duration-200">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-2xs">
                  <Award className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-stone-900 font-serif">
                    🎯 Resultado da revisão
                  </h4>
                  <p className="text-xs text-stone-500">
                    Revisão concluída com sucesso para esta aula
                  </p>
                </div>

                {/* Métricas de pontuação */}
                <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                  <div className="p-4 bg-white border border-stone-200 rounded-xl space-y-0.5">
                    <span className="text-3xs uppercase tracking-wider font-bold text-stone-400 block">Acertos</span>
                    <span className="text-xl font-extrabold text-stone-900">{revisionScore} / 5</span>
                  </div>

                  <div className="p-4 bg-white border border-stone-200 rounded-xl space-y-0.5">
                    <span className="text-3xs uppercase tracking-wider font-bold text-stone-400 block">Aproveitamento</span>
                    <span className="text-xl font-extrabold text-purple-700">{revisionPercentage}%</span>
                  </div>
                </div>

                {/* Classificação simples */}
                {(() => {
                  const classif = getRevisionClassification(revisionPercentage);
                  return (
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold ${classif.bg} ${classif.color}`}>
                      <span>Classificação:</span>
                      <span>{classif.text}</span>
                    </div>
                  );
                })()}

                <p className="text-2xs text-stone-500 max-w-md mx-auto">
                  Ao concluir a revisão, o item <strong>"Revisão concluída"</strong> foi marcado automaticamente no seu checklist de estudo desta aula!
                </p>

                {/* Botão Refazer revisão */}
                <div>
                  <button
                    id="btn-refazer-revisao"
                    type="button"
                    onClick={handleStartRevision}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>🔄 Refazer revisão</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SEÇÃO 3: ANOTAÇÕES & ESPAÇO DE ESTUDO DA AULA */}
        {(activeTab === 'sequencia' || activeTab === 'anotacoes' || activeTab === 'quadros' || activeTab === 'mapas') && (
          <div id="secao-aula-anotacoes" className="space-y-6 animate-in fade-in duration-200">
            {/* Cabeçalho da Seção de Anotações com os 3 botões de formato */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-serif font-bold text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Espaço de Anotações e Resumos</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Crie múltiplos resumos em quadros, mapas conceituais e fichamentos exclusivos desta aula
                </p>
              </div>

              {/* Botões para os 3 formatos de estudo + Botões visuais de IA futura (Requisito 12) */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAbrirCriacaoAnotacao(viewingAula, 'quadros')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition shadow-2xs cursor-pointer"
                  title="Criar novo resumo visual em quadros"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>+ Resumo em Quadros</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAbrirCriacaoAnotacao(viewingAula, 'mapa_mental')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition shadow-2xs cursor-pointer"
                  title="Criar novo mapa mental com ramificações"
                >
                  <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                  <span>+ Mapa Mental</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAbrirCriacaoAnotacao(viewingAula, 'livre')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-xl text-xs font-semibold transition shadow-2xs cursor-pointer"
                  title="Criar nova anotação de texto livre"
                >
                  <FileText className="w-3.5 h-3.5 text-stone-600" />
                  <span>+ Anotação Livre</span>
                </button>
              </div>
            </div>

            {/* Filtros e Abas de Navegação interna entre formatos (Requisito 9) */}
            {notasDestaAula.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-stone-200/90 shadow-2xs">
                <span className="text-2xs uppercase tracking-wider text-stone-400 font-bold ml-1 mr-1 shrink-0">
                  Visualizar:
                </span>
                {[
                  { id: 'todos', label: `Todos os Conteúdos (${notasDestaAula.length})` },
                  {
                    id: 'quadros',
                    label: `📋 Resumos em Quadros (${notasDestaAula.filter((n) => n.tipo === 'quadros').length})`,
                  },
                  {
                    id: 'mapa_mental',
                    label: `🧠 Mapas Mentais (${notasDestaAula.filter((n) => n.tipo === 'mapa_mental').length})`,
                  },
                  {
                    id: 'livre',
                    label: `📝 Anotações Livres (${notasDestaAula.filter((n) => !n.tipo || n.tipo === 'livre').length})`,
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFiltroTipoNota(item.id)}
                    className={`text-2xs px-3.5 py-1.5 rounded-xl font-semibold transition ${
                      filtroTipoNota === item.id
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            {/* Listagem de Anotações ou Estado Vazio */}
            {notasDestaAula.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-stone-300 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600 border border-amber-200 shadow-2xs">
                  <Sparkles className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-serif font-bold text-stone-900">
                    Nenhuma anotação vinculada a esta aula
                  </h3>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    Cada aula possui seu próprio caderno de estudos. Escolha abaixo o formato ideal para registrar o conteúdo desta aula:
                  </p>
                </div>

                {/* Cards de escolha direta para o aluno */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                  {/* Card 1: Quadros */}
                  <div
                    onClick={() => handleAbrirCriacaoAnotacao(viewingAula, 'quadros')}
                    className="p-4 rounded-2xl border-2 border-amber-300/80 bg-amber-50/20 hover:border-amber-500 hover:bg-amber-50/50 transition cursor-pointer flex flex-col justify-between group shadow-xs"
                  >
                    <div>
                      <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition">
                        <LayoutGrid className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-stone-950">Resumo em quadros</h4>
                      <p className="text-2xs text-stone-600 mt-1 leading-relaxed">
                        Conceitos, artigos de lei, pegadinhas de prova e pontos de memorização em cartões visuais.
                      </p>
                    </div>
                    <span className="text-2xs font-bold text-amber-800 mt-3 block">
                      + Criar primeiro resumo →
                    </span>
                  </div>

                  {/* Card 2: Mapa mental */}
                  <div
                    onClick={() => handleAbrirCriacaoAnotacao(viewingAula, 'mapa_mental')}
                    className="p-4 rounded-2xl border-2 border-stone-300 hover:border-stone-800 hover:bg-stone-50/80 transition cursor-pointer flex flex-col justify-between group shadow-xs"
                  >
                    <div>
                      <div className="w-8 h-8 rounded-xl bg-stone-900 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                        <GitBranch className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-stone-950">Mapa mental</h4>
                      <p className="text-2xs text-stone-600 mt-1 leading-relaxed">
                        Ideia central, ramificações com sub-ramos e hierarquia visual para rápida fixação.
                      </p>
                    </div>
                    <span className="text-2xs font-bold text-stone-800 mt-3 block">
                      + Criar primeiro mapa →
                    </span>
                  </div>

                  {/* Card 3: Livre */}
                  <div
                    onClick={() => handleAbrirCriacaoAnotacao(viewingAula, 'livre')}
                    className="p-4 rounded-2xl border-2 border-stone-200 hover:border-stone-400 hover:bg-stone-50/50 transition cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center mb-3 group-hover:bg-stone-800 group-hover:text-white transition">
                        <FileText className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-stone-950">Anotação livre</h4>
                      <p className="text-2xs text-stone-500 mt-1 leading-relaxed">
                        Para redigir a fala do professor, comentários e anotações completas de sala.
                      </p>
                    </div>
                    <span className="text-2xs font-bold text-stone-700 mt-3 block">
                      + Criar anotação livre →
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notasDestaAulaFiltradas.map((nota) => {
                  const isLivre = !nota.tipo || nota.tipo === 'livre';
                  const isQuadros = nota.tipo === 'quadros';
                  const isMapa = nota.tipo === 'mapa_mental';

                  return (
                    <div
                      key={nota.id}
                      className="bg-white rounded-2xl border-2 border-stone-200/90 hover:border-amber-400 hover:shadow-sm transition flex flex-col justify-between overflow-hidden"
                    >
                      <div className="p-4 space-y-3">
                        {/* Tipo Badge e Ação de Favorito */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-2xs px-2.5 py-1 rounded-lg font-bold border flex items-center gap-1.5 ${
                              isQuadros
                                ? 'bg-amber-50 text-amber-950 border-amber-300'
                                : isMapa
                                ? 'bg-stone-900 text-stone-100 border-stone-800'
                                : 'bg-stone-100 text-stone-800 border-stone-200'
                            }`}
                          >
                            {isQuadros && <LayoutGrid className="w-3 h-3 text-amber-700" />}
                            {isMapa && <GitBranch className="w-3 h-3 text-amber-400" />}
                            {isLivre && <FileText className="w-3 h-3 text-stone-600" />}
                            <span>
                              {isQuadros
                                ? 'Resumo em Quadros'
                                : isMapa
                                ? 'Mapa Mental'
                                : 'Anotação Livre'}
                            </span>
                          </span>

                          <button
                            type="button"
                            onClick={() => toggleFavoritoAnotacao(nota.id)}
                            className={`p-1 rounded-md transition ${
                              nota.favorito ? 'text-amber-500' : 'text-stone-300 hover:text-amber-500'
                            }`}
                            title={nota.favorito ? 'Favorita' : 'Favoritar anotação'}
                          >
                            <Star className={`w-4 h-4 ${nota.favorito ? 'fill-current' : ''}`} />
                          </button>
                        </div>

                        {/* Título da Anotação */}
                        <div>
                          <h4
                            onClick={() => setViewingAnotacaoModal(nota)}
                            className="text-sm font-bold font-serif text-stone-900 hover:text-amber-700 transition cursor-pointer leading-snug"
                          >
                            {nota.titulo}
                          </h4>
                          <p className="text-3xs text-stone-400 mt-0.5">
                            {nota.data.split('-').reverse().join('/')}
                          </p>
                        </div>

                        {/* Prévia do Conteúdo */}
                        <div className="text-xs text-stone-600">
                          {isLivre && (
                            <p className="line-clamp-3 leading-relaxed text-stone-600 font-sans">
                              {nota.conteudo
                                ? nota.conteudo.replace(/[#*`_>=-]/g, '').trim()
                                : 'Sem conteúdo textual.'}
                            </p>
                          )}

                          {isQuadros && (
                            <div className="space-y-1.5">
                              <div className="text-2xs font-semibold text-amber-800">
                                {nota.quadros?.length || 0}{' '}
                                {(nota.quadros?.length || 0) === 1 ? 'quadro de estudo' : 'quadros de estudo'}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {nota.quadros?.slice(0, 3).map((q, idx) => (
                                  <span
                                    key={q.id || idx}
                                    className="px-2 py-0.5 bg-stone-100 text-stone-700 rounded text-3xs font-medium truncate max-w-[120px]"
                                  >
                                    {q.titulo || `Quadro ${idx + 1}`}
                                  </span>
                                ))}
                                {(nota.quadros?.length || 0) > 3 && (
                                  <span className="text-3xs text-stone-400">
                                    +{(nota.quadros?.length || 0) - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {isMapa && (
                            <div className="space-y-1">
                              <div className="text-2xs font-bold text-stone-800 truncate">
                                Ideia Central: {nota.mapaMental?.noCentral || nota.titulo}
                              </div>
                              <div className="text-3xs text-stone-500">
                                {nota.mapaMental?.ramificacoes.length || 0} ramificações conceituais
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        {nota.tags && nota.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {nota.tags.map((tag, tIdx) => (
                              <span
                                key={tIdx}
                                className="px-1.5 py-0.5 bg-stone-100 text-stone-600 text-3xs rounded font-medium"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Barra de Ações da Anotação (Requisito 3 & 7) */}
                      <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-2">
                        {/* Botão de Modo Leitura ou Ver Mapa */}
                        <button
                          type="button"
                          onClick={() => setViewingAnotacaoModal(nota)}
                          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-2xs ${
                            isQuadros
                              ? 'bg-amber-600 hover:bg-amber-700 text-white'
                              : isMapa
                              ? 'bg-stone-900 hover:bg-stone-800 text-white'
                              : 'bg-white hover:bg-stone-100 text-stone-800 border border-stone-200'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>
                            {isQuadros
                              ? '👁 Modo Leitura'
                              : isMapa
                              ? '👁 Ver Mapa'
                              : 'Estudar'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingAnotacao(nota);
                            setIsNoteFormOpen(true);
                          }}
                          className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-white rounded-lg transition border border-transparent hover:border-stone-200"
                          title="Editar anotação"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => duplicarAnotacao(nota.id)}
                          className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-white rounded-lg transition border border-transparent hover:border-stone-200"
                          title="Duplicar anotação"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Deseja excluir "${nota.titulo}"?`)) {
                              deleteAnotacao(nota.id);
                            }
                          }}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Excluir anotação"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SEÇÃO 4: ASSISTENTE DE IA */}
        {(activeTab === 'sequencia' || activeTab === 'assistente_ia') && (
          <div id="secao-aula-ia" className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/30 p-6 rounded-2xl border border-amber-200/60 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/50 pb-4">
                <div>
                  <h3 className="text-lg font-serif font-bold text-amber-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                    <span>Assistente de IA</span>
                  </h3>
                  <p className="text-xs text-amber-700/80 mt-1">
                    Use a IA para transformar o conteúdo desta aula em material de estudo.
                  </p>
                </div>
              </div>

              {aiError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
                  <strong>Erro:</strong> {aiError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={() => handleRunAi('quadros')}
                  className="flex flex-col text-left p-4 rounded-xl border border-stone-200 bg-white hover:bg-amber-50 hover:border-amber-300 transition disabled:opacity-50"
                >
                  <LayoutGrid className="w-5 h-5 text-amber-600 mb-2" />
                  <span className="text-sm font-bold text-stone-700">Gerar Resumo em Quadros</span>
                  <span className="text-2xs text-stone-500 mt-1">Estrutura visual com conceitos, artigos e alertas</span>
                </button>

                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={() => handleRunAi('mapa_mental')}
                  className="flex flex-col text-left p-4 rounded-xl border border-stone-200 bg-white hover:bg-amber-50 hover:border-amber-300 transition disabled:opacity-50"
                >
                  <GitBranch className="w-5 h-5 text-amber-600 mb-2" />
                  <span className="text-sm font-bold text-stone-700">Gerar Mapa Mental</span>
                  <span className="text-2xs text-stone-500 mt-1">Ramificações e relações do tema central</span>
                </button>

                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={() => handleRunAi('resumir')}
                  className="flex flex-col text-left p-4 rounded-xl border border-stone-200 bg-white hover:bg-amber-50 hover:border-amber-300 transition disabled:opacity-50"
                >
                  <FileText className="w-5 h-5 text-amber-600 mb-2" />
                  <span className="text-sm font-bold text-stone-700">Resumir Aula</span>
                  <span className="text-2xs text-stone-500 mt-1">Síntese geral do conteúdo em texto corrido</span>
                </button>

                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={() => handleRunAi('conceitos')}
                  className="flex flex-col text-left p-4 rounded-xl border border-stone-200 bg-white hover:bg-amber-50 hover:border-amber-300 transition disabled:opacity-50"
                >
                  <Tag className="w-5 h-5 text-amber-600 mb-2" />
                  <span className="text-sm font-bold text-stone-700">Identificar Conceitos</span>
                  <span className="text-2xs text-stone-500 mt-1">Extrai termos-chave e suas definições</span>
                </button>

                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={() => handleRunAi('artigos')}
                  className="flex flex-col text-left p-4 rounded-xl border border-stone-200 bg-white hover:bg-amber-50 hover:border-amber-300 transition disabled:opacity-50"
                >
                  <BookOpen className="w-5 h-5 text-amber-600 mb-2" />
                  <span className="text-sm font-bold text-stone-700">Identificar Artigos/Leis</span>
                  <span className="text-2xs text-stone-500 mt-1">Lista legislação citada no material</span>
                </button>

                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={() => handleRunAi('memorizar')}
                  className="flex flex-col text-left p-4 rounded-xl border border-stone-200 bg-white hover:bg-amber-50 hover:border-amber-300 transition disabled:opacity-50"
                >
                  <ListChecks className="w-5 h-5 text-amber-600 mb-2" />
                  <span className="text-sm font-bold text-stone-700">Pontos para Memorizar</span>
                  <span className="text-2xs text-stone-500 mt-1">Checklist de atenção e pegadinhas comuns</span>
                </button>
              </div>

              {aiLoading && (
                <div className="flex items-center justify-center p-8 text-amber-700 space-x-3">
                  <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                  <span className="font-semibold text-sm">Analisando conteúdo...</span>
                </div>
              )}

              {aiResult && !aiLoading && (
                <div className="bg-stone-50/80 p-5 rounded-2xl border border-amber-200/90 shadow-2xs mt-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/80 pb-3">
                    <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Sugestão Gerada pela IA</span>
                    </h4>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={isGeneratingPdf}
                        onClick={handleSavePdf}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold transition shadow-2xs cursor-pointer disabled:opacity-50"
                        title="Salvar resultado como PDF"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isGeneratingPdf ? 'Gerando PDF...' : 'Salvar em PDF'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAiResult(null);
                          setAiChatMessages([]);
                          setAiChatInput('');
                          setAiChatError(null);
                        }}
                        className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                      >
                        Limpar Resultado
                      </button>
                    </div>
                  </div>

                  <AiResultView
                    type={aiResult.type}
                    resultText={aiResult.result}
                    parsedData={aiResult.parsed}
                  />

                  {/* SEÇÃO CONVERSA COM A IA */}
                  <div className="mt-6 pt-5 border-t border-amber-200/70 space-y-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4.5 h-4.5 text-amber-600" />
                      <h4 className="text-sm font-bold text-stone-800">💬 Continuar com a IA</h4>
                    </div>

                    {/* Histórico da Conversa */}
                    {aiChatMessages.length > 0 && (
                      <div className="space-y-2.5 max-h-60 overflow-y-auto p-3.5 bg-white rounded-xl border border-stone-200/80 text-xs">
                        {aiChatMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex flex-col ${
                              msg.sender === 'user' ? 'items-end' : 'items-start'
                            }`}
                          >
                            <div
                              className={`px-3.5 py-2 rounded-xl max-w-[85%] ${
                                msg.sender === 'user'
                                  ? 'bg-amber-600 text-white rounded-br-2xs'
                                  : 'bg-stone-100 text-stone-800 rounded-bl-2xs border border-stone-200'
                              }`}
                            >
                              <span className="font-semibold block text-3xs opacity-80 mb-0.5">
                                {msg.sender === 'user' ? 'Usuário' : 'IA'}
                              </span>
                              <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {aiChatError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium">
                        {aiChatError}
                      </div>
                    )}

                    {/* Form de Solicitação */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendAiChat();
                      }}
                      className="space-y-2.5"
                    >
                      <label className="block text-xs font-semibold text-stone-700">
                        O que você quer alterar ou melhorar?
                      </label>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={aiChatInput}
                          onChange={(e) => setAiChatInput(e.target.value)}
                          disabled={aiChatLoading}
                          placeholder="Digite seu pedido... (ex: acrescente exemplos, resuma, adicione artigos)"
                          className="flex-1 px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition disabled:bg-stone-100"
                        />
                        <button
                          type="submit"
                          disabled={aiChatLoading || !aiChatInput.trim()}
                          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition shadow-2xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
                        >
                          {aiChatLoading ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Analisando seu pedido...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Enviar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Modais Integrados da Aula */}
        <AnotacaoFormModal
          isOpen={isNoteFormOpen}
          onClose={() => {
            setIsNoteFormOpen(false);
            setEditingAnotacao(null);
          }}
          onSave={handleSaveAnotacao}
          editingAnotacao={editingAnotacao}
          materias={materias}
          aulas={aulas}
          fixedAula={viewingAula}
          prefilledDraft={{
            aula: viewingAula,
            initialTipo: noteInitialTipo,
            disciplinaId: viewingAula.materiaId,
          }}
        />

        <AnotacaoVisualizadorModal
          isOpen={!!viewingAnotacaoModal}
          onClose={() => setViewingAnotacaoModal(null)}
          anotacao={viewingAnotacaoModal}
          aulaRelacionada={viewingAula}
          onEdit={(n) => {
            setViewingAnotacaoModal(null);
            setEditingAnotacao(n);
            setIsNoteFormOpen(true);
          }}
          onDuplicate={(id) => duplicarAnotacao(id)}
          onToggleFavorito={(id) => toggleFavoritoAnotacao(id)}
          onAbrirAula={() => {}}
          onAbrirPdfAula={(aula) => {
            if (aula.materialPdf) handleOpenPdf(aula.materialPdf);
          }}
        />

        {/* Modal de Edição de Aula */}
        <AulaFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingAulaId(null);
          }}
          editingAula={editingAulaId ? (aulas.find((a) => a.id === editingAulaId) || null) : null}
          defaultMateriaId={currentAula?.materiaId}
        />

        {/* Modal de Link de Vídeo */}
        <Modal
          isOpen={!!linkModalAula}
          onClose={() => setLinkModalAula(null)}
          title={linkModalAula?.linkAula ? 'Editar Link da Aula ou Vídeo' : 'Adicionar Link da Aula ou Vídeo'}
          maxWidth="md"
        >
          <form onSubmit={handleSaveLinkFromModal} className="space-y-4 text-xs">
            {linkInputError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{linkInputError}</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-stone-800 mb-1">
                Cole aqui o endereço da aula ou vídeo:
              </label>
              <input
                type="text"
                placeholder="https://youtube.com/... ou link do Teams, Drive, etc."
                value={linkInputVal}
                onChange={(e) => {
                  setLinkInputVal(e.target.value);
                  setLinkInputError(null);
                }}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setLinkModalAula(null)}
                className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg font-medium text-xs transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs shadow-xs transition"
              >
                Salvar Link
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // =========================================================================
  // MODO 2: LISTAGEM GERAL DE AULAS (SE viewingAula === null)
  // =========================================================================
  return (
    <div id="aulas-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Input de arquivo invisível para anexo/substituição direta */}
      <input
        type="file"
        ref={singleFileInputRef}
        onChange={handleSingleFileSelected}
        accept="application/pdf"
        className="hidden"
      />

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">
            Registro de Aulas
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Cada aula possui seu próprio espaço de estudo completo com materiais e anotações
          </p>
        </div>

        <button
          id="btn-nova-aula"
          type="button"
          onClick={handleOpenCreateAula}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nova Aula</span>
        </button>
      </div>

      {/* Filtros e Barra de Pesquisa */}
      <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            id="input-busca-aulas"
            type="text"
            placeholder="Pesquisar por título, conteúdo, matéria ou professor..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
              title="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="w-full md:w-auto shrink-0 flex items-center gap-2">
          <select
            id="select-filtro-materia"
            value={materiaFiltro}
            onChange={(e) => setMateriaFiltro(e.target.value)}
            className="w-full md:w-56 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="todas">Todas as Disciplinas</option>
            {materias.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setOrdemData((prev) => (prev === 'recente' ? 'antiga' : 'recente'))}
            className="flex items-center gap-1.5 px-3 py-2 text-xs bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg text-stone-700 transition shrink-0"
            title="Alternar ordenação por data"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
            <span className="hidden sm:inline">
              {ordemData === 'recente' ? 'Mais recentes' : 'Mais antigas'}
            </span>
          </button>
        </div>
      </div>

      {/* Lista de Aulas */}
      {aulasFiltradas.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mx-auto text-amber-600">
            <Presentation className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-stone-900">Nenhuma aula encontrada</h3>
          <p className="text-xs text-stone-500">
            {busca || materiaFiltro !== 'todas'
              ? 'Tente ajustar os termos de busca ou filtros.'
              : 'Comece registrando a primeira aula do semestre.'}
          </p>
          <button
            type="button"
            onClick={handleOpenCreateAula}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cadastrar Primeira Aula</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {aulasFiltradas.map((aula) => {
            const materia = materias.find((m) => m.id === aula.materiaId);
            const qtdNotas = getQtdAnotacoesDaAula(aula.id, aula.materiaId, aula.data);

            return (
              <div
                key={aula.id}
                className="bg-white rounded-xl border border-stone-200/90 hover:border-amber-300 hover:shadow-sm transition p-5 space-y-3.5"
              >
                {/* Linha Superior: Disciplina, Data, Horário e Ações */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: materia?.cor || '#d97706' }}
                    />
                    <span className="text-xs font-bold text-stone-800">
                      {aula.disciplina}
                    </span>
                    {aula.professor && (
                      <>
                        <span className="text-stone-300">•</span>
                        <span className="text-xs text-stone-500 flex items-center gap-1">
                          <User className="w-3 h-3 text-stone-400" />
                          <span>{aula.professor}</span>
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 justify-between sm:justify-end">
                    <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span>{aula.data.split('-').reverse().join('/')}</span>
                      {aula.diaSemana && (
                        <>
                          <span className="text-stone-300">•</span>
                          <span>{aula.diaSemana}</span>
                        </>
                      )}
                      {aula.horario && (
                        <>
                          <span className="text-stone-300">•</span>
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          <span>{aula.horario}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1 ml-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditAula(aula)}
                        className="p-1.5 text-stone-400 hover:text-amber-700 hover:bg-stone-100 rounded-lg transition"
                        title="Editar dados da aula"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAula(aula)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Excluir aula"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Título da Aula */}
                <div>
                  <h2
                    onClick={() => setViewingAula(aula)}
                    className="text-base font-bold font-serif text-stone-900 hover:text-amber-700 transition cursor-pointer"
                  >
                    {aula.titulo}
                  </h2>
                </div>

                {/* Conteúdo Estudado */}
                <div className="bg-stone-50/70 border border-stone-200/60 rounded-lg p-3 text-xs text-stone-700 leading-relaxed whitespace-pre-wrap font-sans line-clamp-3">
                  {aula.conteudo}
                </div>

                {/* Indicadores de Materiais e Anotações vinculadas */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {/* Badge de Anotações Vinculadas */}
                  <div
                    onClick={() => {
                      setViewingAula(aula);
                      setActiveTab('anotacoes');
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
                      qtdNotas > 0
                        ? 'bg-amber-100/80 text-amber-900 border border-amber-300 hover:bg-amber-100'
                        : 'bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200'
                    }`}
                    title="Clique para ver o espaço de anotações desta aula"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${qtdNotas > 0 ? 'text-amber-700' : 'text-stone-400'}`} />
                    <span>
                      {qtdNotas === 0
                        ? 'Nenhuma anotação'
                        : `${qtdNotas} ${qtdNotas === 1 ? 'anotação vinculada' : 'anotações vinculadas'}`}
                    </span>
                  </div>

                  {/* Badge de PDF */}
                  {aula.materialPdf ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200">
                      <FileText className="w-3.5 h-3.5 text-rose-600" />
                      <span className="truncate max-w-[160px]">{aula.materialPdf.nome}</span>
                    </div>
                  ) : (
                    <span className="text-2xs text-stone-400 italic">Sem PDF</span>
                  )}

                  {/* Badge de Vídeo */}
                  {aula.linkAula && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
                      <Video className="w-3.5 h-3.5 text-blue-600" />
                      <span>Vídeo / Aula Online</span>
                    </div>
                  )}
                </div>

                {/* Rodapé do Card: Abrir Espaço de Estudo e Criar Anotação */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => {
                      setViewingAula(aula);
                      setActiveTab('informacoes');
                    }}
                    className="text-xs font-semibold text-stone-700 hover:text-stone-900 flex items-center gap-1.5 transition"
                  >
                    <Eye className="w-4 h-4 text-stone-500" />
                    <span>Abrir Espaço de Estudo da Aula</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAbrirCriacaoAnotacao(aula, 'livre')}
                    className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 px-3 py-1.5 rounded-lg transition shadow-2xs"
                  >
                    <FilePlus className="w-3.5 h-3.5 text-amber-700" />
                    <span>Criar Anotação Desta Aula</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Criar / Editar Aula */}
      <AulaFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingAulaId(null);
        }}
        editingAula={editingAulaId ? (aulas.find((a) => a.id === editingAulaId) || null) : null}
        defaultMateriaId={materiaFiltro !== 'todas' ? materiaFiltro : (materias[0]?.id || '')}
      />

      {/* Modal de Link */}
      <Modal
        isOpen={!!linkModalAula}
        onClose={() => setLinkModalAula(null)}
        title={linkModalAula?.linkAula ? 'Editar Link da Aula ou Vídeo' : 'Adicionar Link da Aula ou Vídeo'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveLinkFromModal} className="space-y-4 text-xs">
          {linkInputError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{linkInputError}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-stone-800 mb-1">
              Cole aqui o endereço da aula ou vídeo:
            </label>
            <input
              type="text"
              placeholder="https://youtube.com/... ou link do Teams, Drive, etc."
              value={linkInputVal}
              onChange={(e) => {
                setLinkInputVal(e.target.value);
                setLinkInputError(null);
              }}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setLinkModalAula(null)}
              className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg font-medium text-xs transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs shadow-xs transition"
            >
              Salvar Link
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
