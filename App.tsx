import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { AppMode, PatientProfile, NutritionalStats, DailyPlan, PatientRecord } from './types';
import { analyzePatientProfile, generateDailyPlan } from './services/gemini';
import { savePatientRecord, getPatientHistory, deletePatientRecord } from './services/storage';
import PatientForm from './components/PatientForm';
import Dashboard from './components/Dashboard';
import MealPlanDisplay from './components/MealPlanDisplay';
import PatientHistory from './components/PatientHistory';
import LoginScreen from './components/LoginScreen';
import PatientDashboard from './components/PatientDashboard';
import ToastNotification from './components/ToastNotification';
import { Stethoscope, UserCircle, Leaf, ArrowLeft, AlertTriangle, Users, PlusCircle, LogOut, Sun, Moon, RefreshCcw } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('landing');
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [targetLoginMode, setTargetLoginMode] = useState<'professional' | 'patient'>('professional');
  
  // Patient Context (For Patient Mode)
  const [currentPatient, setCurrentPatient] = useState<PatientRecord | null>(null);

  // Professional Mode Views
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  
  // State for Professional Mode Data
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [nutritionalStats, setNutritionalStats] = useState<NutritionalStats | null>(null);
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  
  // --- NOVOS ESTADOS PARA RETORNO/ACOMPANHAMENTO ---
  const [existingPatientCode, setExistingPatientCode] = useState<string | null>(null); // Código do paciente sendo atendido (se retorno)
  const [initialFormData, setInitialFormData] = useState<PatientProfile | undefined>(undefined); // Dados para preencher o form
  
  // History State
  const [history, setHistory] = useState<PatientRecord[]>([]);

  // Loading states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toast State
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Apply Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    if (mode === 'professional' && activeTab === 'history') {
      refreshHistory();
    }
  }, [mode, activeTab]);

  const refreshHistory = () => {
    setHistory(getPatientHistory());
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const handleModeSelect = (selectedMode: AppMode) => {
    // Trigger login
    setTargetLoginMode(selectedMode === 'professional' ? 'professional' : 'patient');
    setShowLogin(true);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setShowLogin(false);
    setMode(targetLoginMode === 'professional' ? 'professional' : 'patient');
    
    // Reset defaults
    if(targetLoginMode === 'professional') {
        setActiveTab('new');
    }
  };

  const handlePatientLogin = (record: PatientRecord) => {
    setCurrentPatient(record);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setMode('landing');
    setCurrentPatient(null);
    resetProfessionalMode();
  };

  const handleProfileSubmit = async (data: PatientProfile) => {
    setIsAnalyzing(true);
    setError(null);
    setPatientProfile(data);
    try {
      const stats = await analyzePatientProfile(data);
      setNutritionalStats(stats);
      setDailyPlan(null); // Reset plan if new analysis is done
    } catch (err) {
      setError("Erro ao analisar dados. Verifique a conexão ou tente novamente.");
      showToast("Falha na análise. Verifique sua conexão.", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!patientProfile || !nutritionalStats) return;
    setIsGeneratingPlan(true);
    setError(null);
    try {
      const plan = await generateDailyPlan(patientProfile, nutritionalStats);
      setDailyPlan(plan);
      showToast("Plano alimentar gerado com sucesso!", "success");
    } catch (err) {
      setError("Erro ao gerar plano alimentar. Tente novamente.");
      showToast("Falha ao gerar plano.", "error");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleUpdatePlan = (updatedPlan: DailyPlan) => {
    setDailyPlan(updatedPlan);
  };

  const handleSaveConsultation = () => {
    if (!patientProfile || !nutritionalStats) return;

    // Se for retorno, usa o código existente. Se não, gera um novo.
    const accessCode = existingPatientCode || Math.floor(100000 + Math.random() * 900000).toString();

    const record: PatientRecord = {
      id: Date.now().toString(),
      accessCode: accessCode,
      date: new Date().toISOString(),
      profile: patientProfile,
      stats: nutritionalStats,
      plan: dailyPlan || undefined
    };

    savePatientRecord(record);
    showToast(`Atendimento salvo! Código: ${accessCode}`, "success");
    
    if (existingPatientCode) {
        alert(`CONSULTA DE ACOMPANHAMENTO SALVA.\n\nOs dados foram atualizados no histórico do paciente (Código: ${accessCode}).`);
    } else {
        alert(`NOVO PACIENTE CADASTRADO.\n\nCódigo de Acesso: ${accessCode}\nInforme ao paciente.`);
    }
    
    // Opcional: Limpar estado de retorno após salvar, ou manter para mais edições?
    // Vamos manter na tela de dashboard por enquanto, mas ao sair ele reseta
  };

  const handleLoadPatient = (record: PatientRecord) => {
    // Apenas VISUALIZA o registro antigo, mas não configura modo de retorno (edição)
    setPatientProfile(record.profile);
    setNutritionalStats(record.stats);
    setDailyPlan(record.plan || null);
    
    // Limpa estados de edição/novo
    setExistingPatientCode(null);
    setInitialFormData(undefined);
    
    setActiveTab('new');
    showToast("Atendimento carregado (modo visualização).", "success");
  };

  const handleStartFollowUp = (record: PatientRecord) => {
    // Configura o sistema para um NOVO atendimento, mas baseado nos dados do anterior
    setExistingPatientCode(record.accessCode);
    setInitialFormData(record.profile);
    
    // Limpa resultados anteriores para forçar nova análise
    setPatientProfile(null);
    setNutritionalStats(null);
    setDailyPlan(null);
    setError(null);
    
    setActiveTab('new');
    showToast(`Iniciando retorno para ${record.profile.name}. Atualize os dados.`, "success");
  };

  const handleCancelFollowUp = () => {
      setExistingPatientCode(null);
      setInitialFormData(undefined);
      showToast("Modo de retorno cancelado. Iniciando novo paciente.", "success");
  };

  const handleDeletePatient = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este atendimento permanentemente?')) {
      // Atualiza o estado LOCALMENTE primeiro para feedback instantâneo
      setHistory(prevHistory => prevHistory.filter(record => record.id !== id));
      
      // Depois atualiza no storage
      deletePatientRecord(id);
      
      showToast("Registro excluído com sucesso.", "success");
    }
  };

  const resetProfessionalMode = () => {
    setPatientProfile(null);
    setNutritionalStats(null);
    setDailyPlan(null);
    setError(null);
    setExistingPatientCode(null);
    setInitialFormData(undefined);
  };

  const renderLanding = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-teal-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 transition-colors">
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          className="p-3 bg-white/50 dark:bg-slate-700/50 rounded-full shadow-sm hover:shadow-md transition-all text-slate-600 dark:text-slate-300 backdrop-blur-sm"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
      </div>

      <div className="text-center mb-16 animate-fade-in-up">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-full inline-block shadow-lg mb-6 ring-4 ring-teal-50 dark:ring-slate-700">
           <Leaf className="w-16 h-16 text-teal-600 dark:text-teal-400" />
        </div>
        <h1 className="text-5xl font-bold text-slate-800 dark:text-white mb-4 tracking-tight">Diogenes Pio Nutri</h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          <span className="text-teal-600 dark:text-teal-400 font-semibold">Tecnologia avançada</span> para saúde de precisão.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        <button 
          onClick={() => handleModeSelect('professional')}
          className="group relative bg-white dark:bg-slate-800 p-10 rounded-3xl shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-slate-100 dark:border-slate-700 overflow-hidden text-left"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 dark:bg-slate-700 rounded-full -mr-16 -mt-16 group-hover:bg-teal-100 dark:group-hover:bg-slate-600 transition-colors"></div>
          <div className="relative z-10">
            <div className="bg-teal-100 dark:bg-teal-900/30 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Stethoscope className="w-8 h-8 text-teal-700 dark:text-teal-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Sou Nutricionista</h2>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Acesse o painel profissional para realizar avaliações metabólicas, criar dietas com IA e gerenciar seus pacientes.
            </p>
          </div>
        </button>

        <button 
          onClick={() => handleModeSelect('patient')}
          className="group relative bg-white dark:bg-slate-800 p-10 rounded-3xl shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-slate-100 dark:border-slate-700 overflow-hidden text-left"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-slate-700 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-100 dark:group-hover:bg-slate-600 transition-colors"></div>
          <div className="relative z-10">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <UserCircle className="w-8 h-8 text-indigo-700 dark:text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Sou Paciente</h2>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Entre com seu código de acesso para ver seu plano alimentar, acompanhar metas e registrar seu progresso.
            </p>
          </div>
        </button>
      </div>
      
      <div className="mt-16 text-center text-slate-400 dark:text-slate-500 text-xs">
        &copy; {new Date().getFullYear()} Diogenes Pio Nutri. Todos os direitos reservados.
      </div>
    </div>
  );

  const renderHeader = (title: string, subtitle: string) => (
    <header className="no-print bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-20 border-b border-slate-100 dark:border-slate-700 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={handleLogout}
            className="group p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400"
            title="Sair"
          >
            <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg group-hover:bg-red-50 dark:group-hover:bg-red-900/30 transition-colors">
                <ArrowLeft className="w-5 h-5" /> 
            </div>
            <span className="text-sm font-semibold hidden sm:inline">Sair</span>
          </button>
          <div className="border-l border-slate-200 dark:border-slate-600 pl-6">
             <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">{title}</h1>
             <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
            {/* Theme Toggle in Header */}
            <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
                title={theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
            >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-3 bg-teal-50 dark:bg-teal-900/30 px-4 py-2 rounded-full border border-teal-100 dark:border-teal-800">
                <Leaf className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span className="font-bold text-teal-800 dark:text-teal-200 text-sm hidden sm:block">Diogenes Pio Nutri</span>
            </div>
        </div>
      </div>
    </header>
  );

  const renderProfessionalContent = () => {
    // Navigation Tabs
    const tabs = (
      <div className="flex gap-2 mb-8 bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 w-fit no-print transition-colors">
        <button
          onClick={() => {
              setActiveTab('new');
              // Se clicar na aba, mantemos o estado de retorno se já estiver ativo? 
              // Melhor não resetar automaticamente, pois o usuário pode estar navegando
          }}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all text-sm flex items-center gap-2 ${activeTab === 'new' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
        >
          <PlusCircle className="w-4 h-4" /> {existingPatientCode ? 'Atendimento em Andamento' : 'Novo Atendimento'}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all text-sm flex items-center gap-2 ${activeTab === 'history' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
        >
          <Users className="w-4 h-4" /> Histórico de Pacientes
        </button>
      </div>
    );

    if (activeTab === 'history') {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
          {tabs}
          <PatientHistory 
            history={history} 
            onLoad={handleLoadPatient} 
            onDelete={handleDeletePatient}
            onFollowUp={handleStartFollowUp} 
          />
        </div>
      );
    }

    // New/Current Consultation View
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {tabs}
        {error && (
          <div className="no-print bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-6 flex items-center gap-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" /> {error}
          </div>
        )}

        {/* Banner de Modo de Retorno */}
        {existingPatientCode && !nutritionalStats && (
            <div className="mb-6 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 p-4 rounded-xl flex items-center justify-between animate-fade-in">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 dark:bg-indigo-800 p-2 rounded-lg text-indigo-600 dark:text-indigo-300">
                        <RefreshCcw className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-indigo-800 dark:text-indigo-200">Realizando Retorno</h4>
                        <p className="text-sm text-indigo-600 dark:text-indigo-400">
                            Atualizando dados do paciente de código: <span className="font-mono font-bold">{existingPatientCode}</span>
                        </p>
                    </div>
                </div>
                <button 
                    onClick={handleCancelFollowUp}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-800 px-3 py-1.5 rounded-lg transition-colors"
                >
                    Cancelar e Iniciar Novo
                </button>
            </div>
        )}

        {!nutritionalStats ? (
          <div className="max-w-2xl mx-auto mt-8">
            <PatientForm 
                onSubmit={handleProfileSubmit} 
                isLoading={isAnalyzing} 
                initialData={initialFormData} // Passa dados para preenchimento se for retorno
            />
          </div>
        ) : (
          <div className="space-y-8">
             <button 
               onClick={() => {
                 setNutritionalStats(null);
                 setDailyPlan(null);
                 // Não limpamos existingPatientCode aqui para permitir re-analisar se necessário durante o fluxo
               }}
               className="no-print text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 flex items-center gap-2 transition-colors px-4 py-2 rounded-lg hover:bg-white dark:hover:bg-slate-800"
             >
               <ArrowLeft className="w-4 h-4" /> Voltar para Edição
             </button>
             
             {patientProfile && (
                <div className="no-print">
                    <Dashboard 
                        profile={patientProfile} 
                        stats={nutritionalStats} 
                        onGeneratePlan={handleGeneratePlan}
                        isGeneratingPlan={isGeneratingPlan}
                        onSave={handleSaveConsultation}
                    />
                </div>
             )}
             
             {dailyPlan && (
                <MealPlanDisplay 
                    plan={dailyPlan} 
                    isEditable={true} // Allow edits in professional mode
                    onUpdatePlan={handleUpdatePlan}
                    patientName={patientProfile?.name}
                />
             )}
          </div>
        )}
      </main>
    );
  };

  if (showLogin) {
    return (
        <LoginScreen 
            targetMode={targetLoginMode}
            onLoginSuccess={handleLoginSuccess}
            onPatientLogin={handlePatientLogin}
            onCancel={() => setShowLogin(false)}
        />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans transition-colors duration-300">
      {toast && (
        <ToastNotification 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
        />
      )}

      {mode === 'landing' && renderLanding()}

      {mode === 'professional' && isAuthenticated && (
        <>
          {renderHeader("Área do Profissional", "Gestão Clínica e Prescrição Dietética")}
          {renderProfessionalContent()}
        </>
      )}

      {mode === 'patient' && isAuthenticated && currentPatient && (
        <>
           {renderHeader("Área do Paciente", "Seu companheiro de jornada saudável")}
           <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <PatientDashboard record={currentPatient} />
           </main>
        </>
      )}

      <Analytics />
    </div>
  );
};

export default App;