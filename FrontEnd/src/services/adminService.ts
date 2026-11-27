import api from './api';

export interface AdminStats {
  totalUsers: number;
  verifiedUsers: number;
  totalWorkouts: number;
  totalSessions: number;
  totalNutritionLogs: number;
  openTickets: number;
  resolvedTickets: number;
  totalTickets: number;
}

export interface AdminUserItem {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  avatar?: string;
  createdAt: string;
  level?: number;
  xp?: number;
}

export interface AdminTicketItem {
  _id: string;
  id?: string;
  topic: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved';
  adminReply?: string;
  repliedAt?: string;
  createdAt: string;
  user: {
    _id?: string;
    id?: string;
    name?: string;
    email?: string;
    avatar?: string;
  };
}

export const getAdminStats = async (): Promise<AdminStats> => {
  const res = await api.get('/admin/stats');
  return res.data;
};

export const getAdminUsers = async (search = ''): Promise<{ users: AdminUserItem[]; total: number }> => {
  const res = await api.get('/admin/users', { params: { search } });
  return res.data;
};

export const toggleUserRole = async (userId: string, role?: 'user' | 'admin'): Promise<{ msg: string; user: AdminUserItem }> => {
  const res = await api.patch(`/admin/users/${userId}/role`, { role });
  return res.data;
};

export const deleteUserByAdmin = async (userId: string): Promise<{ msg: string }> => {
  const res = await api.delete(`/admin/users/${userId}`);
  return res.data;
};

export const getAdminTickets = async (status?: string): Promise<{ tickets: AdminTicketItem[] }> => {
  const res = await api.get('/admin/tickets', { params: { status } });
  return res.data;
};

export const updateTicketByAdmin = async (
  ticketId: string,
  payload: { status?: string; reply?: string }
): Promise<{ msg: string; ticket: AdminTicketItem }> => {
  const res = await api.patch(`/admin/tickets/${ticketId}`, payload);
  return res.data;
};
