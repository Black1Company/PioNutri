import React, { useState, useEffect } from 'react';
import { PatientProfile } from '../types';
import { User, Activity, Ruler, Weight, Utensils, AlertCircle, Scale, ScanLine, CalendarDays } from 'lucide-react';

interface Props {
  onSubmit: (data: PatientProfile) => void;
  isLoading: boolean;
  initialData?: PatientProfile | null;
}

const PatientForm: React.FC<Props> = ({ onSubmit, isLoading, initialData }) => {
  const [formData, setFormData] = useState<PatientProfile>({
    name: '',
    birthDate: '',
    age: 0,
    gender: 'female',
    weight: 70,
    height: 165,
    waist: 0,
    hips: 0,
    arm: 0,
    bodyFat: 0,
    muscleMass: 0,
    activityLevel: 'moderate',
    goal: 'loss',
    restrictions: '',
    conditions: ''
  });

  // Preenche o formulário se houver dados iniciais (Retorno)
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
       // Reset se não houver dados (Novo paciente limpo)
       setFormData({
        name: '',
        birthDate: '',
        age: 0,
        gender: 'female',
        weight: 70,
        height: 165,
        waist: 0,
        hips: 0,
        arm: 0,
        bodyFat: 0,
        muscleMass: 0,
        activityLevel: 'moderate',
        goal: 'loss',
        restrictions: '',
        conditions: ''
      });
    }
  }, [initialData]);

  // Função para calcular idade - CORREÇÃO DE FUSO HORÁRIO
  const calculateAge = (dateString: string): number => {
    if (!dateString) return 0;
    
    // Parse manual para evitar conversão UTC vs Local que ocorre com new Date("YYYY-MM-DD")
    const parts = dateString.split('-');
    if (parts.length !== 3) return 0;
    
    const birthYear = parseInt(parts[0], 10);
    const birthMonth = parseInt(parts[1], 10) - 1; // Meses em JS são 0-11
    const birthDay = parseInt(parts[2], 10);

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    let age = currentYear - birthYear;
    
    // Ajuste se ainda não fez aniversário este ano
    if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
        age--;
    }
    
    return age >= 0 ? age : 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numberFields = ['age', 'weight', 'height', 'waist', 'hips', 'arm', 'bodyFat', 'muscleMass'];
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: numberFields.includes(name) ? Number(value) : value
      };

      // Se mudar a data de nascimento, atualiza a idade automaticamente
      if (name === 'birthDate') {
        updated.age = calculateAge(value);
      }

      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const inputClasses = "w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition";
  const labelClasses = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";
  
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
      <h2 className="text-2xl font-bold text-teal-700 dark:text-teal-400 mb-6 flex items-center gap-2">
        <User className="w-6 h-6" /> {initialData ? 'Dados do Retorno' : 'Novo Atendimento'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identificação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelClasses}>Nome Completo</label>
            <input 
              required
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={inputClasses}
              placeholder="Ex: Maria Silva"
            />
          </div>
          
          <div>
            <label className={`${labelClasses} flex items-center gap-1`}>
                <CalendarDays className="w-4 h-4" /> Data de Nascimento
            </label>
            <input 
                required
                type="date" 
                name="birthDate" 
                value={formData.birthDate || ''} 
                onChange={handleChange} 
                className={inputClasses} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className={labelClasses}>Idade (Automático)</label>
                <input 
                    required 
                    type="number" 
                    name="age" 
                    value={formData.age} 
                    onChange={handleChange} 
                    className={`${inputClasses} bg-slate-100 dark:bg-slate-600 cursor-not-allowed opacity-80`} 
                    readOnly 
                />
             </div>
             <div>
                <label className={labelClasses}>Sexo</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className={inputClasses}>
                  <option value="female">Feminino</option>
                  <option value="male">Masculino</option>
                </select>
             </div>
          </div>
        </div>

        {/* Antropometria Básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`${labelClasses} flex items-center gap-1`}><Weight className="w-4 h-4"/> Peso (kg)</label>
            <input required type="number" step="0.1" name="weight" value={formData.weight} onChange={handleChange} className={inputClasses} />
          </div>
          <div>
            <label className={`${labelClasses} flex items-center gap-1`}><Ruler className="w-4 h-4"/> Altura (cm)</label>
            <input required type="number" name="height" value={formData.height} onChange={handleChange} className={inputClasses} />
          </div>
        </div>

        {/* Avaliação Antropométrica e Composição Corporal - NOVA SEÇÃO */}
        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-600">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                <Scale className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Avaliação Antropométrica & Composição
            </h3>
            
            {/* Circunferências */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Circ. Cintura (cm)</label>
                    <input type="number" step="0.1" name="waist" value={formData.waist || ''} onChange={handleChange} placeholder="Opcional" className={`${inputClasses} text-sm`} />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Circ. Quadril (cm)</label>
                    <input type="number" step="0.1" name="hips" value={formData.hips || ''} onChange={handleChange} placeholder="Opcional" className={`${inputClasses} text-sm`} />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Circ. Braço (cm)</label>
                    <input type="number" step="0.1" name="arm" value={formData.arm || ''} onChange={handleChange} placeholder="Opcional" className={`${inputClasses} text-sm`} />
                </div>
            </div>

            {/* Bioimpedância */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><ScanLine className="w-3 h-3"/> % Gordura Corporal</label>
                    <input type="number" step="0.1" name="bodyFat" value={formData.bodyFat || ''} onChange={handleChange} placeholder="Bioimpedância" className={`${inputClasses} text-sm`} />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Activity className="w-3 h-3"/> % Massa Muscular</label>
                    <input type="number" step="0.1" name="muscleMass" value={formData.muscleMass || ''} onChange={handleChange} placeholder="Bioimpedância" className={`${inputClasses} text-sm`} />
                </div>
            </div>
        </div>

        {/* Nível de Atividade & Objetivo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`${labelClasses} flex items-center gap-1`}><Activity className="w-4 h-4"/> Nível de Atividade</label>
            <select name="activityLevel" value={formData.activityLevel} onChange={handleChange} className={inputClasses}>
              <option value="sedentary">Sedentário (Pouco ou nenhum exercício)</option>
              <option value="light">Levemente Ativo (1-3 dias/semana)</option>
              <option value="moderate">Moderadamente Ativo (3-5 dias/semana)</option>
              <option value="active">Muito Ativo (6-7 dias/semana)</option>
              <option value="very_active">Extremamente Ativo (Atleta/Trabalho físico)</option>
            </select>
          </div>
          <div>
            <label className={labelClasses}>Objetivo</label>
            <select name="goal" value={formData.goal} onChange={handleChange} className={inputClasses}>
              <option value="loss">Emagrecimento</option>
              <option value="maintenance">Manutenção</option>
              <option value="gain">Hipertrofia (Ganho de Massa)</option>
              <option value="performance">Performance Esportiva</option>
            </select>
          </div>
        </div>

        {/* Detalhes Clínicos */}
        <div>
          <label className={`${labelClasses} flex items-center gap-1`}><AlertCircle className="w-4 h-4"/> Restrições Alimentares / Alergias</label>
          <textarea 
            name="restrictions" 
            value={formData.restrictions} 
            onChange={handleChange} 
            placeholder="Ex: Intolerância a lactose, não come carne vermelha..."
            className={`${inputClasses} h-20 resize-none`}
          />
        </div>
        <div>
          <label className={`${labelClasses} flex items-center gap-1`}><Utensils className="w-4 h-4"/> Condições de Saúde / Observações</label>
          <textarea 
            name="conditions" 
            value={formData.conditions} 
            onChange={handleChange} 
            placeholder="Ex: Diabetes Tipo 2, Hipertensão, Ansiedade..."
            className={`${inputClasses} h-20 resize-none`}
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className={`w-full py-3 rounded-lg text-white font-semibold shadow-md transition-all ${isLoading ? 'bg-teal-400 dark:bg-teal-600/50 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 hover:shadow-lg dark:bg-teal-600 dark:hover:bg-teal-500'}`}
        >
          {isLoading ? 'Analisando dados...' : (initialData ? 'Gerar Análise de Retorno' : 'Gerar Análise Nutricional')}
        </button>
      </form>
    </div>
  );
};

export default PatientForm;