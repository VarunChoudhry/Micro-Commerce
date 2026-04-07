export interface ProductVm {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  rating: number;
  description: string;
  categoryId?: number;
  imageBase64?: string;
}

export interface CartItemVm {
  productId: number;
  product: string;
  quantity: number;
  price: number;
  imageBase64?: string;
}

export interface OrderVm {
  id: string;
  placedOn: Date;
  total: number;
  status: string;
}

export interface SessionVm {
  userId: string;
  fullName: string;
  email: string;
  role: 'Admin' | 'User';
  token: string;
}

export interface CategoryVm {
  id: number;
  name: string;
}

export interface AuthResponseVm {
  userId: string;
  fullName: string;
  email: string;
  role: 'Admin' | 'User';
  token: string;
}

export interface UserProfileVm {
  userId: string;
  fullName: string;
  email: string;
  role: 'Admin' | 'User';
}

export interface CartResponseVm {
  userId: string;
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
  total: number;
}

export interface OrderResponseVm {
  orderId: string;
  userId: string;
  shippingAddress: string;
  status: string;
  shippingCarrier?: string;
  trackingNumber?: string;
  shippedAt?: string;
  deliveredAt?: string;
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalAmount: number;
  createdAt: string;
}

export interface PaymentResponseVm {
  paymentId: string;
  orderId: string;
  userId: string;
  amount: number;
  method: string;
  status: string;
  processedAt: string;
}

export interface InventoryItemVm {
  productId: number;
  productName: string;
  availableStock: number;
}

export interface StripeCheckoutLineItemVm {
  name: string;
  description?: string;
  unitPrice: number;
  quantity: number;
}

export interface CreateStripeCheckoutSessionVm {
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
  items: StripeCheckoutLineItemVm[];
}

export interface StripeCheckoutSessionVm {
  sessionId: string;
  url: string;
  status: string;
}

