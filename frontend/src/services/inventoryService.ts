import api from './api';
import { IInventoryItem, AddInventoryItemData, UpdateInventoryQuantityData } from '../types/inventory';

export const getInventory = async (): Promise<IInventoryItem[]> => {
  const { data } = await api.get('/inventory');
  return data.data;
};

export const addInventoryItem = async (itemData: AddInventoryItemData): Promise<IInventoryItem> => {
  const { data } = await api.post('/inventory', itemData);
  return data.data;
};

export const updateInventoryQuantity = async (id: string, updateData: UpdateInventoryQuantityData): Promise<IInventoryItem> => {
  const { data } = await api.put(`/inventory/${id}`, updateData);
  return data.data;
};
