import axiosClient from './axiosClient';

export const getDashboardSummary = async (params) => {
  const response = await axiosClient.get('/dashboard', { params });
  return response.data || response;
};