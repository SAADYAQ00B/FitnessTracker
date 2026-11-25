import api from './api';

export const login = async (email: string, password: string) => {
  const response = await api.post('/user/login', { email, password });
  return response.data;
};

export const signup = async (name: string, email: string, password: string) => {
  const response = await api.post('/user/signup', { name, email, password });
  return response.data;
};

export const verifyOTP = async (data: { email: string; otp: string }) => {
  const response = await api.post('/user/verify-otp', data);
  return response.data;
};

export const resendOTP = async (email: string) => {
  const response = await api.post('/user/resend-otp', { email });
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const forgotPassword = async (email: string) => {
  const response = await api.post('/user/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (data: { email: string; code: string; newPassword: string }) => {
  const response = await api.post('/user/reset-password', data);
  return response.data;
};

export const googleAuth = async (credential: string) => {
  const response = await api.post('/user/google-auth', { credential });
  return response.data;
};