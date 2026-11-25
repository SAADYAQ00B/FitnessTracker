import api from './api';

export interface MilestoneItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  type: 'trophy' | 'check';
}

export interface ProgressChartPoint {
  date: string;
  rawDate: string;
  weight: number;
  bodyFat?: number;
  waist?: number;
  benchPress?: number;
}

export interface ProgressData {
  weight: string;
  bodyFat: string;
  waist: string;
  benchPress: string;
  squat?: string;
  deadlift?: string;
  runTime5k?: string;
  deltaWeight: string;
  deltaBodyFat: string;
  deltaWaist: string;
  deltaBenchPress: string;
  weightTrend: string;
  percentChange?: string;
  chartData: ProgressChartPoint[];
  milestones: MilestoneItem[];
  hasRecords: boolean;
  recordsCount?: number;
}

export const getProgress = async (): Promise<ProgressData> => {
  const response = await api.get('/progress');
  return response.data;
};

export const addMeasurement = async (data: any): Promise<any> => {
  const response = await api.post('/progress', data);
  return response.data;
};

export const getProgressHistory = async (): Promise<any[]> => {
  const response = await api.get('/progress/history');
  return response.data;
};

export const deleteMeasurement = async (id: string): Promise<boolean> => {
  await api.delete(`/progress/${id}`);
  return true;
};