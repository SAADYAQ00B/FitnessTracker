import api from './api';

export interface ExerciseItem {
  _id?: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  duration?: number;
  notes?: string;
}

export interface WorkoutRoutine {
  _id?: string;
  id?: string;
  title: string;
  type: string;
  meta?: string;
  tag?: string;
  duration?: number;
  image?: string;
  exercises?: ExerciseItem[];
  notes?: string;
}

export interface WorkoutSessionItem {
  _id?: string;
  id?: string;
  title: string;
  type?: string;
  date: string;
  rawDate?: string;
  duration?: number;
  volume?: number;
  stats: string;
  notes?: string;
}

export const getWorkouts = async (search?: string, type?: string): Promise<WorkoutRoutine[]> => {
  const params: Record<string, string> = {};
  if (search && search.trim() !== '') params.search = search.trim();
  if (type && type !== 'All') params.type = type;

  const response = await api.get('/workouts', { params });
  return response.data.map((w: any) => ({
    ...w,
    id: w._id || w.id,
  }));
};

export const getWorkoutById = async (id: string): Promise<WorkoutRoutine> => {
  const response = await api.get(`/workouts/${id}`);
  return { ...response.data, id: response.data._id || response.data.id };
};

export const createWorkout = async (data: Partial<WorkoutRoutine>): Promise<WorkoutRoutine> => {
  const response = await api.post('/workouts', data);
  return { ...response.data, id: response.data._id || response.data.id };
};

export const updateWorkout = async (id: string, data: Partial<WorkoutRoutine>): Promise<WorkoutRoutine> => {
  const response = await api.put(`/workouts/${id}`, data);
  return { ...response.data, id: response.data._id || response.data.id };
};

export const deleteWorkout = async (id: string): Promise<boolean> => {
  await api.delete(`/workouts/${id}`);
  return true;
};

export const completeWorkout = async (id: string) => {
  const response = await api.post(`/workouts/${id}/complete`);
  return response.data;
};

export const getRecentSessions = async (limit: number = 20): Promise<WorkoutSessionItem[]> => {
  const response = await api.get('/workouts/sessions', { params: { limit } });
  return response.data;
};

export const uploadWorkoutImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post('/workouts/upload-image', formData);
  return response.data.url;
};