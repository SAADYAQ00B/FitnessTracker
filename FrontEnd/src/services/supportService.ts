import api from './api';

export interface SupportTicket {
  _id?: string;
  topic: string;
  message: string;
  status?: string;
  createdAt?: string;
}

export const createTicket = async (data: { topic: string; message: string }) => {
  const response = await api.post('/support/ticket', data);
  return response.data;
};

export const getUserTickets = async (): Promise<SupportTicket[]> => {
  const response = await api.get('/support/tickets');
  return response.data;
};
