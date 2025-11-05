import apiClient from './client';

export interface VNCMachine {
  id: number;
  name: string;
  url: string;
  description?: string;
  owner_id: number;
  is_shared: boolean;
  created_at: string;
  updated_at?: string;
}

export interface VNCMachineCreate {
  name: string;
  url: string;
  description?: string;
  is_shared?: boolean;
}

export interface VNCMachineUpdate {
  name?: string;
  url?: string;
  description?: string;
  is_shared?: boolean;
}

export const machinesAPI = {
  getAll: async (): Promise<VNCMachine[]> => {
    const response = await apiClient.get('/api/machines');
    return response.data;
  },

  getAdminMachines: async (): Promise<VNCMachine[]> => {
    const response = await apiClient.get('/api/machines/admin');
    return response.data;
  },

  getById: async (id: number): Promise<VNCMachine> => {
    const response = await apiClient.get(`/api/machines/${id}`);
    return response.data;
  },

  create: async (data: VNCMachineCreate): Promise<VNCMachine> => {
    const response = await apiClient.post('/api/machines', data);
    return response.data;
  },

  update: async (id: number, data: VNCMachineUpdate): Promise<VNCMachine> => {
    const response = await apiClient.put(`/api/machines/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/machines/${id}`);
  },
};

