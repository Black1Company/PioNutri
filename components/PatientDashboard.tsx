import React, { useState, useEffect } from 'react';
import { PatientRecord } from '../types';
import MealPlanDisplay from './MealPlanDisplay';
import { Leaf, Droplets, Trophy, Target, Calendar, ShoppingCart, CheckCircle, Loader2, X, Scale, Ruler, Activity, TrendingUp } from 'lucide-react';
import { savePatientProgress, getPatientProgress, getPatientHistory } from '../services/storage';
import { generateShoppingList } from '../services/gemini';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
  record: PatientRecord;
}

const PatientDashboard: React.FC<Props> = ({ record }) => {
  const { profile, stats, plan, date } = record;
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [shoppingListText, setShoppingListText] = useState('');
  const [isGeneratingList, setIsGeneratingList] = useState(false);
  
  // Chart State
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [chartMetric, setChartMetric] = useState<'weight' | 'composition' | 'measurements'>('weight');

  useEffect(() => {
    // Load progress when component mounts or record changes
    setCheckedItems(getPatientProgress(record.id));

    // Load History Data for Chart
    const allRecords = getPatientHistory();
    // Filter records that belong to the same patient (using accessCode as identifier)
    // and sort chronologically
    const patientHistory = allRecords
      .filter(r => r.accessCode === record.accessCode)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(r => ({
        date: new Date(r.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        fullDate: new Date(r.date).toLocaleDateString('pt-BR'),
        weight: r.profile.weight,
        bodyFat: r.profile.bodyFat || null,
        muscleMass: r.profile.muscleMass || null,
        waist: r.profile.waist || null,
        hips: r.profile.hips || null,
        arm: r.profile.arm || null,
      }));
    
    setHistoryData(patientHistory);
  }, [record.id, record.accessCode]);

  const handleToggleItem = (itemId: string) => {
    setCheckedItems(prev => {
        const newItems = prev.includes(itemId) 
            ? prev.filter(id => id !== itemId) 
            : [...prev, itemId];
        
        savePatientProgress(record.id, newItems);
        return newItems;
    });
  };

  const handleGenerateShoppingList = async () => {
    if (!plan) return;
    setShowShoppingList(true);
    if (shoppingListText) return; // Already generated

    setIsGeneratingList(true);
    try {
        const list = await generateShoppingList(plan);
        setShoppingListText(list);
    } catch (error) {
        setShoppingListText("Não foi possível gerar a lista no momento.");
    } finally {
        setIsGeneratingList(false);
    }
  };

  // Meta de água aproximada (35ml por kg) se não tiver no stats
  const waterTarget = Math.round(profile.weight * 35);
  
  // Calculate Progress
  const totalItems = plan ? plan.meals.reduce((acc, meal) => acc + meal.items.length, 0) : 0;
  const completedCount = checkedItems.length;
  const progressPercentage = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  return (
    <div className="animate-fade-in space-y-8 relative">
      
      {/* Shopping List Modal */}
      {showShoppingList && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl animate-fade-in-up">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-teal-600 text-white rounded-t-2xl">
                    <h3 className="font-bold flex items-center gap-2"><ShoppingCart className="w-5 h-5"/> Lista de Compras</h3>
                    <button onClick={() => setShowShoppingList(false)} className="hover:bg-white/20 p-1 rounded-full"><X className="w-5 h-5"/></button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {isGeneratingList ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <Loader2 className="w-8 h-8 animate-spin mb-2 text-teal-500" />
                            <p>Organizando itens...</p>
                        </div>
                    ) : (
                        <div className="prose prose-sm prose-teal dark:prose-invert max-w-none whitespace-pre-line">
                            {shoppingListText}
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-b-2xl flex justify-end">
                    <button onClick={() => setShowShoppingList(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition">Fechar</button>
                </div>
            </div>
        </div>
      )}

      {/* Header do Paciente */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-3xl p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              Olá, {profile.name}! <span className="text-2xl">👋</span>
            </h2>
            <p className="opacity-90 mt-2 text-indigo-100">
              Juntos rumo ao seu objetivo de <span className="font-semibold text-white">
                {profile.goal === 'loss' && 'Emagrecimento'}
                {profile.goal === 'gain' && 'Hipertrofia'}
                {profile.goal === 'maintenance' && 'Manutenção'}
                {profile.goal === 'performance' && 'Performance'}
              </span>.
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl border border-white/30 flex items-center gap-3">
             <div className="bg-white text-indigo-700 p-2 rounded-lg">
                <Calendar className="w-6 h-6" />
             </div>
             <div>
                <p className="text-xs uppercase tracking-wide opacity-80">Última Consulta</p>
                <p className="font-bold">{new Date(date).toLocaleDateString('pt-BR')}</p>
             </div>
          </div>
        </div>
      </div>

      {/* Grid de Metas e Dados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {/* Meta Calórica */}
         <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 transition-colors">
            <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-full text-orange-600 dark:text-orange-400">
               <Target className="w-6 h-6" />
            </div>
            <div>
               <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase">Meta Diária</p>
               <h3 className="text-xl font-bold text-slate-800 dark:text-white">{stats.caloriesTarget} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">kcal</span></h3>
            </div>
         </div>

         {/* Hidratação */}
         <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 transition-colors">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full text-blue-600 dark:text-blue-400">
               <Droplets className="w-6 h-6" />
            </div>
            <div>
               <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase">Hidratação</p>
               <h3 className="text-xl font-bold text-slate-800 dark:text-white">{(waterTarget / 1000).toFixed(1)} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">Litros</span></h3>
            </div>
         </div>

         {/* Adesão */}
         <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 transition-colors">
            <div className={`p-4 rounded-full ${progressPercentage > 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'}`}>
               <CheckCircle className="w-6 h-6" />
            </div>
            <div>
               <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase">Concluído</p>
               <h3 className="text-xl font-bold text-slate-800 dark:text-white">{progressPercentage}% <span className="text-sm font-normal text-slate-500 dark:text-slate-400">do dia</span></h3>
            </div>
         </div>

         {/* Medidas Recentes */}
         <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 transition-colors">
            <div className="bg-teal-100 dark:bg-teal-900/30 p-4 rounded-full text-teal-600 dark:text-teal-400">
               <Scale className="w-6 h-6" />
            </div>
            <div>
               <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase">Medidas</p>
               <div className="flex gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <span>{profile.weight}kg</span>
                  {profile.bodyFat && <span className="text-slate-400">| {profile.bodyFat}% Gord.</span>}
               </div>
            </div>
         </div>
      </div>
      
      {/* GRÁFICO DE EVOLUÇÃO */}
      {historyData.length > 0 && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors animate-fade-in">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                 <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-500" /> Sua Evolução
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Acompanhe seu progresso ao longo das consultas.</p>
                 </div>
                 <div className="bg-slate-100 dark:bg-slate-700 p-1 rounded-lg flex flex-wrap text-sm gap-1 sm:gap-0">
                    <button 
                        onClick={() => setChartMetric('weight')}
                        className={`px-3 sm:px-4 py-1.5 rounded-md transition-all font-medium ${chartMetric === 'weight' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                        Peso
                    </button>
                    <button 
                        onClick={() => setChartMetric('composition')}
                        className={`px-3 sm:px-4 py-1.5 rounded-md transition-all font-medium ${chartMetric === 'composition' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                        Composição
                    </button>
                    <button 
                        onClick={() => setChartMetric('measurements')}
                        className={`px-3 sm:px-4 py-1.5 rounded-md transition-all font-medium ${chartMetric === 'measurements' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                        Medidas (cm)
                    </button>
                 </div>
             </div>
             
             <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-20" />
                        <XAxis 
                            dataKey="date" 
                            stroke="#94a3b8" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                        />
                        <YAxis 
                            stroke="#94a3b8" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false}
                            domain={['auto', 'auto']}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'var(--tw-prose-invert-bg)', 
                                borderColor: 'var(--tw-prose-invert-hr)',
                                borderRadius: '0.75rem',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                            }}
                            itemStyle={{ fontSize: '0.875rem', fontWeight: 600 }}
                            labelStyle={{ marginBottom: '0.5rem', color: '#64748b' }}
                            formatter={(value: number, name: string) => {
                                const labels: Record<string, string> = { 
                                    weight: 'Peso', 
                                    bodyFat: 'Gordura', 
                                    muscleMass: 'Massa Muscular',
                                    waist: 'Cintura',
                                    hips: 'Quadril',
                                    arm: 'Braço'
                                };
                                const units: Record<string, string> = { 
                                    weight: 'kg', 
                                    bodyFat: '%', 
                                    muscleMass: '%',
                                    waist: 'cm',
                                    hips: 'cm',
                                    arm: 'cm'
                                };
                                return [`${value} ${units[name] || ''}`, labels[name] || name];
                            }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                        
                        {chartMetric === 'weight' && (
                            <Line 
                                type="monotone" 
                                dataKey="weight" 
                                name="weight"
                                stroke="#6366f1" 
                                strokeWidth={3} 
                                dot={{ fill: '#6366f1', r: 4, strokeWidth: 2, stroke: '#fff' }} 
                                activeDot={{ r: 6 }} 
                            />
                        )}
                        
                        {chartMetric === 'composition' && (
                            <>
                                <Line 
                                    type="monotone" 
                                    dataKey="bodyFat" 
                                    name="bodyFat"
                                    stroke="#ef4444" 
                                    strokeWidth={3} 
                                    dot={{ fill: '#ef4444', r: 4, strokeWidth: 2, stroke: '#fff' }} 
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="muscleMass" 
                                    name="muscleMass"
                                    stroke="#14b8a6" 
                                    strokeWidth={3} 
                                    dot={{ fill: '#14b8a6', r: 4, strokeWidth: 2, stroke: '#fff' }} 
                                />
                            </>
                        )}

                        {chartMetric === 'measurements' && (
                            <>
                                <Line 
                                    type="monotone" 
                                    dataKey="waist" 
                                    name="waist"
                                    stroke="#8b5cf6" 
                                    strokeWidth={3} 
                                    dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 2, stroke: '#fff' }} 
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="hips" 
                                    name="hips"
                                    stroke="#ec4899" 
                                    strokeWidth={3} 
                                    dot={{ fill: '#ec4899', r: 4, strokeWidth: 2, stroke: '#fff' }} 
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="arm" 
                                    name="arm"
                                    stroke="#0ea5e9" 
                                    strokeWidth={3} 
                                    dot={{ fill: '#0ea5e9', r: 4, strokeWidth: 2, stroke: '#fff' }} 
                                />
                            </>
                        )}
                    </LineChart>
                </ResponsiveContainer>
             </div>
          </div>
      )}

      {/* Detalhamento Corporal (Se disponível) */}
      {(profile.bodyFat || profile.muscleMass || profile.waist) && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
               <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                   <Activity className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> Detalhes da Composição Corporal
               </h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-100 dark:border-slate-600">
                       <span className="text-xs text-slate-500 dark:text-slate-400 block">Gordura Corporal</span>
                       <span className="text-lg font-bold text-slate-800 dark:text-white">{profile.bodyFat ? `${profile.bodyFat}%` : '-'}</span>
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-100 dark:border-slate-600">
                       <span className="text-xs text-slate-500 dark:text-slate-400 block">Massa Muscular</span>
                       <span className="text-lg font-bold text-slate-800 dark:text-white">{profile.muscleMass ? `${profile.muscleMass}%` : '-'}</span>
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-100 dark:border-slate-600">
                       <span className="text-xs text-slate-500 dark:text-slate-400 block">Cintura</span>
                       <span className="text-lg font-bold text-slate-800 dark:text-white">{profile.waist ? `${profile.waist} cm` : '-'}</span>
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-100 dark:border-slate-600">
                       <span className="text-xs text-slate-500 dark:text-slate-400 block">IMC Atual</span>
                       <span className="text-lg font-bold text-slate-800 dark:text-white">{(profile.weight / ((profile.height/100)**2)).toFixed(1)}</span>
                   </div>
               </div>
          </div>
      )}

      {/* Cardápio do Dia */}
      <div>
         <div className="flex justify-between items-end mb-4">
             <h3 className="text-xl font-bold text-slate-800 dark:text-white ml-1">Seu Cardápio Interativo</h3>
             {plan && (
                 <button 
                    onClick={handleGenerateShoppingList}
                    className="flex items-center gap-2 text-sm font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100 dark:hover:bg-teal-900/50 px-4 py-2 rounded-full transition-colors"
                 >
                    <ShoppingCart className="w-4 h-4" /> Gerar Lista de Compras
                 </button>
             )}
         </div>
         {plan ? (
            <MealPlanDisplay 
                plan={plan} 
                isEditable={false}
                enableTracking={true}
                checkedItems={checkedItems}
                onToggleItem={handleToggleItem}
                patientName={profile.name}
            />
         ) : (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 text-center text-slate-500 dark:text-slate-400">
                O nutricionista ainda não disponibilizou o cardápio detalhado para esta consulta.
            </div>
         )}
      </div>
    </div>
  );
};

export default PatientDashboard;