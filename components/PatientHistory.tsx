import React, { useState } from 'react';
import { PatientRecord } from '../types';
import { Calendar, Trash2, Eye, Key, RefreshCcw, Search } from 'lucide-react';

interface Props {
  history: PatientRecord[];
  onLoad: (record: PatientRecord) => void;
  onDelete: (id: string) => void;
  onFollowUp: (record: PatientRecord) => void;
}

const PatientHistory: React.FC<Props> = ({ history, onLoad, onDelete, onFollowUp }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredHistory = history.filter(record => {
    const term = searchTerm.toLowerCase();
    const nameMatch = record.profile.name.toLowerCase().includes(term);
    const codeMatch = record.accessCode.includes(term);
    return nameMatch || codeMatch;
  });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors">
      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <Calendar className="w-5 h-5" /> Histórico de Atendimentos
        </h2>
        
        <div className="relative w-full md:w-64">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
           </div>
           <input
             type="text"
             className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition duration-150 ease-in-out"
             placeholder="Buscar nome ou código..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </div>
      
      {filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-slate-50 dark:bg-slate-700 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
               <Search className="w-6 h-6 text-slate-300 dark:text-slate-500" />
            </div>
            <p className="text-slate-500 dark:text-slate-400">
                {searchTerm ? 'Nenhum paciente encontrado para essa busca.' : 'Nenhum atendimento salvo.'}
            </p>
          </div>
      ) : (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium">
                <tr>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Paciente</th>
                <th className="px-6 py-3">Acesso</th>
                <th className="px-6 py-3">Objetivo</th>
                <th className="px-6 py-3 text-right">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredHistory.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                    {formatDate(record.date)}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-xs shrink-0">
                        {record.profile.name.charAt(0).toUpperCase()}
                    </div>
                    {record.profile.name}
                    </td>
                    <td className="px-6 py-4">
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded w-fit border border-slate-200 dark:border-slate-600">
                        <Key className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{record.accessCode}</span>
                    </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    {record.profile.goal === 'loss' && 'Emagrecimento'}
                    {record.profile.goal === 'gain' && 'Hipertrofia'}
                    {record.profile.goal === 'maintenance' && 'Manutenção'}
                    {record.profile.goal === 'performance' && 'Performance'}
                    </td>
                    <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                        <button 
                        onClick={() => onFollowUp(record)}
                        className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                        title="Novo Atendimento (Retorno)"
                        >
                        <RefreshCcw className="w-4 h-4" />
                        </button>
                        <button 
                        onClick={() => onLoad(record)}
                        className="p-2 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-lg transition-colors"
                        title="Ver Atendimento"
                        >
                        <Eye className="w-4 h-4" />
                        </button>
                        <button 
                        onClick={() => onDelete(record.id)}
                        className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Excluir Registro"
                        >
                        <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      )}
    </div>
  );
};

export default PatientHistory;