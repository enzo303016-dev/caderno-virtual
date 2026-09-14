import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Aula, AulaMaterialPdf, StatusAula } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  getDiaSemanaFromData,
  validateAndNormalizeUrl,
  savePdfToStorage,
} from '../../utils/pdfStorage';

export interface AulaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAula?: Aula | null;
  defaultMateriaId?: string;
  onSaved?: (aula: Aula) => void;
}

export const AulaFormModal: React.FC<AulaFormModalProps> = ({
  isOpen,
  onClose,
  editingAula,
  defaultMateriaId,
  onSaved,
}) => {
  const { materias, addAula, updateAula } = useApp();

  const [formMateriaId, setFormMateriaId] = useState('');
  const [formDisciplina, setFormDisciplina] = useState('');
  const [formProfessor, setFormProfessor] = useState('');
  const [formData, setFormData] = useState(new Date().toISOString().split('T')[0]);
  const [formDiaSemana, setFormDiaSemana] = useState('');
  const [formHorario, setFormHorario] = useState('');
  const [formTitulo, setFormTitulo] = useState('');
  const [formConteudo, setFormConteudo] = useState('');
  const [formObservacoes, setFormObservacoes] = useState('');
  const [formLinkAula, setFormLinkAula] = useState('');
  const [formPdfFile, setFormPdfFile] = useState<File | null>(null);
  const [formExistingPdf, setFormExistingPdf] = useState<AulaMaterialPdf | undefined>(undefined);
  const [formStatus, setFormStatus] = useState<StatusAula>('nao_iniciada');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializa o formulário sempre que o modal for aberto ou mudar editingAula / defaultMateriaId
  useEffect(() => {
    if (!isOpen) return;

    setFormError(null);
    setIsSubmitting(false);

    if (editingAula) {
      setFormMateriaId(editingAula.materiaId);
      setFormDisciplina(editingAula.disciplina);
      setFormProfessor(editingAula.professor || '');
      setFormData(editingAula.data);
      setFormDiaSemana(editingAula.diaSemana || getDiaSemanaFromData(editingAula.data));
      setFormHorario(editingAula.horario || '');
      setFormTitulo(editingAula.titulo);
      setFormConteudo(editingAula.conteudo || '');
      setFormObservacoes(editingAula.observacoes || '');
      setFormLinkAula(editingAula.linkAula || '');
      setFormPdfFile(null);
      setFormExistingPdf(editingAula.materialPdf);
      setFormStatus(editingAula.status || 'nao_iniciada');
    } else {
      const targetMateria =
        (defaultMateriaId && materias.find((m) => m.id === defaultMateriaId)) ||
        materias[0];
      const initialDate = new Date().toISOString().split('T')[0];

      setFormMateriaId(targetMateria?.id || defaultMateriaId || '');
      setFormDisciplina(targetMateria?.nome || 'Geral');
      setFormProfessor(targetMateria?.professor || '');
      setFormData(initialDate);
      setFormDiaSemana(getDiaSemanaFromData(initialDate));
      setFormHorario(targetMateria?.horario || '');
      setFormTitulo('');
      setFormConteudo('');
      setFormObservacoes('');
      setFormLinkAula('');
      setFormPdfFile(null);
      setFormExistingPdf(undefined);
      setFormStatus('nao_iniciada');
    }
  }, [isOpen, editingAula, defaultMateriaId, materias]);

  const handleMateriaChange = (materiaId: string) => {
    setFormMateriaId(materiaId);
    const selected = materias.find((m) => m.id === materiaId);
    if (selected) {
      setFormDisciplina(selected.nome);
      setFormProfessor(selected.professor || '');
      setFormHorario(selected.horario || '');
    } else {
      setFormDisciplina('Geral');
      setFormProfessor('');
      setFormHorario('');
    }
  };

  const handleDataChange = (novaData: string) => {
    setFormData(novaData);
    setFormDiaSemana(getDiaSemanaFromData(novaData));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    let normalizedLink = '';
    if (formLinkAula.trim()) {
      const urlValidation = validateAndNormalizeUrl(formLinkAula);
      if (!urlValidation.isValid) {
        setFormError(urlValidation.error || 'Formato de link inválido.');
        return;
      }
      normalizedLink = urlValidation.normalizedUrl;
    }

    setIsSubmitting(true);

    try {
      let finalMaterialPdf: AulaMaterialPdf | undefined = formExistingPdf;

      if (formPdfFile) {
        const storageId = `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        finalMaterialPdf = await savePdfToStorage(storageId, formPdfFile);
      }

      if (editingAula) {
        updateAula(editingAula.id, {
          materiaId: formMateriaId,
          disciplina: formDisciplina,
          professor: formProfessor.trim(),
          data: formData,
          diaSemana: formDiaSemana || getDiaSemanaFromData(formData),
          horario: formHorario.trim(),
          titulo: formTitulo.trim(),
          conteudo: formConteudo.trim(),
          observacoes: formObservacoes.trim(),
          materialPdf: finalMaterialPdf,
          linkAula: normalizedLink || undefined,
          status: formStatus,
        });
      } else {
        const novaAula = addAula({
          materiaId: formMateriaId,
          disciplina: formDisciplina,
          professor: formProfessor.trim(),
          data: formData,
          diaSemana: formDiaSemana || getDiaSemanaFromData(formData),
          horario: formHorario.trim(),
          titulo: formTitulo.trim(),
          conteudo: formConteudo.trim(),
          observacoes: formObservacoes.trim(),
          materialPdf: finalMaterialPdf,
          linkAula: normalizedLink || undefined,
          status: formStatus,
        });
        if (onSaved) {
          onSaved(novaAula);
        }
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Erro ao salvar os dados da aula.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingAula ? 'Editar Registro de Aula' : 'Cadastrar Nova Aula'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-start gap-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-2xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Matéria *
            </label>
            <select
              required
              value={formMateriaId}
              onChange={(e) => handleMateriaChange(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              {materias.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-2xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Professor
            </label>
            <input
              type="text"
              value={formProfessor}
              onChange={(e) => setFormProfessor(e.target.value)}
              placeholder="Nome do docente..."
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-2xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Data *
            </label>
            <input
              type="date"
              required
              value={formData}
              onChange={(e) => handleDataChange(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div>
            <label className="block text-2xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Dia da Semana
            </label>
            <input
              type="text"
              readOnly
              value={formDiaSemana}
              className="w-full px-3 py-2 bg-stone-100 border border-stone-200 rounded-lg text-stone-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-2xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Horário
            </label>
            <input
              type="text"
              value={formHorario}
              onChange={(e) => setFormHorario(e.target.value)}
              placeholder="Ex: 08:00 - 10:00"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-2xs font-bold text-stone-700 uppercase tracking-wider mb-1">
            Título da Aula *
          </label>
          <input
            type="text"
            required
            value={formTitulo}
            onChange={(e) => setFormTitulo(e.target.value)}
            placeholder="Ex: Teoria Geral do Fato Jurídico"
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div>
          <label className="block text-2xs font-bold text-stone-700 uppercase tracking-wider mb-1">
            Conteúdo Estudado *
          </label>
          <textarea
            required
            rows={4}
            value={formConteudo}
            onChange={(e) => setFormConteudo(e.target.value)}
            placeholder="Descreva o conteúdo abordado, artigos analisados..."
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div>
          <label className="block text-2xs font-bold text-stone-700 uppercase tracking-wider mb-1">
            Observações
          </label>
          <textarea
            rows={2}
            value={formObservacoes}
            onChange={(e) => setFormObservacoes(e.target.value)}
            placeholder="Leituras sugeridas, avisos de prova..."
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        {/* Anexo de PDF no formulário */}
        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
          <label className="block text-2xs font-bold text-stone-700 uppercase tracking-wider">
            Material em PDF (opcional)
          </label>
          {formExistingPdf && !formPdfFile && (
            <div className="flex items-center justify-between p-2 bg-white rounded border border-stone-200">
              <span className="text-stone-800 font-medium truncate">{formExistingPdf.nome}</span>
              <button
                type="button"
                onClick={() => setFormExistingPdf(undefined)}
                className="text-rose-600 hover:text-rose-800 font-semibold"
              >
                Remover
              </button>
            </div>
          )}
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setFormPdfFile(f);
            }}
            className="block w-full text-stone-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
          />
        </div>

        {/* Link da aula no formulário */}
        <div>
          <label className="block text-2xs font-bold text-stone-700 uppercase tracking-wider mb-1">
            Link da Aula ou Vídeo (opcional)
          </label>
          <input
            type="text"
            value={formLinkAula}
            onChange={(e) => setFormLinkAula(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg font-medium transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg font-semibold shadow-xs transition cursor-pointer"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Aula'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
