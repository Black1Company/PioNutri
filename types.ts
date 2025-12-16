export interface PatientProfile {
  name: string;
  birthDate?: string; // Data de Nascimento (YYYY-MM-DD)
  age: number;
  gender: 'male' | 'female';
  weight: number; // kg
  height: number; // cm
  // Novas medidas antropométricas
  waist?: number; // cm (Cintura)
  hips?: number; // cm (Quadril)
  arm?: number; // cm (Braço)
  bodyFat?: number; // % (Gordura)
  muscleMass?: number; // % (Massa Muscular)
  
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'loss' | 'maintenance' | 'gain' | 'performance';
  restrictions: string;
  conditions: string;
}

export interface NutritionalStats {
  bmr: number;
  tdee: number;
  caloriesTarget: number;
  macros: {
    protein: number; // grams
    carbs: number; // grams
    fats: number; // grams
  };
  analysis: string;
  recommendations: string[];
}

export interface MealItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface Meal {
  type: 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner' | 'supper';
  title: string;
  items: MealItem[];
  notes?: string;
}

export interface DailyPlan {
  day: string;
  meals: Meal[];
  totalCalories: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface PatientRecord {
  id: string;
  accessCode: string; // Novo campo para o código de login
  date: string; // ISO String
  profile: PatientProfile;
  stats: NutritionalStats;
  plan?: DailyPlan;
}

export type AppMode = 'landing' | 'professional' | 'patient';