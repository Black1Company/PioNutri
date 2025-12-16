import React from 'react';
import { PatientProfile, NutritionalStats } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Flame, Activity, TrendingUp, CheckCircle, FileText, Save, Scale, Ruler, Percent, HeartPulse } from 'lucide-react';

interface Props {
  profile: PatientProfile;
  stats: NutritionalStats;
  onGeneratePlan: () => void;
  isGeneratingPlan: boolean;
  onSave: () => void;
}

const Dashboard: React.FC<Props> = ({ profile, stats, onGeneratePlan, isGeneratingPlan, onSave }) => {
  const data = [
    { name: 'Proteínas', value: stats.macros.protein, color: '#14b8a6' }, // Teal
    { name: 'Carboidratos', value: stats.macros.carbs, color: '#f59e0b' }, // Amber
    { name: 'Gorduras', value: stats.macros.fats, color: '#ef4444' }, // Red
  ];

  // Cálculos Automáticos
  const heightInMeters = profile.height / 100;
  const bmi = (profile.weight / (heightInMeters * heightInMeters)).toFixed(1);
  
  let bmiStatus = '';
  if (Number(bmi) < 18.5) bmiStatus = 'Abaixo do peso';
  else if (Number(bmi) < 24.9) bmiStatus = 'Peso normal';
  else if (Number(bmi) < 29.9) bmiStatus = 'Sobrepeso';
  else bmiStatus = 'Obesidade';

  const whr = (profile.waist && profile.hips) 
    ? (profile.waist / profile.hips).toFixed(2) 
    : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-teal-800 dark:bg-teal-900 text-white p-6 rounded-2xl shadow-lg transition-colors">
        <div>
          <h2 className="text-3xl font-bold">Olá, Diogenes!</h2>
          <p className="opacity-90 mt-1">Análise concluída para o paciente <span className="font-semibold text-teal-200">{profile.name}</span></p>
        </div>
        <div className="flex gap-4 mt-4 md:mt-0">
          <button 
            onClick={onSave}
            className="flex items-center gap-2 bg-teal-700 hover:bg-teal-600 dark:bg-teal-800 dark:hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors border border-teal-500 shadow-sm"
          >
            <Save className="w-4 h-4" /> Salvar Atendimento
          </button>
          <div className="bg-teal-900/50 px-4 py-2 rounded-lg border border-teal-600">
            <p className="text-xs text-teal-200 uppercase tracking-wide">Meta Calórica</p>
            <p className="text-2xl font-bold">{stats.caloriesTarget} <span className="text-sm font-normal">kcal</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card Antropometria (Novo) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 lg:col-span-2 transition-colors">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> Avaliação Corporal
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">IMC</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-white">{bmi}</p>
                    <p className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-300">{bmiStatus}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
                     <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Peso Ideal Est.</p>
                     <p className="text-xl font-bold text-slate-800 dark:text-white">{(22 * heightInMeters * heightInMeters).toFixed(1)} <span className="text-sm font-normal">kg</span></p>
                </div>
                {profile.bodyFat ? (
                    <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Percent className="w-3 h-3"/> Gordura</p>
                        <p className="text-xl font-bold text-slate-800 dark:text-white">{profile.bodyFat}%</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Bioimpedância</p>
                    </div>
                ) : (
                    <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg opacity-50">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Gordura</p>
                        <p className="text-sm dark:text-white">N/A</p>
                    </div>
                )}
                 {whr ? (
                    <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><HeartPulse className="w-3 h-3"/> RCQ</p>
                        <p className="text-xl font-bold text-slate-800 dark:text-white">{whr}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Risco Metab.</p>
                    </div>
                ) : (
                    <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg opacity-50">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">RCQ</p>
                        <p className="text-sm dark:text-white">N/A</p>
                    </div>
                )}
            </div>
            
            {/* Medidas Detalhadas */}
            {(profile.waist || profile.hips || profile.arm || profile.muscleMass) && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {profile.waist && <div><span className="text-slate-500 dark:text-slate-400">Cintura:</span> <span className="font-semibold dark:text-slate-200">{profile.waist} cm</span></div>}
                    {profile.hips && <div><span className="text-slate-500 dark:text-slate-400">Quadril:</span> <span className="font-semibold dark:text-slate-200">{profile.hips} cm</span></div>}
                    {profile.arm && <div><span className="text-slate-500 dark:text-slate-400">Braço:</span> <span className="font-semibold dark:text-slate-200">{profile.arm} cm</span></div>}
                    {profile.muscleMass && <div><span className="text-slate-500 dark:text-slate-400">Massa Musc.:</span> <span className="font-semibold dark:text-slate-200">{profile.muscleMass}%</span></div>}
                </div>
            )}
        </div>

        {/* Card Energético */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" /> Balanço
          </h3>
          <div className="space-y-4">
             <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 text-sm">TMB</span>
                <span className="font-semibold text-slate-800 dark:text-white">{stats.bmr}</span>
             </div>
             <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 text-sm">TDEE</span>
                <span className="font-semibold text-slate-800 dark:text-white">{stats.tdee}</span>
             </div>
             <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-100 dark:border-orange-800/50">
                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-1">Déficit/Superávit</p>
                <p className="text-lg font-bold text-orange-700 dark:text-orange-300">{stats.caloriesTarget - stats.tdee > 0 ? '+' : ''}{stats.caloriesTarget - stats.tdee} kcal</p>
             </div>
          </div>
        </div>

        {/* Card Macros */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
           <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-500" /> Macros
          </h3>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip 
                    formatter={(value: number) => `${value}g`} 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                />
                <Legend iconType="circle" wrapperStyle={{fontSize: '10px', color: '#94a3b8'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-1 text-center text-[10px] mt-2">
            <div className="bg-teal-50 dark:bg-teal-900/30 p-1 rounded text-teal-800 dark:text-teal-200">
               <span className="block font-bold text-xs">{stats.macros.protein}g</span>
               Prot
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/30 p-1 rounded text-amber-800 dark:text-amber-200">
               <span className="block font-bold text-xs">{stats.macros.carbs}g</span>
               Carb
            </div>
            <div className="bg-red-50 dark:bg-red-900/30 p-1 rounded text-red-800 dark:text-red-200">
               <span className="block font-bold text-xs">{stats.macros.fats}g</span>
               Gord
            </div>
          </div>
        </div>
      </div>

      {/* Card Recomendações (Full Width) */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> Análise Clínica & Estratégia
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 italic bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border-l-4 border-indigo-500">
            "{stats.analysis}"
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-3 border border-slate-100 dark:border-slate-700 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 dark:text-slate-300">{rec}</span>
              </div>
            ))}
          </div>
      </div>
      
      <div className="flex justify-center mt-8">
        <button 
          onClick={onGeneratePlan} 
          disabled={isGeneratingPlan}
          className={`flex items-center gap-2 px-8 py-4 rounded-full text-white font-bold text-lg shadow-xl transition-all ${isGeneratingPlan ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 dark:bg-indigo-500 dark:hover:bg-indigo-600'}`}
        >
           <FileText className="w-6 h-6" />
           {isGeneratingPlan ? 'Gerando Cardápio com IA...' : 'Gerar Plano Alimentar Sugerido'}
        </button>
      </div>
    </div>
  );
};

export default Dashboard;