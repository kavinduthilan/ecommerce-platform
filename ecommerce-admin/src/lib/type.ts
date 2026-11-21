import { OrderStatus, PaymentStatus, Status, StockMoveType } from "@/generated/prisma/enums";

export interface Size {
  id: number;
  name: string;
  status: Status;
  createdAt: Date;
  createdBy: {name: string};
}


export interface User{
  id:  number,
  name: string,
  email: string,
  password: string,
  status: Status
  createdAt: Date;
}

export interface CreateUser{
  name: string,
  email: string,
  password: string,
  status: Status
}

export interface UserMenuPermission {
  userId:number,
  menuId: number,
  canAdd: boolean,
  canView: boolean,
  canEdit: boolean
}

export interface UserSectionPermission {
  userId:number,
  sectionId: number,
  isEnabled: boolean
}

export interface Product{
  name: string,
  categoryId: string,
  brandId: string,
  description: string,
  imageUrl: string | null,
  status:Status
}

export interface GetProduct{
  id: number,
  name: string,
  categoryId: number;
  brandId: number;
  category: {name: string},
  brand: {name: string},
  description: string,
  imageUrl: string | null,
  status: Status, 
  createdBy: {name: string};
  createdAt: Date
}

export interface ProductVariant{
  name: string,
  productId: string,
  sku: string,
  sizeId: string,
  price: number,
  costPrice:  number,
  status: Status,
}

export interface GetProductVariant{
  id : number,
  name: string,
  productId: number,
  product: {name: string},
  sizeId: number | null,
  size: {name: string} | null,
  sku: string,
  price: number,
  costPrice:  number,
  status: Status,
  createdBy: {name: string};
  createdAt: Date
}

export interface Inventory{
  productVariantId: string,
  quantity: number,
  reversedQuantity:  number
  availableQuantity: number,
  reorderLevel: number,
  status: Status,
}

export interface GetInventory{
  id: number,
  productVariantId: number,
  productVariant : {name: string};
  quantity: number,
  reversedQuantity:  number,
  availableQuantity: number,
  reorderLevel: number,
  createdAt: Date,
  createdBy: {name: string};
  status: Status,
}

export interface GetResponse{
  id: number,
  name: string
}


export interface GetCategory{
  id: number,
  name: string
}


export interface GetBrand{
  id: number,
  name: string
}

export interface Order{
  customerId: number,
  status: OrderStatus,
  paymentStatus: PaymentStatus,
  totalAmount: number,
  discountAmount: number;
  taxAmount: number,
  notes: string
}


export interface Customer {
  name: string,
  email: string,
  phone: number,
  address: string,
  status: Status
}

export interface GetCustomer {
  id: number,
  name: string,
  email: string,
  phone: number,
  address: string,
  status: Status,
  createdAt: Date,
}

export interface OrderRow {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  customer: { name: string; email: string | null; phone: string | number; address: string };
  orderItems: {
    id: number;
    quantity: number;
    unitPrice: number;
    discount: number;
    subtotal: number;
    productVariant: { id: number; name: string; sku: string };
  }[];
};


export type CustomerOrderHistory = {
  customer: {
    id: number;
    name: string;
    email: string;
    phone: number;
    address: string;
    status: Status;
    createdAt: string;
  };
  orders: {
    id: number;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    totalAmount: number;
    notes: string | null;
    createdAt: string;
    orderItems: {
      id: number;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      productVariant: { name: string; sku: string };
    }[];
  }[];
  summary: { totalOrders: number; totalSpent: number };
};


export type StockMove = {
  productVariantId: string;
  type: StockMoveType;
  quantity: number;
  reference?: string | null;
  note?: string | null;
};

// export type GetStockMove = {
//   id: number;
//   type: StockMoveType;
//   quantity: number;
//   reference: string | null;
//   note: string | null;
//   createdAt: Date;
//   productVariant: { name: string };
//   createdBy: { name: string };
// };

export type GetStockMove = {
  id: number;
  inventoryId: number;
  type: StockMoveType;
  quantity: number;
  reason: string | null;
  referenceId: number | null;
  createdById: number;
  createdAt: Date;
  createdBy: { name: string };
  inventory: { productVariant: { name: string } };
};