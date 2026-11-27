import api from './api';

export interface ReminderItem {
  _id?: string;
  id?: string;
  title: string;
  schedule: string;
  type: 'workout' | 'meal' | 'goal' | 'general';
  active: boolean;
  isAlarm?: boolean;
}

export const getReminders = async (): Promise<ReminderItem[]> => {
  const response = await api.get('/reminders');
  return response.data.map((r: any) => ({
    ...r,
    id: r._id || r.id,
  }));
};

export const addReminder = async (data: Partial<ReminderItem>): Promise<ReminderItem> => {
  const response = await api.post('/reminders', data);
  return { ...response.data, id: response.data._id || response.data.id };
};

export const toggleReminder = async (id: string, active?: boolean): Promise<ReminderItem> => {
  const response = await api.patch(`/reminders/${id}/toggle`, { active });
  return { ...response.data, id: response.data._id || response.data.id };
};

export const updateReminder = async (id: string, data: Partial<ReminderItem>): Promise<ReminderItem> => {
  const response = await api.put(`/reminders/${id}`, data);
  return { ...response.data, id: response.data._id || response.data.id };
};

export const deleteReminder = async (id: string): Promise<boolean> => {
  await api.delete(`/reminders/${id}`);
  return true;
};