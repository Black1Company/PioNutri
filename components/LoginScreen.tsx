import React, { useState } from 'react';
import { Lock, User, ArrowRight } from 'lucide-react';
import { getPatientByCode } from '../services/storage';
import { PatientRecord } from '../types';

interface Props {
  targetMode: 'professional' | 'patient';
  onLoginSuccess: () => void;
  onPatientLogin?: (record: PatientRecord) => void;
  onCancel: () => void;
}

const LoginScreen: React.FC<Props> = ({ targetMode, onLoginSuccess, onPatientLogin, onCancel }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (targetMode === 'professional') {
      // Senha atualizada conforme solicitação
      if (password === '21102222') {
        onLoginSuccess();
      } else {
        setError('Senha incorreta.');
      }
    } else {
      // Validação do paciente pelo código
      const record = getPatientByCode(password.trim());
      
      if (record) {
        if (onPatientLogin) {
            onPatientLogin(record);
        }
        onLoginSuccess();
      } else {
        setError('Código de acesso inválido ou não encontrado.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 transition-colors">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 dark:border-slate-700 animate-fade-in-up">
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${targetMode === 'professional' ? 'bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-400' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400'}`}>
            {targetMode === 'professional' ? <Lock className="w-8 h-8" /> : <User className="w-8 h-8" />}
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            {targetMode === 'professional' ? 'Acesso Profissional' : 'Acesso do Paciente'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {targetMode === 'professional' 
              ? 'Insira suas credenciais de nutricionista.' 
              : 'Insira o código de 6 dígitos fornecido pelo seu nutri.'}
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {targetMode === 'professional' ? 'Senha' : 'Código de Acesso'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              placeholder={targetMode === 'professional' ? '••••••••' : 'Ex: 123456'}
              autoFocus
            />
            {error && <p className="text-red-500 dark:text-red-400 text-sm mt-2">{error}</p>}
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              className={`w-full py-3 rounded-lg text-white font-semibold shadow-md transition-all flex items-center justify-center gap-2 ${
                targetMode === 'professional' 
                  ? 'bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500' 
                  : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500'
              }`}
            >
              Entrar <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-3 rounded-lg text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;