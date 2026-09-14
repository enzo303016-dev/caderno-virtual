import React, { useState } from 'react';
import {
  Settings,
  User,
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ConfiguracoesView: React.FC = () => {
  const {
    perfil,
    updatePerfil,
    exportarDadosJson,
    importarDadosJson,
    resetarDadosParaPadrao,
    materias,
    aulas,
    anotacoes,
    eventos,
    metas,
  } = useApp();

  const [formPerfil, setFormPerfil] = useState({
    nome: perfil.nome,
    semestreAtual: perfil.semestreAtual,
    instituicao: perfil.instituicao,
    turno: perfil.turno,
    metaHorasSemanais: perfil.metaHorasSemanais,
  });

  const [jsonInput, setJsonInput] = useState('');
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  const handleSalvarPerfil = (e: React.FormEvent) => {
    e.preventDefault();
    updatePerfil(formPerfil);
    setMensagemSucesso('Dados do perfil atualizados com sucesso!');
    setTimeout(() => setMensagemSucesso(null), 3000);
  };

  const handleExportar = () => {
    const jsonStr = exportarDadosJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `caderno-virtual-direito-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMensagemSucesso('Backup baixado com sucesso!');
    setTimeout(() => setMensagemSucesso(null), 3000);
  };

  const handleImportar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsonInput.trim()) {
      setMensagemErro('Por favor, cole o código JSON do backup.');
      return;
    }
    const sucesso = importarDadosJson(jsonInput);
    if (sucesso) {
      setMensagemSucesso('Dados restaurados com sucesso a partir do backup!');
      setJsonInput('');
      setTimeout(() => setMensagemSucesso(null), 3000);
    } else {
      setMensagemErro('Arquivo ou formato JSON inválido. Verifique o conteúdo.');
      setTimeout(() => setMensagemErro(null), 4000);
    }
  };

  const handleRestaurarPadrao = () => {
    if (
      window.confirm(
        'Tem certeza que deseja redefinir o caderno? Todos os dados cadastrados serão apagados e o caderno voltará ao estado inicial vazio.'
      )
    ) {
      resetarDadosParaPadrao();
      setMensagemSucesso('Caderno redefinido para o estado inicial vazio com sucesso!');
      setTimeout(() => setMensagemSucesso(null), 3000);
    }
  };

  return (
    <div id="configuracoes-view" className="space-y-6 animate-in fade-in duration-300 max-w-5xl">
      {/* Notifications */}
      {mensagemSucesso && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {mensagemErro && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>{mensagemErro}</span>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-serif font-bold text-stone-900">
          Configurações do Caderno
        </h1>
        <p className="text-xs text-stone-500">
          Gerenciamento do perfil acadêmico, persistência dos dados e controle de backups
        </p>
      </div>

      {/* 1. Perfil Acadêmico */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-base text-stone-900">
              Perfil do Estudante
            </h2>
            <p className="text-xs text-stone-500">
              Identificação do estudante e do semestre letivo em andamento
            </p>
          </div>
        </div>

        <form onSubmit={handleSalvarPerfil} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Nome do Usuário / Estudante
              </label>
              <input
                type="text"
                required
                value={formPerfil.nome}
                onChange={(e) =>
                  setFormPerfil({ ...formPerfil, nome: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Semestre Atual
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 5º Semestre, 1º Semestre..."
                value={formPerfil.semestreAtual}
                onChange={(e) =>
                  setFormPerfil({ ...formPerfil, semestreAtual: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Instituição de Ensino
              </label>
              <input
                type="text"
                value={formPerfil.instituicao}
                onChange={(e) =>
                  setFormPerfil({ ...formPerfil, instituicao: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Turno
              </label>
              <select
                value={formPerfil.turno}
                onChange={(e) =>
                  setFormPerfil({
                    ...formPerfil,
                    turno: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
              >
                <option value="Tarde">Tarde</option>
                <option value="Matutino">Matutino</option>
                <option value="Vespertino">Vespertino</option>
                <option value="Noturno">Noturno</option>
                <option value="Integral">Integral</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Meta Geral Semanal (Horas)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={formPerfil.metaHorasSemanais}
                onChange={(e) =>
                  setFormPerfil({
                    ...formPerfil,
                    metaHorasSemanais: parseInt(e.target.value) || 10,
                  })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs shadow-xs transition"
            >
              Salvar Alterações do Perfil
            </button>
          </div>
        </form>
      </div>

      {/* 2. Estrutura e Armazenamento dos Dados */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-base text-stone-900">
              Estrutura de Dados & Armazenamento Local
            </h2>
            <p className="text-xs text-stone-500">
              Como suas matérias, aulas, anotações e cronogramas ficam salvos
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
            <div className="text-lg font-bold text-stone-900 font-serif">
              {materias.length}
            </div>
            <div className="text-[11px] text-stone-500">Matérias</div>
          </div>
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
            <div className="text-lg font-bold text-stone-900 font-serif">
              {aulas.length}
            </div>
            <div className="text-[11px] text-stone-500">Aulas</div>
          </div>
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
            <div className="text-lg font-bold text-stone-900 font-serif">
              {anotacoes.length}
            </div>
            <div className="text-[11px] text-stone-500">Anotações</div>
          </div>
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
            <div className="text-lg font-bold text-stone-900 font-serif">
              {eventos.length}
            </div>
            <div className="text-[11px] text-stone-500">Eventos/Prazos</div>
          </div>
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 col-span-2 sm:col-span-1">
            <div className="text-lg font-bold text-stone-900 font-serif">
              {metas.length}
            </div>
            <div className="text-[11px] text-stone-500">Metas Ativas</div>
          </div>
        </div>

        <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 text-xs text-stone-600 space-y-2 leading-relaxed">
          <p className="font-semibold text-stone-800">
            Armazenamento Seguro no Navegador (LocalStorage):
          </p>
          <p>
            Todos os dados são persistidos localmente no seu dispositivo utilizando a
            Web Storage API sob chaves padronizadas (<code>caderno_direito_*</code>),
            garantindo privacidade total e funcionamento instantâneo mesmo sem conexão
            ou servidores externos.
          </p>
        </div>

        {/* Backup & Import Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Export */}
          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-3">
            <h3 className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
              <Download className="w-4 h-4 text-amber-700" />
              <span>Exportar Backup dos Dados</span>
            </h3>
            <p className="text-[11px] text-stone-500">
              Gera um arquivo <code>.json</code> completo com todas as matérias, anotações,
              aulas e datas cadastradas para você guardar ou transferir.
            </p>
            <button
              type="button"
              onClick={handleExportar}
              className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Arquivo JSON de Backup</span>
            </button>
          </div>

          {/* Reset */}
          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-3">
            <h3 className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-stone-600" />
              <span>Restaurar Dados Originais</span>
            </h3>
            <p className="text-[11px] text-stone-500">
              Restaura a base modelo com matérias do 5º Semestre de Direito (Constitucional II,
              Civil III, Penal II, Processual Civil e Administrativo).
            </p>
            <button
              type="button"
              onClick={handleRestaurarPadrao}
              className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 border border-stone-300 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Exemplo Padrão</span>
            </button>
          </div>
        </div>

        {/* Restore from JSON Box */}
        <form onSubmit={handleImportar} className="space-y-2 pt-2 border-t border-stone-100">
          <label className="block font-semibold text-stone-700 text-xs">
            Importar Dados a partir de JSON
          </label>
          <textarea
            rows={3}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Cole aqui o conteúdo do seu arquivo de backup em formato JSON..."
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Carregar Dados do JSON</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. Princípios do Projeto */}
      <div className="bg-stone-900 text-stone-300 rounded-2xl p-6 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-amber-400 font-semibold font-serif text-sm">
          <ShieldCheck className="w-4 h-4" />
          <span>Caderno Virtual – Direito (Etapa 1: Estrutura Inicial)</span>
        </div>
        <p className="text-stone-400 leading-relaxed">
          Desenvolvido com foco em simplicidade, modularidade, conformidade estrita aos requisitos
          solicitados e sem custos ou dependências de serviços externos.
        </p>
      </div>
    </div>
  );
};
