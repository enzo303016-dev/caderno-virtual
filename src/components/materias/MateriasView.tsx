import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  User,
  Clock,
  MapPin,
  Calendar,
  Layers,
  Search,
  Check,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Materia, DiaSemana } from '../../types';
import { Modal } from '../common/Modal';
import { getDisciplinaEstatisticas } from '../../utils/estudoTracking';

const DIAS_SEMANA: DiaSemana[] = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

const CORES_PALETA = [
  '#1d4ed8', // Azul royal
  '#0f766e', // Teal / Verde petróleo
  '#b91c1c', // Carmim / Vermelho
  '#d97706', // Âmbar / Ouro
  '#7c3aed', // Roxo / Púrpura
  '#059669', // Esmeralda
  '#475569', // Ardósia
  '#c2410c', // Terracota
];


const MateriaDetalheView: React.FC<{ materiaId: string }> = ({ materiaId }) => {
  const { materias, aulas, setSelectedMateriaId, setSelectedAulaIdToView, setActiveSection } = useApp();
  const materia = materias.find(m => m.id === materiaId);

  if (!materia) {
    return (
      <div className="text-center py-12">
        <p className="text-stone-500">Matéria não encontrada.</p>
        <button onClick={() => setSelectedMateriaId(null)} className="mt-4 text-amber-600 hover:underline">Voltar</button>
      </div>
    );
  }

  const aulasDaMateria = aulas.filter(a => a.materiaId === materia.id).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSelectedMateriaId(null)}
          className="p-2 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition"
        >
          <ArrowLeft className="w-4 h-4 text-stone-600" />
        </button>
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">{materia.nome}</h1>
          <p className="text-xs text-stone-500 flex items-center gap-2 mt-1">
            <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {materia.professor || 'Sem professor'}</span>
            <span>&bull;</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {materia.diaSemana}, {materia.horario}</span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-5">
        <h2 className="text-lg font-serif font-bold text-stone-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-600" />
          Aulas da Disciplina
        </h2>

        {aulasDaMateria.length === 0 ? (
          <div className="text-center py-12 text-stone-400 text-xs">
            Nenhuma aula cadastrada nesta matéria.
          </div>
        ) : (
          <div className="space-y-3">
            {aulasDaMateria.map(aula => (
              <div 
                key={aula.id}
                onClick={() => {
                  setSelectedAulaIdToView(aula.id);
                  setActiveSection('aulas');
                }}
                className="flex items-center justify-between p-4 rounded-xl border border-stone-100 hover:border-amber-200 hover:bg-amber-50/30 cursor-pointer transition group"
              >
                <div>
                  <h3 className="font-semibold text-stone-800 group-hover:text-amber-800 transition">{aula.titulo}</h3>
                  <div className="text-xs text-stone-500 flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(aula.data).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <div className="text-stone-300 group-hover:text-amber-600 transition">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const MateriasView: React.FC = () => {
  const { 
    materias, addMateria, updateMateria, deleteMateria, aulas, anotacoes, perfil,
    selectedMateriaId, setSelectedMateriaId, setSelectedAulaIdToView, setActiveSection 
  } = useApp();

  const [busca, setBusca] = useState('');
  const [diaFiltro, setDiaFiltro] = useState<string>('todos');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMateriaId, setEditingMateriaId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<Materia, 'id'>>({
    nome: '',
    professor: '',
    semestre: perfil.semestreAtual,
    diaSemana: 'Segunda-feira',
    horario: '19:00 - 22:15',
    sala: 'Sala 101',
    cor: '#1d4ed8',
    descricao: '',
  });

  const handleOpenAdd = () => {
    setEditingMateriaId(null);
    setFormData({
      nome: '',
      professor: '',
      semestre: perfil.semestreAtual || '3º semestre',
      diaSemana: 'Segunda-feira',
      horario: '14:00 - 16:50',
      sala: '',
      cor: CORES_PALETA[materias.length % CORES_PALETA.length],
      descricao: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: Materia) => {
    setEditingMateriaId(m.id);
    setFormData({
      nome: m.nome,
      professor: m.professor,
      semestre: m.semestre,
      diaSemana: m.diaSemana,
      horario: m.horario,
      sala: m.sala,
      cor: m.cor,
      descricao: m.descricao,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja remover a matéria "${nome}"?`)) {
      deleteMateria(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMateriaId) {
      updateMateria(editingMateriaId, formData);
    } else {
      addMateria(formData);
    }
    setIsModalOpen(false);
  };

  const materiasFiltradas = materias.filter((m) => {
    const matchBusca =
      m.nome.toLowerCase().includes(busca.toLowerCase()) ||
      m.professor.toLowerCase().includes(busca.toLowerCase()) ||
      m.sala.toLowerCase().includes(busca.toLowerCase());
    const matchDia = diaFiltro === 'todos' || m.diaSemana === diaFiltro;
    return matchBusca && matchDia;
  });

  if (selectedMateriaId) {
    return <MateriaDetalheView materiaId={selectedMateriaId} />;
  }

  return (
    <div id="materias-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">
            Matérias Cadastradas
          </h1>
          <p className="text-xs text-stone-500">
            Gerenciamento completo das disciplinas, docentes e horários de aula
          </p>
        </div>

        <button
          id="btn-nova-materia"
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Matéria</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Buscar por nome da matéria, professor ou sala..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={diaFiltro}
            onChange={(e) => setDiaFiltro(e.target.value)}
            className="w-full md:w-48 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="todos">Todos os Dias</option>
            {DIAS_SEMANA.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Materias */}
      {materias.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-stone-300 p-12 text-center">
          <BookOpen className="w-8 h-8 text-stone-400 mx-auto mb-2" />
          <h3 className="font-serif font-bold text-stone-800 text-sm">
            Nenhuma matéria cadastrada
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            Clique em "Cadastrar Matéria" para adicionar sua primeira disciplina.
          </p>
        </div>
      ) : materiasFiltradas.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-stone-300 p-12 text-center">
          <BookOpen className="w-8 h-8 text-stone-400 mx-auto mb-2" />
          <h3 className="font-serif font-bold text-stone-800 text-sm">
            Nenhuma matéria encontrada
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            Tente outro termo na busca ou cadastre uma nova disciplina.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
          {materiasFiltradas.map((materia) => {
            const totalAulas = aulas.filter((a) => a.materiaId === materia.id).length;
            const stats = getDisciplinaEstatisticas(materia.id, aulas);

            return (
              <div
                key={materia.id}
                id={`card-materia-${materia.id}`}
                onClick={() => setSelectedMateriaId(materia.id)}
                className="bg-white rounded-xl border border-stone-200/90 shadow-xs hover:shadow-md hover:border-amber-300/80 transition-all overflow-hidden flex flex-col justify-between cursor-pointer group"
              >
                {/* Visual Header Strip with Subject Accent Color */}
                <div
                  className="h-1.5 w-full"
                  style={{ backgroundColor: materia.cor || '#d97706' }}
                />

                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  {/* Subject Title & Actions */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-semibold text-stone-600 bg-stone-100 border border-stone-200/60 px-2 py-0.5 rounded truncate">
                          {materia.semestre}
                        </span>
                        {materia.sala && (
                          <span className="text-[10px] font-medium text-stone-500 bg-stone-50 border border-stone-200/50 px-1.5 py-0.5 rounded truncate">
                            Sala {materia.sala}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(materia);
                          }}
                          className="p-1 text-stone-400 hover:text-amber-700 hover:bg-stone-100 rounded transition"
                          title="Editar matéria"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(materia.id, materia.nome);
                          }}
                          className="p-1 text-stone-400 hover:text-rose-600 hover:bg-stone-100 rounded transition"
                          title="Excluir matéria"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base font-bold font-serif text-stone-900 group-hover:text-amber-800 transition-colors line-clamp-1 leading-snug">
                      {materia.nome}
                    </h3>

                    {/* Meta info: Professor, Dia, Horário */}
                    <div className="space-y-1 text-xs text-stone-600 pt-0.5">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className={materia.professor ? 'font-medium text-stone-800 truncate' : 'text-stone-400 italic'}>
                          {materia.professor ? `Prof. ${materia.professor}` : 'Professor a definir'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-stone-600 gap-2 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate">{materia.diaSemana}</span>
                        </div>
                        {materia.horario && (
                          <div className="flex items-center gap-1 text-stone-500 font-mono text-[11px] shrink-0">
                            <Clock className="w-3 h-3 text-stone-400" />
                            <span>{materia.horario}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress & Class Count */}
                  <div className="space-y-2.5 pt-2 border-t border-stone-100">
                    <div className="bg-stone-50/80 p-2.5 rounded-lg border border-stone-200/60 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-700 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                          <span>{totalAulas} {totalAulas === 1 ? 'aula' : 'aulas'}</span>
                        </span>
                        <span className="font-bold text-amber-800 font-mono text-2xs">
                          {stats.progressoGeralPercent}%
                        </span>
                      </div>

                      <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            stats.progressoGeralPercent === 100 ? 'bg-emerald-600' : 'bg-amber-600'
                          }`}
                          style={{ width: `${stats.progressoGeralPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMateriaId(materia.id);
                      }}
                      className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-600 text-amber-900 hover:text-white border border-amber-200/80 hover:border-amber-600 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-600"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Abrir matéria</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Adicionar / Editar Matéria */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMateriaId ? 'Editar Matéria' : 'Cadastrar Nova Matéria'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Nome da Disciplina *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Direito Constitucional II, Direito Civil III..."
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Professor(a) *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Dra. Helena Vasconcelos"
                value={formData.professor}
                onChange={(e) =>
                  setFormData({ ...formData, professor: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Semestre
              </label>
              <input
                type="text"
                value={formData.semestre}
                onChange={(e) =>
                  setFormData({ ...formData, semestre: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Dia da Semana
              </label>
              <select
                value={formData.diaSemana}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    diaSemana: e.target.value as DiaSemana,
                  })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
              >
                {DIAS_SEMANA.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Horário
              </label>
              <input
                type="text"
                placeholder="19:00 - 22:15"
                value={formData.horario}
                onChange={(e) =>
                  setFormData({ ...formData, horario: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Sala / Bloco
              </label>
              <input
                type="text"
                placeholder="Auditório / Sala 302"
                value={formData.sala}
                onChange={(e) =>
                  setFormData({ ...formData, sala: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Cor de Identificação
            </label>
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {CORES_PALETA.map((cor) => (
                <button
                  type="button"
                  key={cor}
                  onClick={() => setFormData({ ...formData, cor })}
                  className="w-7 h-7 rounded-full transition-transform flex items-center justify-center border border-white shadow-xs"
                  style={{ backgroundColor: cor }}
                >
                  {formData.cor === cor && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Descrição / Ementa Resumida
            </label>
            <textarea
              rows={3}
              placeholder="Principais temas abordados na disciplina, tópicos de estudo..."
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg font-medium text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs shadow-xs"
            >
              {editingMateriaId ? 'Salvar Alterações' : 'Cadastrar Matéria'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
