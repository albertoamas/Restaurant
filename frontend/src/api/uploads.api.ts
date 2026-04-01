import api from './client';

export const uploadsApi = {
  image: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<{ url: string }>('/api/v1/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url;
  },
};
