import api from './api';

export const createClaim = async (claim) => (await api.post('/claims', claim)).data;
export const getMyClaims = async () => (await api.get('/claims/my')).data;
export const getReceivedClaims = async () => (await api.get('/claims/received')).data;
export const approveClaim = async (id) => (await api.patch(`/claims/${id}/approve`)).data;
export const rejectClaim = async (id) => (await api.patch(`/claims/${id}/reject`)).data;
