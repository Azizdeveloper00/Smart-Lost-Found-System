import api from './api';

export const getDashboardStats = async () => (await api.get('/dashboard/stats')).data;
