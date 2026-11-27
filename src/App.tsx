import { useEffect, useMemo, useState } from 'react';
import { CatalogModule } from './components/CatalogModule';
import { BotModule } from './components/BotModule';
import { OrdersModule } from './components/OrdersModule';
import { ScaleModal } from './components/ScaleModal';
import { AppTab, Order, OrderStatus, Product } from './types/studio';
import {
  getAlertStatus,
  getDefaultOrders,
  loadOrders,
  saveOrders,
} from './utils/orders';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('catalogo');
  const [orders, setOrders] = useState<Order[]>(() => loadOrders());
  const [scaleProduct, setScaleProduct] = useState<Product | null>(null);
  const [botPreselectedProduct, setBotPreselectedProduct] =
    useState<Product | null>(null);

  useEffect(() => {
    saveOrders(orders);
  }, [orders]);

  const urgentCount = useMemo(() => {
    return orders.filter(
      (order) =>
        order.status !== 'Entregado' && getAlertStatus(order).priority === 1
    ).length;
  }, [orders]);

  const handleStartQuote = (product: Product) => {
    setScaleProduct(null);
    setBotPreselectedProduct(product);
    setActiveTab('bot');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddOrder = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
  };

  const handleUpdateOrderStatus = (id: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, status } : order))
    );
  };

  const handleDeleteOrder = (id: string) => {
    setOrders((prev) => prev.filter((order) => order.id !== id));
  };

  const handleResetDemoOrders = () => {
    setOrders(getDefaultOrders());
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FA] text-slate-900">
      {/* Top Bar: strict 3-zone single-row contract */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('catalogo')}
            className="text-left font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
          >
            Foto Estudio Tejada
          </button>

          {/* Zone 2: Clean single-line text navigation */}
          <nav
            aria-label="Módulos del sistema"
            className="hidden md:flex items-center gap-7"
          >
            <button
              type="button"
              onClick={() => setActiveTab('catalogo')}
              className={`border-b-2 py-5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'catalogo'
                  ? 'border-blue-700 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Catálogo y Escala
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bot')}
              className={`border-b-2 py-5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'bot'
                  ? 'border-blue-700 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Bot Cotizador
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pedidos')}
              className={`border-b-2 py-5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'pedidos'
                  ? 'border-blue-700 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Control de Pedidos
              {urgentCount > 0 && (
                <span className="ml-1.5 font-mono text-xs font-semibold tabular-nums text-red-600">
                  ({urgentCount})
                </span>
              )}
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab('bot');
              }}
              className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0"
            >
              Cotizar Producto
            </button>
          </div>
        </div>

        {/* Mobile module selector */}
        <nav
          aria-label="Módulos móviles"
          className="flex border-t border-slate-100 px-4 md:hidden"
        >
          <button
            type="button"
            onClick={() => setActiveTab('catalogo')}
            className={`flex-1 border-b-2 py-2.5 text-center text-xs font-medium whitespace-nowrap ${
              activeTab === 'catalogo'
                ? 'border-blue-700 text-slate-900'
                : 'border-transparent text-slate-600'
            }`}
          >
            Catálogo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bot')}
            className={`flex-1 border-b-2 py-2.5 text-center text-xs font-medium whitespace-nowrap ${
              activeTab === 'bot'
                ? 'border-blue-700 text-slate-900'
                : 'border-transparent text-slate-600'
            }`}
          >
            Bot Cotizador
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pedidos')}
            className={`flex-1 border-b-2 py-2.5 text-center text-xs font-medium whitespace-nowrap ${
              activeTab === 'pedidos'
                ? 'border-blue-700 text-slate-900'
                : 'border-transparent text-slate-600'
            }`}
          >
            Pedidos{urgentCount > 0 ? ` (${urgentCount})` : ''}
          </button>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {activeTab === 'catalogo' && (
          <CatalogModule
            onOpenScale={(prod) => setScaleProduct(prod)}
            onStartQuote={handleStartQuote}
          />
        )}

        {activeTab === 'bot' && (
          <BotModule
            preselectedProduct={botPreselectedProduct}
            onClearPreselected={() => setBotPreselectedProduct(null)}
            onOrderCreated={handleAddOrder}
            onNavigateToOrders={() => setActiveTab('pedidos')}
          />
        )}

        {activeTab === 'pedidos' && (
          <OrdersModule
            orders={orders}
            onAddOrder={handleAddOrder}
            onUpdateStatus={handleUpdateOrderStatus}
            onDeleteOrder={handleDeleteOrder}
            onResetDemo={handleResetDemoOrders}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-xs text-slate-500 sm:flex-row sm:px-6">
          <span>
            Foto Estudio Tejada · Fundado en 1986 · Villanueva, Cortés
          </span>
          <span>
            Catálogo Escala Real · Cotizador Omnicanal · Control de Entregas
          </span>
        </div>
      </footer>

      <ScaleModal
        product={scaleProduct}
        onClose={() => setScaleProduct(null)}
        onQuote={handleStartQuote}
      />
    </div>
  );
}
