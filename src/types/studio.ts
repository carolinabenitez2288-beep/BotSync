export type ProductCategory =
  | 'Sublimación'
  | 'Grabado Láser'
  | 'Fotografía e Impresión';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  material: string;
  volume: string;
  widthCm: number;
  heightCm: number;
  price: number;
  customExtra: number;
  prodDays: number;
  desc: string;
  imageUrl: string;
}

export type OrderStatus =
  | 'Pendiente'
  | 'En Producción'
  | 'Listo'
  | 'Entregado';

export interface Order {
  id: string;
  client: string;
  phone: string;
  productName: string;
  qty: number;
  total: number;
  deliveryDate: string; // YYYY-MM-DD
  status: OrderStatus;
  source?: 'Tienda' | 'Bot Omnicanal';
}

export type AlertPriority = 1 | 2 | 3 | 4;
export type AlertTone = 'red' | 'yellow' | 'green' | 'neutral';

export interface AlertInfo {
  label: string;
  tone: AlertTone;
  priority: AlertPriority;
  daysDiff: number;
}

export type AppTab = 'catalogo' | 'bot' | 'pedidos';
