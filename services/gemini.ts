import { GoogleGenAI, Type } from "@google/genai";
import { PatientProfile, NutritionalStats, DailyPlan } from "../types";

// Initialize Gemini Client
// WARNING: In a real production app, never expose API keys in frontend code. 
// This should be proxied through a backend.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
Você é "Diogenes Pio Nutri", um assistente de nutrição e saúde desenvolvido para auxiliar o nutricionista Diogenes Pio.
Sua identidade: Profissional, empático, baseado em evidências (OMS, ANVISA, SBAN).
Nunca prescreva medicamentos. Sempre sugira consulta presencial.
Fale em Português do Brasil.
`;

const cleanJsonStr = (text: string) => {
  let clean = text.trim();
  if (clean.startsWith('```json')) clean = clean.slice(7);
  if (clean.startsWith('```')) clean = clean.slice(3);
  if (clean.endsWith('```')) clean = clean.slice(0, -3);
  return clean;
};

export const analyzePatientProfile = async (profile: PatientProfile): Promise<NutritionalStats> => {
  const prompt = `
    Analise o seguinte paciente e calcule suas necessidades nutricionais.
    
    DADOS PESSOAIS:
    Nome: ${profile.name}, Idade: ${profile.age}, Sexo: ${profile.gender}
    Peso: ${profile.weight}kg, Altura: ${profile.height}cm
    Atividade: ${profile.activityLevel}
    Objetivo: ${profile.goal}
    
    MEDIDAS E COMPOSIÇÃO CORPORAL (Se disponíveis):
    Cintura: ${profile.waist ? profile.waist + ' cm' : 'Não informado'}
    Quadril: ${profile.hips ? profile.hips + ' cm' : 'Não informado'}
    Braço: ${profile.arm ? profile.arm + ' cm' : 'Não informado'}
    Gordura Corporal: ${profile.bodyFat ? profile.bodyFat + '%' : 'Não informado'}
    Massa Muscular: ${profile.muscleMass ? profile.muscleMass + '%' : 'Não informado'}

    CLÍNICO:
    Restrições: ${profile.restrictions}
    Condições: ${profile.conditions}

    IMPORTANTE:
    1. Se as medidas de cintura/quadril estiverem disponíveis, calcule/estime o risco metabólico na "analysis".
    2. Se o % de gordura estiver disponível, use-o para ajustar a ingestão calórica e de macronutrientes de forma mais precisa.

    Retorne APENAS um JSON válido com a seguinte estrutura (sem markdown):
    {
      "bmr": number, // Taxa Metabólica Basal
      "tdee": number, // Gasto Energético Total
      "caloriesTarget": number, // Meta calórica sugerida para o objetivo
      "macros": { "protein": number, "carbs": number, "fats": number }, // em gramas
      "analysis": "string", // Breve análise clínica e antropométrica (max 4 frases)
      "recommendations": ["string", "string", "string"] // 3 recomendações principais
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    return JSON.parse(cleanJsonStr(text));
  } catch (error) {
    console.error("Erro na análise nutricional:", error);
    throw new Error("Falha ao analisar perfil do paciente.");
  }
};

export const generateDailyPlan = async (profile: PatientProfile, stats: NutritionalStats): Promise<DailyPlan> => {
  const prompt = `
    Crie um plano alimentar de 1 dia para o paciente ${profile.name}.
    Meta Calórica: ${stats.caloriesTarget} kcal.
    Objetivo: ${profile.goal}.
    Restrições: ${profile.restrictions}.
    
    Respeite a cultura alimentar brasileira.
    
    Retorne APENAS um JSON válido com a estrutura:
    {
      "day": "Exemplo de Dia Balanceado",
      "totalCalories": number,
      "meals": [
        {
          "type": "breakfast" | "lunch" | "dinner" | "snack",
          "title": "Nome da Refeição",
          "items": [
             { "name": "Alimento", "portion": "Quantidade caseira", "calories": number, "protein": number, "carbs": number, "fats": number }
          ],
          "notes": "Dica rápida"
        }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    return JSON.parse(cleanJsonStr(text));
  } catch (error) {
    console.error("Erro ao gerar plano:", error);
    throw new Error("Falha ao gerar plano alimentar.");
  }
};

export const generateShoppingList = async (plan: DailyPlan): Promise<string> => {
    const prompt = `
      Com base no seguinte plano alimentar JSON, crie uma Lista de Compras consolidada e organizada por categorias (Hortifruti, Açougue/Peixaria, Mercearia, Laticínios).
      
      Plano: ${JSON.stringify(plan)}
      
      Formate a saída como um texto Markdown limpo, usando bullets. Não inclua quantidades calóricas, apenas os itens e quantidades estimadas para comprar (ex: "3 Ovos" -> "Dúzia de Ovos"). Seja prático.
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });
  
      return response.text || "Não foi possível gerar a lista.";
    } catch (error) {
      console.error("Erro ao gerar lista:", error);
      throw new Error("Falha ao gerar lista de compras.");
    }
  };

export const chatWithAssistant = async (message: string, history: { role: string, parts: { text: string }[] }[]) => {
  try {
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction: SYSTEM_INSTRUCTION },
        history: history as any
    });
    
    const result = await chat.sendMessageStream({ message });
    return result;
  } catch (error) {
    console.error("Erro no chat:", error);
    throw error;
  }
};