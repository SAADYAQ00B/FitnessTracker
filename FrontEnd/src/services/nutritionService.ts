import api from './api';

export interface MealItem {
  _id?: string;
  id?: string;
  type: string;
  food: string;
  quantity?: string;
  calories: number;
  protein?: string | number;
  proteinGrams?: number;
  carbs?: string | number;
  carbsGrams?: number;
  fats?: string | number;
  fatsGrams?: number;
  date?: string;
  notes?: string;
}

export interface NutritionSummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  dailyCalorieGoal: number;
  dailyProteinGoal: number;
  dailyCarbsGoal: number;
  dailyFatsGoal: number;
  percentage: number;
  mealsCount: number;
}

export const getMeals = async (date?: string): Promise<MealItem[]> => {
  const params: Record<string, string> = {};
  if (date) params.date = date;

  const response = await api.get('/nutrition/meals', { params });
  return response.data;
};

export const addMeal = async (data: Partial<MealItem>): Promise<MealItem> => {
  const response = await api.post('/nutrition/meals', data);
  return response.data;
};

export const updateMeal = async (id: string, data: Partial<MealItem>): Promise<MealItem> => {
  const response = await api.put(`/nutrition/meals/${id}`, data);
  return response.data;
};

export const deleteMeal = async (id: string): Promise<boolean> => {
  await api.delete(`/nutrition/meals/${id}`);
  return true;
};

export const getNutritionSummary = async (date?: string): Promise<NutritionSummary> => {
  const params: Record<string, string> = {};
  if (date) params.date = date;

  const response = await api.get('/nutrition/summary', { params });
  return response.data;
};