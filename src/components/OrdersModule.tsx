import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  RotateCcw,
  Trash2,
  Plus,
  Search,
} from 'lucide-react';
import {
  CATALOG,
  VOLUME_DISCOUNT_RATE,
  VOLUME_DISCOUNT_THRESHOLD,
} from '../data/catalog';
import { AlertTone, Order, OrderStatus } from '../types/studio';
import {
  formatLempiras,
  generateOrderId,
  getAlertStatus,
  getOffsetDate,
} from '../utils/orders';

interface OrdersModuleProps {
  orders: Order[];
  onAddOrder: (order: Order) => void;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onDeleteOrder: (id: string) => void;
  onResetDemo: () => void;
}

type FilterView = 'todos' | 'urgentes' | 'proximos' | 'tiempo' | 'entregados';

const STATUS_OPTIONS: OrderStatus[] = [
  'Pendiente',
  'En Producción',
  'Listo',
  'Entregado',
];

function renderAlertIndicator(tone: AlertTone, label: string) {
  if (tone === 'red') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 whitespace-nowrap">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        {label}
      </span>
    );
  }
  if (tone === 'yellow') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800 whitespace-nowrap">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        {label}
      </span>
    );
  }
  if (tone === 'green') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 whitespace-nowrap">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 whitespace-nowrap">
      {label}
    </span>
  );
}

export function OrdersModule({
  orders,
  onAddOrder,
  onUpdateStatus,
  onDeleteOrder,
  onResetDemo,
}: OrdersModuleProps) {
  const [client, setClient] = useState('');
  const [phone, setPhone] = useState('');
  const [productId, setProductId] = useState(CATALOG[0].id);
  const [qty, setQty] = useState(1);
  const [deliveryDate, setDeliveryDate] = useState(() => getOffsetDate(2));
  const [searchQuery, setSearchQuery] = useState('');
  const [filterView, setFilterView] = useState<FilterView>('todos');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const selectedProduct = useMemo(
    () => CATALOG.find((p) => p.id === productId) ?? CATALOG[0],
    [productId]
  );

  const previewPricing = useMemo(() => {
    const safeQty = Math.max(1, qty || 1);
    const subtotal = selectedProduct.price * safeQty;
    const hasDiscount = safeQty >= VOLUME_DISCOUNT_THRESHOLD;
    const discount = hasDiscount ? subtotal * VOLUME_DISCOUNT_RATE : 0;
    return {
      subtotal,
      discount,
      total: subtotal - discount,
      hasDiscount,
    };
  }, [selectedProduct, qty]);

  const metrics = useMemo(() => {
    let active = 0;
    let urgent = 0;
    let soon = 0;
    let done = 0;

    for (const order of orders) {
      const alert = getAlertStatus(order);
      if (order.status === 'Entregado') {
        done++;
      } else {
        active++;
        if (alert.priority === 1) urgent++;
        else if (alert.priority === 2) soon++;
      }
    }
    return { active, urgent, soon, done };
  }, [orders]);

  const sortedAndFilteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders
      .map((order) => ({ order, alert: getAlertStatus(order) }))
      .filter(({ order, alert }) => {
        if (filterView === 'urgentes' && alert.priority !== 1) return false;
        if (filterView === 'proximos' && alert.priority !== 2) return false;
        if (filterView === 'tiempo' && alert.priority !== 3) return false;
        if (filterView === 'entregados' && order.status !== 'Entregado') return false;
        if (!q) return true;
        return (
          order.id.toLowerCase().includes(q) ||
          order.client.toLowerCase().includes(q) ||
          order.productName.toLowerCase().includes(q) ||
          order.phone.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.alert.priority !== b.alert.priority) {
          return a.alert.priority - b.alert.priority;
        }
        return a.order.deliveryDate.localeCompare(b.order.deliveryDate);
      });
  }, [orders, searchQuery, filterView]);

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client.trim() || !phone.trim() || !deliveryDate) return;

    const newOrder: Order = {
      id: generateOrderId(),
      client: client.trim(),
      phone: phone.trim(),
      productName: selectedProduct.name,
      qty: Math.max(1, qty),
      total: previewPricing.total,
      deliveryDate,
      status: 'Pendiente',
      source: 'Tienda',
    };

    onAddOrder(newOrder);
    setClient('');
    setPhone('');
    setQty(1);
    setDeliveryDate(getOffsetDate(2));
  };

  return (
    <section aria-labelledby="orders-heading" className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-blue-700">
            03. Innovación de Procesos · Reemplazo del Registro Físico
          </p>
          <h2
            id="orders-heading"
            className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl text-balance"
          >
            Control Digital de Pedidos y Alertas de Entrega
          </h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Calcula automáticamente los días restantes contra la fecha de entrega y ordena la cola de producción por semáforo de urgencia.
          </p>
        </div>

        <button
          type="button"
          onClick={onResetDemo}
          className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
        >
          <RotateCcw className="h-4 w-4" />
          Restaurar datos de ejemplo
        </button>
      </div>

      {/* KPI Strip — full width, hairline borders, no thick left bars */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Pedidos Activos</p>
          <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-slate-900">
            {metrics.active}
          </p>
          <p className="mt-1 text-xs text-slate-500">En cola de taller</p>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50/60 p-5">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-red-700">
            <AlertTriangle className="h-3.5 w-3.5" />
            Urgentes / Vencen Hoy
          </p>
          <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-red-700">
            {metrics.urgent}
          </p>
          <p className="mt-1 text-xs text-red-700/80">Prioridad inmediata</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
            <Clock className="h-3.5 w-3.5" />
            Próximos (1–3 días)
          </p>
          <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-amber-800">
            {metrics.soon}
          </p>
          <p className="mt-1 text-xs text-amber-800/80">Seguimiento en producción</p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Entregados
          </p>
          <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-emerald-700">
            {metrics.done}
          </p>
          <p className="mt-1 text-xs text-emerald-700/80">Cerrados satisfactoriamente</p>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr] lg:items-start">
        {/* Formulario de Registro en Tienda */}
        <form
          onSubmit={handleSubmitOrder}
          className="rounded-xl border border-slate-200 bg-white p-5 space-y-4"
        >
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">
              Registrar Pedido en Tienda
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Ingreso manual en mostrador o por teléfono.
            </p>
          </div>

          <div>
            <label
              htmlFor="ord-client"
              className="block text-xs font-semibold text-slate-700"
            >
              Nombre del Cliente
            </label>
            <input
              id="ord-client"
              type="text"
              required
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Ej. María Fernández"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="ord-phone"
              className="block text-xs font-semibold text-slate-700"
            >
              Teléfono / WhatsApp
            </label>
            <input
              id="ord-phone"
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej. 9988-7766"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="ord-product"
              className="block text-xs font-semibold text-slate-700"
            >
              Producto
            </label>
            <select
              id="ord-product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
            >
              {CATALOG.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({formatLempiras(p.price)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="ord-qty"
                className="block text-xs font-semibold text-slate-700"
              >
                Cantidad
              </label>
              <input
                id="ord-qty"
                type="number"
                min={1}
                required
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-blue-700 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="ord-date"
                className="block text-xs font-semibold text-slate-700"
              >
                Fecha de Entrega
              </label>
              <input
                id="ord-date"
                type="date"
                required
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-blue-700 focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums">
                {formatLempiras(previewPricing.subtotal)}
              </span>
            </div>
            {previewPricing.hasDiscount && (
              <div className="mt-1 flex justify-between font-medium text-emerald-700">
                <span>Descuento volumen (10%)</span>
                <span className="font-mono tabular-nums">
                  -{formatLempiras(previewPricing.discount)}
                </span>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
              <span>Total a registrar</span>
              <span className="font-mono tabular-nums text-blue-700">
                {formatLempiras(previewPricing.total)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
          >
            <Plus className="h-4 w-4" />
            Guardar Pedido en Sistema
          </button>
        </form>

        {/* Tablero y Tabla de Pedidos */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Tablero de Pedidos y Semáforo
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar ID o cliente..."
                  aria-label="Buscar pedido por ID o cliente"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:bg-white focus:outline-none sm:w-44"
                />
              </div>

              <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
                {(
                  [
                    ['todos', 'Todos'],
                    ['urgentes', 'Urgentes'],
                    ['proximos', 'Próximos'],
                    ['tiempo', 'En tiempo'],
                    ['entregados', 'Entregados'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilterView(key)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                      filterView === key
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {sortedAndFilteredOrders.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-semibold text-slate-900">
                No hay pedidos que coincidan con este filtro
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Registra un nuevo pedido desde el formulario o limpia los filtros activos.
              </p>
              {(searchQuery || filterView !== 'todos') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterView('todos');
                  }}
                  className="mt-4 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Ver todos los pedidos
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Detalle</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3">Entrega</th>
                    <th className="px-4 py-3">Alerta</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedAndFilteredOrders.map(({ order, alert }) => (
                    <tr
                      key={order.id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-semibold tabular-nums text-slate-900 whitespace-nowrap">
                        {order.id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {order.client}
                        </div>
                        <div className="text-xs text-slate-500">
                          {order.phone}
                          {order.source ? ` · ${order.source}` : ''}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-[200px] truncate font-medium text-slate-800">
                          {order.productName}
                        </div>
                        <div className="font-mono text-xs tabular-nums text-slate-500">
                          Cant: {order.qty} ud{order.qty === 1 ? '' : 's'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-semibold tabular-nums text-slate-900 whitespace-nowrap">
                        {formatLempiras(order.total)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs tabular-nums text-slate-700 whitespace-nowrap">
                        {order.deliveryDate}
                      </td>
                      <td className="px-4 py-3">
                        {renderAlertIndicator(alert.tone, alert.label)}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          aria-label={`Cambiar estado del pedido ${order.id}`}
                          value={order.status}
                          onChange={(e) =>
                            onUpdateStatus(order.id, e.target.value as OrderStatus)
                          }
                          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-800 focus:border-blue-700 focus:outline-none"
                        >
                          {STATUS_OPTIONS.map((statusOpt) => (
                            <option key={statusOpt} value={statusOpt}>
                              {statusOpt}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {confirmDeleteId === order.id ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteOrder(order.id);
                                setConfirmDeleteId(null);
                              }}
                              className="rounded bg-red-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-red-700"
                            >
                              Borrar
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(order.id)}
                            aria-label={`Eliminar pedido ${order.id}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
