import api from './api';

export interface OverviewAnalytics {
  activityScore: number;
  caloriesBurned: number;
  activeMinutes: number;
  steps: number;
  currentWeight: number;
  weeklyCompleted: number;
  weeklyTarget: number;
  weeklyFraction: string;
  weeklyPercent: string;
  upNext: {
    id: string;
    title: string;
    type: string;
    meta: string;
    tag: string;
    image: string;
  } | null;
  hasActivity: boolean;
}

export interface TrainingAnalytics {
  frequency: string;
  totalVolume: string;
  totalVolumeRaw: number;
  avgDuration: number;
  totalSessionsCount: number;
  frequencyChartData: { day: string; count: number }[];
  volumeChartData: { date: string; volume: number; title: string }[];
  hasData: boolean;
}

export interface NutritionAnalytics {
  avgCalories: number;
  proteinTargetPercent: number;
  mealsLoggedThisWeek: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
    proteinPercent: number;
    carbsPercent: number;
    fatsPercent: number;
  };
  dailyTrend: { day: string; date: string; calories: number }[];
  hasData: boolean;
}

export const getOverviewAnalytics = async (): Promise<OverviewAnalytics> => {
  const response = await api.get('/analytics/overview');
  return response.data;
};

export const getTrainingAnalytics = async (): Promise<TrainingAnalytics> => {
  const response = await api.get('/analytics/training');
  return response.data;
};

export const getNutritionAnalytics = async (): Promise<NutritionAnalytics> => {
  const response = await api.get('/analytics/nutrition');
  return response.data;
};
