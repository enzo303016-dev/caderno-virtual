// Utilitário para armazenamento leve, seguro e desacoplado de PDFs e links de aulas
import { AulaMaterialPdf } from '../types';

const DB_NAME = 'caderno_direito_pdf_db';
const DB_VERSION = 1;
const STORE_NAME = 'aulas_pdf_store';

export interface StoredPdfRecord {
  id: string; // storageId
  nome: string;
  tipo: string;
  tamanho: number;
  dataUpload: string;
  dataUrl?: string;
  blob?: Blob;
}

// Fallback em memória caso o IndexedDB esteja desabilitado por restrições de iframe
const memoryFallbackMap = new Map<string, StoredPdfRecord>();

/**
 * Abre ou inicializa a conexão com o IndexedDB do navegador.
 */
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não suportado'));
      return;
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Banco de dados bloqueado'));
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Converte arquivo File para Data URL Base64 de forma assíncrona.
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Formata tamanho em bytes para leitura humana (ex: "1.4 MB", "350 KB").
 */
export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Obtém o dia da semana em português a partir de uma string de data YYYY-MM-DD.
 * Não sofre com desvios de fuso horário.
 */
export function getDiaSemanaFromData(dataStr: string): string {
  if (!dataStr) return '';
  const parts = dataStr.split('-').map(Number);
  if (parts.length !== 3) return '';
  const [ano, mes, dia] = parts;
  if (!ano || !mes || !dia) return '';
  
  const dateObj = new Date(ano, mes - 1, dia);
  const dias = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ];
  return dias[dateObj.getDay()] || '';
}

/**
 * Valida minimamente e normaliza uma URL informada pelo usuário.
 */
export function validateAndNormalizeUrl(url: string): {
  isValid: boolean;
  normalizedUrl: string;
  providerLabel: string;
  error?: string;
} {
  const trimmed = url.trim();
  if (!trimmed) {
    return {
      isValid: false,
      normalizedUrl: '',
      providerLabel: '',
      error: 'O endereço do link não pode estar vazio.',
    };
  }

  let normalized = trimmed;
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  try {
    const parsed = new URL(normalized);
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return {
        isValid: false,
        normalizedUrl: '',
        providerLabel: '',
        error: 'Por favor, informe uma URL válida (ex: https://youtube.com/...).',
      };
    }

    const host = parsed.hostname.toLowerCase();
    let providerLabel = 'Link / Vídeo Online';

    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      providerLabel = 'YouTube';
    } else if (host.includes('drive.google.com')) {
      providerLabel = 'Google Drive';
    } else if (host.includes('teams.microsoft.com')) {
      providerLabel = 'Microsoft Teams';
    } else if (host.includes('meet.google.com')) {
      providerLabel = 'Google Meet';
    } else if (host.includes('zoom.us')) {
      providerLabel = 'Zoom';
    } else if (host.includes('webex.com')) {
      providerLabel = 'Cisco Webex';
    } else if (host.includes('ischolar') || host.includes('moodle') || host.includes('canvas') || host.includes('blackboard')) {
      providerLabel = 'Plataforma Acadêmica';
    }

    return {
      isValid: true,
      normalizedUrl: normalized,
      providerLabel,
    };
  } catch {
    return {
      isValid: false,
      normalizedUrl: '',
      providerLabel: '',
      error: 'Formato de link inválido. Verifique o endereço digitado.',
    };
  }
}

/**
 * Salva um PDF de aula no IndexedDB local de forma segura e leve.
 * Retorna o objeto de metadados compatível com a interface AulaMaterialPdf.
 */
export async function savePdfToStorage(
  storageId: string,
  file: File
): Promise<AulaMaterialPdf> {
  const dataUrl = await fileToDataUrl(file);
  const record: StoredPdfRecord = {
    id: storageId,
    nome: file.name,
    tipo: file.type || 'application/pdf',
    tamanho: file.size,
    dataUpload: new Date().toISOString(),
    dataUrl,
    blob: file,
  };

  // Armazena no IndexedDB
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Armazenando PDF em fallback de memória:', err);
    memoryFallbackMap.set(storageId, record);
  }

  // Prepara estrutura pronta para migração futura (ex: Supabase Storage)
  return {
    nome: file.name,
    tamanho: file.size,
    tamanhoFormatado: formatBytes(file.size),
    dataUpload: record.dataUpload,
    tipo: record.tipo,
    storageId,
    url: '',
    provider: 'local_indexeddb',
  };
}

/**
 * Recupera o arquivo PDF gravado no IndexedDB pelo storageId.
 */
export async function getPdfFromStorage(
  storageId: string
): Promise<StoredPdfRecord | null> {
  // Verifica fallback em memória
  if (memoryFallbackMap.has(storageId)) {
    return memoryFallbackMap.get(storageId) || null;
  }

  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(storageId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Erro ao ler PDF do IndexedDB:', err);
    return null;
  }
}

/**
 * Remove um PDF do armazenamento local/IndexedDB pelo storageId.
 */
export async function deletePdfFromStorage(storageId: string): Promise<void> {
  memoryFallbackMap.delete(storageId);

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(storageId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Erro ao remover PDF do IndexedDB:', err);
  }
}
