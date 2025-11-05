import apiClient from './client';
import { User } from './auth';

export interface UserUpdate {
  email?: string;
  full_name?: string;
  password?: string;
  is_admin?: boolean;
}

export const usersAPI = {
  getAll: async (): Promise<User[]> => {
    const response = await apiClient.get('/api/users');
    return response.data;
  },

  update: async (id: number, data: UserUpdate): Promise<User> => {
    const response = await apiClient.put(`/api/users/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/users/${id}`);
  },
};

