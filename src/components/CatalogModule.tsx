import { useMemo, useState } from 'react';
import { Ruler, MessageSquare, Search, Image as ImageIcon } from 'lucide-react';
import { CATALOG } from '../data/catalog';
import { Product, ProductCategory } from '../types/studio';
import { formatLempiras } from '../utils/orders';

interface CatalogModuleProps {
  onOpenScale: (product: Product) => void;
  onStartQuote: (product: Product) => void;
}

const CATEGORIES: Array<'Todos' | ProductCategory> = [
  'Todos',
  'Sublimación',
  'Grabado Láser',
  'Fotografía e Impresión',
];

export function CatalogModule({ onOpenScale, onStartQuote }: CatalogModuleProps) {
  const [selectedCategory, setSelectedCategory] = useState<'Todos' | ProductCategory>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return CATALOG.filter((item) => {
      const matchesCat =
        selectedCategory === 'Todos' || item.category === selectedCategory;
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.material.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <section aria-labelledby="catalog-heading" className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-blue-700">
            01. Transparencia en la Propuesta de Valor · Villanueva, Cortés
          </p>
          <h2
            id="catalog-heading"
            className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl text-balance"
          >
            Catálogo Digitalizado y Especificaciones Técnicas
          </h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Consulta materiales exactos, volumen, tiempo de entrega y compara cualquier artículo en nuestra cuadrícula proporcional a escala real de 1 cm.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar producto o material..."
              aria-label="Buscar producto o material"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none sm:w-56"
            />
          </div>

          <div
            role="tablist"
            aria-label="Filtrar catálogo por categoría"
            className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1"
          >
            {CATEGORIES.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
          <p className="text-base font-semibold text-slate-900">
            No se encontraron productos para "{searchQuery}"
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Prueba limpiando el filtro de búsqueda o seleccionando otra categoría.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('Todos');
            }}
            className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Mostrar todo el catálogo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const imgFailed = failedImages[product.id];
            return (
              <article
                key={product.id}
                className="flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div>
                  <div className="relative aspect-4/3 w-full overflow-hidden border-b border-slate-200 bg-slate-100">
                    {!imgFailed ? (
                      <img
                        src={product.imageUrl}
                        alt={`${product.name} — ${product.material}`}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [product.id]: true }))
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-slate-100 p-4 text-center text-slate-500">
                        <ImageIcon className="h-8 w-8 text-slate-400" />
                        <span className="text-xs font-medium text-slate-600">
                          {product.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-medium text-blue-700">{product.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{product.sku}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Entrega: {product.prodDays} día{product.prodDays === 1 ? '' : 's'}
                      </span>
                    </div>

                    <h3 className="mt-1.5 text-lg font-semibold text-slate-900">
                      {product.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">{product.desc}</p>

                    <dl className="mt-4 divide-y divide-slate-100 border-t border-slate-100 text-xs">
                      <div className="flex justify-between gap-3 py-2">
                        <dt className="text-slate-500 shrink-0">Material</dt>
                        <dd className="text-right font-medium text-slate-800">
                          {product.material}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3 py-2">
                        <dt className="text-slate-500 shrink-0">Medidas exactas</dt>
                        <dd className="font-mono font-medium tabular-nums text-slate-900">
                          {product.heightCm} × {product.widthCm} cm
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3 py-2">
                        <dt className="text-slate-500 shrink-0">Capacidad / Espesor</dt>
                        <dd className="text-right font-medium text-slate-800">
                          {product.volume}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono text-xl font-bold tabular-nums text-slate-900">
                      {formatLempiras(product.price)}
                    </span>
                    <span className="text-xs font-medium text-emerald-700">
                      10% desc. desde 12 uds
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => onOpenScale(product)}
                      className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 whitespace-nowrap"
                    >
                      <Ruler className="h-3.5 w-3.5 text-blue-700" />
                      Escala Real
                    </button>
                    <button
                      type="button"
                      onClick={() => onStartQuote(product)}
                      className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Cotizar
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
