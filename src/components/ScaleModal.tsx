import { useEffect } from 'react';
import { Ruler, X, MessageSquare } from 'lucide-react';
import { Product } from '../types/studio';
import { formatLempiras } from '../utils/orders';

interface ScaleModalProps {
  product: Product | null;
  onClose: () => void;
  onQuote: (product: Product) => void;
}

const PX_PER_CM = 10;
const CARD_WIDTH_CM = 8.5;
const CARD_HEIGHT_CM = 5.4;

export function ScaleModal({ product, onClose, onQuote }: ScaleModalProps) {
  useEffect(() => {
    if (!product) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [product, onClose]);

  if (!product) return null;

  const prodWidthPx = Math.round(product.widthCm * PX_PER_CM);
  const prodHeightPx = Math.round(product.heightCm * PX_PER_CM);
  const cardWidthPx = Math.round(CARD_WIDTH_CM * PX_PER_CM);
  const cardHeightPx = Math.round(CARD_HEIGHT_CM * PX_PER_CM);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scale-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-medium text-blue-700">
              {product.category} · Código {product.sku}
            </p>
            <h3
              id="scale-modal-title"
              className="mt-1 text-xl font-bold text-slate-900"
            >
              {product.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar comparador de escala"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 border-b border-slate-200 pb-4 text-sm text-slate-700 sm:grid-cols-2">
          <div>
            <span className="block text-xs text-slate-500">Material</span>
            <span className="font-medium text-slate-900">{product.material}</span>
          </div>
          <div>
            <span className="block text-xs text-slate-500">Dimensiones exactas</span>
            <span className="font-mono font-semibold tabular-nums text-slate-900">
              {product.heightCm} cm alto × {product.widthCm} cm ancho
            </span>
          </div>
          <div>
            <span className="block text-xs text-slate-500">Capacidad / Espesor</span>
            <span className="font-medium text-slate-900">{product.volume}</span>
          </div>
          <div>
            <span className="block text-xs text-slate-500">Precio base unitario</span>
            <span className="font-mono font-semibold tabular-nums text-blue-700">
              {formatLempiras(product.price)}{' '}
              <span className="font-sans text-xs font-normal text-slate-500">
                (+ {formatLempiras(product.customExtra)} si requiere diseño)
              </span>
            </span>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Ruler className="h-4 w-4 text-blue-700" />
              Comparativa Visual a Escala Real (1 cuadro = 1 cm × 1 cm)
            </h4>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              Escala: 1 cm = 10 px
            </span>
          </div>

          <div className="bg-metric-grid relative mt-3 flex min-h-[320px] items-end justify-center gap-8 overflow-x-auto rounded-lg border border-slate-300 px-6 pb-8 pt-12 sm:gap-12">
            <div className="absolute left-3 top-3 rounded border border-slate-200 bg-white/95 px-2.5 py-1 font-mono text-[11px] font-medium text-slate-700">
              Cuadrícula fina: 1 cm · Cuadrícula mayor: 5 cm
            </div>

            <div className="flex flex-col items-center">
              <div
                style={{ width: `${cardWidthPx}px`, height: `${cardHeightPx}px` }}
                className="flex flex-col items-center justify-center rounded border-2 border-dashed border-slate-500 bg-slate-500/10 p-1 text-center"
              >
                <span className="font-mono text-[10px] font-semibold text-slate-700">
                  ID / Tarjeta
                </span>
              </div>
              <span className="mt-2.5 text-xs font-semibold text-slate-800">
                Referencia Estándar
              </span>
              <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                {CARD_WIDTH_CM} × {CARD_HEIGHT_CM} cm
              </span>
            </div>

            <div className="flex flex-col items-center">
              <div
                style={{ width: `${prodWidthPx}px`, height: `${prodHeightPx}px` }}
                className="flex flex-col items-center justify-center rounded border-2 border-blue-700 bg-blue-700/10 p-2 text-center"
              >
                <span className="font-mono text-xs font-bold text-blue-800 tabular-nums">
                  {product.widthCm} × {product.heightCm} cm
                </span>
              </div>
              <span className="mt-2.5 max-w-[180px] text-center text-xs font-semibold text-slate-900">
                {product.name}
              </span>
              <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                {product.heightCm} cm alto × {product.widthCm} cm ancho
              </span>
            </div>
          </div>

          <p className="mt-2.5 text-xs text-slate-500">
            Proporción exacta comparada con una tarjeta de identidad o crédito estándar (8.5 × 5.4 cm) para eliminar dudas de tamaño antes de ordenar.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={() => onQuote(product)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0"
          >
            <MessageSquare className="h-4 w-4" />
            Cotizar este producto con el Bot
          </button>
        </div>
      </div>
    </div>
  );
}
