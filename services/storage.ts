import { PatientRecord } from "../types";

const STORAGE_KEY = 'diogenes_pio_patients_v1';
const PROGRESS_KEY = 'diogenes_pio_progress_v1';

export const getPatientHistory = (): PatientRecord[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Erro ao ler histórico:", error);
    return [];
  }
};

export const getPatientByCode = (code: string): PatientRecord | undefined => {
  const history = getPatientHistory();
  return history.find(record => record.accessCode === code);
};

export const savePatientRecord = (record: PatientRecord): void => {
  try {
    const currentHistory = getPatientHistory();
    // Adiciona no início da lista
    const updatedHistory = [record, ...currentHistory];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error("Erro ao salvar paciente:", error);
    alert("Não foi possível salvar os dados localmente.");
  }
};

export const deletePatientRecord = (id: string): PatientRecord[] => {
  try {
    const currentHistory = getPatientHistory();
    // Garante comparação de string e cria novo array
    const updatedHistory = currentHistory.filter(record => String(record.id) !== String(id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    return updatedHistory;
  } catch (error) {
    console.error("Erro ao excluir registro:", error);
    // Em caso de erro, tenta retornar o histórico atual para não zerar a tela se a App depender disso
    return getPatientHistory();
  }
};

// Funções para Salvar Progresso (Checklist)
export const savePatientProgress = (patientId: string, checkedItems: string[]) => {
    try {
        const allProgress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
        allProgress[patientId] = checkedItems;
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(allProgress));
    } catch (error) {
        console.error("Erro ao salvar progresso", error);
    }
};

export const getPatientProgress = (patientId: string): string[] => {
    try {
        const allProgress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
        return allProgress[patientId] || [];
    } catch (error) {
        return [];
    }
};