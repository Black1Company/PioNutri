import React, { useRef, useState } from 'react';
import { DailyPlan, Meal } from '../types';
import { Coffee, Sun, Sunset, Moon, UtensilsCrossed, Download, Printer, CheckSquare, Square, Loader2, Info, Trash2 } from 'lucide-react';

interface Props {
  plan: DailyPlan;
  isEditable?: boolean;
  enableTracking?: boolean;
  checkedItems?: string[];
  onToggleItem?: (itemId: string) => void;
  onUpdatePlan?: (updatedPlan: DailyPlan) => void;
  patientName?: string;
}

const MealIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'breakfast': return <Coffee className="w-5 h-5 text-orange-500" />;
    case 'morning_snack': return <Sun className="w-5 h-5 text-yellow-500" />;
    case 'lunch': return <UtensilsCrossed className="w-5 h-5 text-red-500" />;
    case 'afternoon_snack': return <Sun className="w-5 h-5 text-orange-400" />;
    case 'dinner': return <UtensilsCrossed className="w-5 h-5 text-indigo-500" />;
    case 'supper': return <Moon className="w-5 h-5 text-slate-500 dark:text-slate-400" />;
    default: return <UtensilsCrossed className="w-5 h-5 text-slate-400" />;
  }
};

const formatMealName = (type: string) => {
    const map: Record<string, string> = {
        'breakfast': 'Café da Manhã',
        'morning_snack': 'Lanche da Manhã',
        'lunch': 'Almoço',
        'afternoon_snack': 'Lanche da Tarde',
        'dinner': 'Jantar',
        'supper': 'Ceia'
    };
    return map[type] || type;
};

const MealPlanDisplay: React.FC<Props> = ({ 
    plan, 
    isEditable = false, 
    enableTracking = false,
    checkedItems = [],
    onToggleItem,
    onUpdatePlan, 
    patientName 
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!contentRef.current) return;
    setIsDownloading(true);

    const element = contentRef.current;
    const safeName = patientName ? patientName.replace(/\s+/g, '_') : 'Paciente';
    
    // Configurações otimizadas para garantir que tabelas não quebrem feio e texto apareça
    const opt = {
      margin: [10, 10, 10, 10], // Margens um pouco maiores
      filename: `Plano_Alimentar_${safeName}_DiogenesPio.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          scrollY: 0,
          windowWidth: document.documentElement.offsetWidth, // Garante largura total
          onclone: (documentClone) => {
              // Ensure PDF is always light mode
              const el = documentClone.querySelector('.print-content');
              if (el) {
                  el.classList.remove('dark');
                  // Force background white and text black for PDF
                  (el as HTMLElement).style.backgroundColor = '#ffffff';
                  (el as HTMLElement).style.color = '#000000';
                  
                  // Hide delete buttons in PDF clone just in case
                  const deleteButtons = el.querySelectorAll('.delete-btn-col');
                  deleteButtons.forEach((btn) => (btn as HTMLElement).style.display = 'none');
              }
          }
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // @ts-ignore - html2pdf is loaded via CDN
    if (window.html2pdf) {
       // @ts-ignore
       window.html2pdf().set(opt).from(element).save().then(() => {
         setIsDownloading(false);
       });
    } else {
       alert("Erro ao carregar biblioteca de PDF. Tente usar a opção de Imprimir.");
       setIsDownloading(false);
    }
  };

  const calculateTotalCalories = (meals: Meal[]) => {
    let newTotal = 0;
    meals.forEach(meal => {
        meal.items.forEach(item => newTotal += Number(item.calories || 0));
    });
    return newTotal;
  };

  const handleItemChange = (mealIndex: number, itemIndex: number, field: string, value: string | number) => {
    if (!onUpdatePlan) return;

    const newMeals = [...plan.meals];
    const newItems = [...newMeals[mealIndex].items];
    
    // Type assertion since we know the structure
    (newItems[itemIndex] as any)[field] = value;
    newMeals[mealIndex].items = newItems;

    onUpdatePlan({
        ...plan,
        meals: newMeals,
        totalCalories: calculateTotalCalories(newMeals)
    });
  };

  const handleDeleteItem = (mealIndex: number, itemIndex: number) => {
    if (!onUpdatePlan) return;

    const newMeals = [...plan.meals];
    // Remove o item do array
    newMeals[mealIndex].items.splice(itemIndex, 1);

    onUpdatePlan({
        ...plan,
        meals: newMeals,
        totalCalories: calculateTotalCalories(newMeals)
    });
  };

  const handleTitleChange = (mealIndex: number, value: string) => {
    if (!onUpdatePlan) return;
    const newMeals = [...plan.meals];
    newMeals[mealIndex].title = value;
    onUpdatePlan({ ...plan, meals: newMeals });
  };

  const handleNoteChange = (mealIndex: number, value: string) => {
      if (!onUpdatePlan) return;
      const newMeals = [...plan.meals];
      newMeals[mealIndex].notes = value;
      onUpdatePlan({ ...plan, meals: newMeals });
  };

  return (
    <div ref={contentRef} className="print-content bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden mt-6 animate-fade-in transition-colors">
      {/* Header with Print/Download Button */}
      <div className="bg-indigo-600 dark:bg-indigo-800 text-white p-4 flex justify-between items-center print:bg-white print:text-black print:border-b-2 print:border-black">
        <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
                <UtensilsCrossed className="w-6 h-6 print:hidden" /> 
                {patientName ? `Plano Alimentar - ${patientName}` : 'Sugestão de Cardápio'}
            </h3>
            <p className="text-xs text-indigo-200 dark:text-indigo-300 print:text-slate-500">
                Gerado por Diogenes Pio Nutri
            </p>
        </div>
        
        {/* data-html2canvas-ignore prevents this section from appearing in the generated PDF */}
        <div className="flex items-center gap-3" data-html2canvas-ignore="true">
            <span className="bg-indigo-500 dark:bg-indigo-700 px-3 py-1 rounded-full text-sm font-medium print:bg-slate-100 print:text-black print:border">
                Total: ~{Math.round(plan.totalCalories)} kcal
            </span>
            <button 
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="no-print p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white disabled:opacity-50"
                title="Baixar PDF"
            >
                {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            </button>
            <button 
                onClick={handlePrint}
                className="no-print p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white"
                title="Imprimir"
            >
                <Printer className="w-5 h-5" />
            </button>
        </div>
      </div>
      
      <div className="p-6 grid gap-8 print:p-0 print:gap-6 print:mt-4">
        {plan.meals.map((meal, mealIdx) => (
          <div key={mealIdx} className="border-b border-slate-100 dark:border-slate-700 last:border-0 pb-4 last:pb-0 break-inside-avoid page-break-inside-avoid">
             <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg print:border print:border-slate-300">
                    <MealIcon type={meal.type} />
                </div>
                <div className="w-full">
                    <h4 className="font-bold text-slate-800 dark:text-white text-lg">{formatMealName(meal.type)}</h4>
                    {isEditable ? (
                        <input 
                            type="text"
                            value={meal.title}
                            onChange={(e) => handleTitleChange(mealIdx, e.target.value)}
                            className="text-sm text-slate-500 dark:text-slate-400 w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none transition-colors"
                            placeholder="Descrição da refeição (ex: Opção Leve)"
                        />
                    ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400">{meal.title}</p>
                    )}
                </div>
             </div>
             
             <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 print:bg-white print:border print:border-slate-200 overflow-x-auto">
                <table className="w-full text-sm min-w-[600px] table-fixed">
                    <thead>
                        <tr className="text-left text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider">
                            {enableTracking && <th className="pb-2 w-8 no-print" data-html2canvas-ignore="true"></th>}
                            {/* Alimento fica com espaço flexível */}
                            <th className="pb-2 font-medium w-auto pl-2">Alimento</th>
                            {/* AUMENTADA largura da QTD para evitar quebra em PDF */}
                            <th className="pb-2 font-medium text-right w-48 md:w-56">Qtd</th>
                            <th className="pb-2 font-medium text-right w-10 text-teal-600 dark:text-teal-500" title="Proteínas (g)">P</th>
                            <th className="pb-2 font-medium text-right w-10 text-amber-600 dark:text-amber-500" title="Carboidratos (g)">C</th>
                            <th className="pb-2 font-medium text-right w-10 text-red-600 dark:text-red-500" title="Gorduras (g)">G</th>
                            <th className="pb-2 font-medium text-right w-16 text-slate-700 dark:text-slate-300">Kcal</th>
                            {isEditable && <th className="pb-2 w-8 no-print delete-btn-col"></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {meal.items.map((item, itemIdx) => {
                            // Unique ID for tracking
                            const itemId = `${mealIdx}-${itemIdx}-${item.name.replace(/\s/g, '')}`;
                            const isChecked = checkedItems.includes(itemId);

                            return (
                            <tr key={itemIdx} className={`border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors ${isChecked ? 'opacity-50 bg-slate-100 dark:bg-slate-800' : ''}`}>
                                {enableTracking && (
                                    <td className="py-2 no-print align-middle" data-html2canvas-ignore="true">
                                        <button 
                                            onClick={() => onToggleItem && onToggleItem(itemId)}
                                            className={`transition-colors ${isChecked ? 'text-teal-500 dark:text-teal-400' : 'text-slate-300 dark:text-slate-600 hover:text-slate-400'}`}
                                        >
                                            {isChecked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                        </button>
                                    </td>
                                )}
                                <td className={`py-3 text-slate-700 dark:text-slate-300 pl-2 ${isChecked ? 'line-through' : ''} whitespace-normal break-words align-top`}>
                                    {isEditable ? (
                                        <textarea 
                                            rows={1}
                                            value={item.name}
                                            onChange={(e) => handleItemChange(mealIdx, itemIdx, 'name', e.target.value)}
                                            className="w-full bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-500 outline-none px-1 transition-colors resize-none overflow-hidden"
                                            style={{ minHeight: '1.5em' }}
                                        />
                                    ) : <span className="font-medium block">{item.name}</span>}
                                </td>
                                <td className="py-3 text-right text-slate-600 dark:text-slate-400 font-medium whitespace-normal break-words align-top">
                                    {isEditable ? (
                                        <input 
                                            type="text" 
                                            value={item.portion}
                                            onChange={(e) => handleItemChange(mealIdx, itemIdx, 'portion', e.target.value)}
                                            className="w-full text-right bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-500 outline-none px-1 transition-colors"
                                        />
                                    ) : <span className="block">{item.portion}</span>}
                                </td>
                                {/* Macros - Proteína */}
                                <td className="py-3 text-right text-xs text-slate-500 dark:text-slate-500 align-top pt-3.5">
                                    {isEditable ? (
                                        <input 
                                            type="number" 
                                            value={item.protein}
                                            onChange={(e) => handleItemChange(mealIdx, itemIdx, 'protein', Number(e.target.value))}
                                            className="w-full text-right bg-transparent border-b border-transparent hover:border-teal-300 focus:border-teal-500 outline-none px-0 transition-colors"
                                            placeholder="0"
                                        />
                                    ) : <span className="text-teal-700/70 dark:text-teal-400/70">{item.protein}</span>}
                                </td>
                                {/* Macros - Carboidrato */}
                                <td className="py-3 text-right text-xs text-slate-500 dark:text-slate-500 align-top pt-3.5">
                                    {isEditable ? (
                                        <input 
                                            type="number" 
                                            value={item.carbs}
                                            onChange={(e) => handleItemChange(mealIdx, itemIdx, 'carbs', Number(e.target.value))}
                                            className="w-full text-right bg-transparent border-b border-transparent hover:border-amber-300 focus:border-amber-500 outline-none px-0 transition-colors"
                                            placeholder="0"
                                        />
                                    ) : <span className="text-amber-700/70 dark:text-amber-400/70">{item.carbs}</span>}
                                </td>
                                {/* Macros - Gordura */}
                                <td className="py-3 text-right text-xs text-slate-500 dark:text-slate-500 align-top pt-3.5">
                                    {isEditable ? (
                                        <input 
                                            type="number" 
                                            value={item.fats}
                                            onChange={(e) => handleItemChange(mealIdx, itemIdx, 'fats', Number(e.target.value))}
                                            className="w-full text-right bg-transparent border-b border-transparent hover:border-red-300 focus:border-red-500 outline-none px-0 transition-colors"
                                            placeholder="0"
                                        />
                                    ) : <span className="text-red-700/70 dark:text-red-400/70">{item.fats}</span>}
                                </td>
                                <td className="py-3 text-right text-slate-800 dark:text-slate-200 font-bold align-top pt-3.5">
                                    {isEditable ? (
                                        <input 
                                            type="number" 
                                            value={item.calories}
                                            onChange={(e) => handleItemChange(mealIdx, itemIdx, 'calories', Number(e.target.value))}
                                            className="w-full text-right bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-500 outline-none px-1 transition-colors"
                                        />
                                    ) : item.calories}
                                </td>
                                {isEditable && (
                                    <td className="py-2 text-center align-middle no-print delete-btn-col" data-html2canvas-ignore="true">
                                        <button 
                                            onClick={() => handleDeleteItem(mealIdx, itemIdx)}
                                            className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-full transition-colors"
                                            title="Remover item"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        )})}
                    </tbody>
                </table>
                {meal.notes && (
                    <div className="mt-3 text-xs text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded border border-indigo-100 dark:border-indigo-800 print:bg-white print:border-indigo-200 flex items-start gap-2 break-inside-avoid">
                        <Info className="w-4 h-4 mt-0.5 shrink-0" />
                        <div className="w-full">
                            <strong>Dica do Nutri:</strong> 
                            {isEditable ? (
                                <input 
                                    type="text"
                                    value={meal.notes}
                                    onChange={(e) => handleNoteChange(mealIdx, e.target.value)}
                                    className="w-full ml-1 bg-transparent border-b border-transparent hover:border-indigo-300 dark:hover:border-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            ) : ` ${meal.notes}`}
                        </div>
                    </div>
                )}
             </div>
          </div>
        ))}
      </div>
      
      {/* Footer for Print/PDF */}
      <div className="text-center mt-8 text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-700 pt-4 pb-4 print:mt-4">
          <p className="font-bold text-slate-600 dark:text-slate-400">Diogenes Pio Nutri - CRN 21102222</p>
          <p>Documento gerado em {new Date().toLocaleDateString()} | Acompanhamento Nutricional Personalizado</p>
      </div>
    </div>
  );
};

export default MealPlanDisplay;