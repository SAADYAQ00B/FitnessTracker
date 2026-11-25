import api from './api';

export interface UserProfile {
  _id?: string;
  name: string;
  email: string;
  avatar?: string;
  location?: string;
  bio?: string;
  level?: number;
  xp?: number;
  units?: 'Metric' | 'Imperial';
  themePreset?: 'fitness1' | 'fitness2';
  themeMode?: 'dark' | 'light';
  notificationPrefs?: {
    workoutReminders?: boolean;
    goalAchievements?: boolean;
    weeklyReport?: boolean;
    communityUpdates?: boolean;
  };
}

export const getUser = async (): Promise<UserProfile> => {
  const response = await api.get('/user/profile');
  return response.data;
};

export const updateUser = async (data: Partial<UserProfile>): Promise<UserProfile> => {
  const response = await api.put('/user/profile', data);
  if (response.data.user) {
    localStorage.setItem('user', JSON.stringify(response.data.user));
    window.dispatchEvent(new Event('user-updated'));
    return response.data.user;
  }
  return response.data;
};

export const uploadAvatar = async (file: File): Promise<{ avatar: string; user: UserProfile }> => {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await api.post('/user/avatar', formData);
  if (response.data.user) {
    localStorage.setItem('user', JSON.stringify(response.data.user));
    window.dispatchEvent(new Event('user-updated'));
  }
  return response.data;
};

export const exportUserData = async () => {
  const response = await api.get('/user/export-data', { responseType: 'blob' });
  const blob = new Blob([response.data], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fitness_data_export_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const deleteAccount = async () => {
  const response = await api.delete('/user/account');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  return response.data;
};