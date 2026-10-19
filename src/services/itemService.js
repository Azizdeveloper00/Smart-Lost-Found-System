import api from './api';

export const createItem = async (item) => (await api.post('/items', item)).data;
export const getItems = async (filters = {}) => {
	const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
	return (await api.get('/items', { params })).data;
};
export const getMyItems = async () => (await api.get('/items/my')).data;
export const getItemById = async (id) => (await api.get(`/items/${id}`)).data;
export const updateItem = async (id, item) => (await api.put(`/items/${id}`, item)).data;
export const deleteItem = async (id) => (await api.delete(`/items/${id}`)).data;
export const updateItemStatus = async (id, status) => (await api.patch(`/items/${id}/status`, { status })).data;
