export interface IInventoryItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    code: string;
    unitOfMeasure: string;
  };
  department: {
    _id: string;
    name:string;
    code: string;
  };
  quantity: number;
  location?: string;
  lastUpdatedBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type AddInventoryItemData = {
  product: string;
  department: string;
  quantity: number;
  location?: string;
};

export type UpdateInventoryQuantityData = {
  quantity: number;
  location?: string;
};
