import { AlertInfo, Order } from '../types/studio';

const STORAGE_KEY = 'fet_orders_v1';
const WA_NUMBER_KEY = 'fet_wa_number_v1';
const DEFAULT_WA_NUMBER = '50499990000';

export function getOffsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDefaultOrders(): Order[] {
  return [
    {
      id: 'FET-101',
      client: 'Escuela Bilingüe Valle',
      phone: '9845-1122',
      productName: 'Placa Conmemorativa Acrílico/Madera',
      qty: 5,
      total: 3250,
      deliveryDate: getOffsetDate(0),
      status: 'En Producción',
      source: 'Tienda',
    },
    {
      id: 'FET-102',
      client: 'Carlos Mendoza',
      phone: '9912-3344',
      productName: 'Cuadro Fotográfico Enmarcado (8×10")',
      qty: 2,
      total: 760,
      deliveryDate: getOffsetDate(-1),
      status: 'Pendiente',
      source: 'Bot Omnicanal',
    },
    {
      id: 'FET-103',
      client: 'Cooperativa Cortés',
      phone: '3310-8899',
      productName: 'Termo Acero Grabado Láser',
      qty: 20,
      total: 7560,
      deliveryDate: getOffsetDate(2),
      status: 'En Producción',
      source: 'Tienda',
    },
    {
      id: 'FET-104',
      client: 'Ana Lucía Paz',
      phone: '8876-5432',
      productName: 'Taza Cerámica Sublimada',
      qty: 6,
      total: 960,
      deliveryDate: getOffsetDate(6),
      status: 'Pendiente',
      source: 'Bot Omnicanal',
    },
    {
      id: 'FET-105',
      client: 'José Aguilar',
      phone: '9544-2010',
      productName: 'Llavero Personalizado Láser',
      qty: 30,
      total: 1755,
      deliveryDate: getOffsetDate(-2),
      status: 'Entregado',
      source: 'Tienda',
    },
  ];
}

export function loadOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaults = getDefaultOrders();
      saveOrders(defaults);
      return defaults;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : getDefaultOrders();
  } catch {
    return getDefaultOrders();
  }
}

export function saveOrders(orders: Order[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // Ignore storage quota issues in restricted environments
  }
}

export function loadWhatsAppNumber(): string {
  try {
    return localStorage.getItem(WA_NUMBER_KEY) || DEFAULT_WA_NUMBER;
  } catch {
    return DEFAULT_WA_NUMBER;
  }
}

export function saveWhatsAppNumber(phone: string): void {
  try {
    const cleaned = phone.replace(/\D/g, '');
    localStorage.setItem(WA_NUMBER_KEY, cleaned || DEFAULT_WA_NUMBER);
  } catch {
    // Ignore storage issues
  }
}

export function getAlertStatus(order: Order): AlertInfo {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = order.deliveryDate.split('-').map(Number);
  const due = new Date(y, m - 1, d);
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (order.status === 'Entregado') {
    return { label: 'Completado', tone: 'neutral', priority: 4, daysDiff: diffDays };
  }

  if (diffDays < 0) {
    return {
      label: `Atrasado (${Math.abs(diffDays)}d)`,
      tone: 'red',
      priority: 1,
      daysDiff: diffDays,
    };
  }

  if (diffDays === 0) {
    return {
      label: 'Vence hoy',
      tone: 'red',
      priority: 1,
      daysDiff: diffDays,
    };
  }

  if (diffDays <= 3) {
    return {
      label: `En ${diffDays} día${diffDays === 1 ? '' : 's'}`,
      tone: 'yellow',
      priority: 2,
      daysDiff: diffDays,
    };
  }

  return {
    label: `En tiempo (${diffDays}d)`,
    tone: 'green',
    priority: 3,
    daysDiff: diffDays,
  };
}

export function formatLempiras(amount: number): string {
  return `L. ${amount.toLocaleString('es-HN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function generateOrderId(): string {
  return `FET-${Math.floor(100 + Math.random() * 900)}`;
}
