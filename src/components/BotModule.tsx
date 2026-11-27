import { useEffect, useRef, useState } from 'react';
import {
  RotateCcw,
  Send,
  Check,
  MessageCircle,
  ClipboardCheck,
  ArrowRight,
  Phone,
} from 'lucide-react';
import {
  CATALOG,
  VOLUME_DISCOUNT_RATE,
  VOLUME_DISCOUNT_THRESHOLD,
} from '../data/catalog';
import { Order, Product } from '../types/studio';
import {
  formatLempiras,
  generateOrderId,
  getOffsetDate,
  loadWhatsAppNumber,
  saveWhatsAppNumber,
} from '../utils/orders';

interface BotModuleProps {
  preselectedProduct: Product | null;
  onClearPreselected: () => void;
  onOrderCreated: (order: Order) => void;
  onNavigateToOrders: () => void;
}

type BotStep = 'menu' | 'product' | 'design' | 'qty' | 'client' | 'date' | 'summary' | 'confirmed';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
}

interface QuoteDraft {
  product: Product | null;
  customDesign: boolean;
  qty: number;
  client: string;
  date: string;
  total: number;
  discount: number;
}

export function BotModule({
  preselectedProduct,
  onClearPreselected,
  onOrderCreated,
  onNavigateToOrders,
}: BotModuleProps) {
  const [step, setStep] = useState<BotStep>('menu');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState<QuoteDraft>({
    product: null,
    customDesign: false,
    qty: 1,
    client: '',
    date: getOffsetDate(2),
    total: 0,
    discount: 0,
  });
  const [textInput, setTextInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [waNumber, setWaNumber] = useState<string>(() => loadWhatsAppNumber());
  const [waSavedFeedback, setWaSavedFeedback] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const pushMessage = (sender: 'bot' | 'user', text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, sender, text },
    ]);
  };

  const resetConversation = (productToSelect?: Product | null) => {
    setInputError('');
    setTextInput('');
    const initialBotMsg: ChatMessage = {
      id: `init-${Date.now()}`,
      sender: 'bot',
      text: '¡Hola! Bienvenido a Foto Estudio Tejada (Villanueva, Cortés).\n¿En qué puedo ayudarte hoy?',
    };

    if (productToSelect) {
      setMessages([
        initialBotMsg,
        {
          id: `u-sel-${Date.now()}`,
          sender: 'user',
          text: `Cotizar: ${productToSelect.name}`,
        },
        {
          id: `b-sel-${Date.now() + 1}`,
          sender: 'bot',
          text: `Has elegido: ${productToSelect.name}\nMedidas reales: ${productToSelect.heightCm} × ${productToSelect.widthCm} cm\nMaterial: ${productToSelect.material}\n\n¿Ya tienes tu diseño o arte listo, o necesitas que nuestro equipo lo diseñe?`,
        },
      ]);
      setDraft({
        product: productToSelect,
        customDesign: false,
        qty: 1,
        client: '',
        date: getOffsetDate(productToSelect.prodDays),
        total: 0,
        discount: 0,
      });
      setStep('design');
    } else {
      setMessages([initialBotMsg]);
      setDraft({
        product: null,
        customDesign: false,
        qty: 1,
        client: '',
        date: getOffsetDate(2),
        total: 0,
        discount: 0,
      });
      setStep('menu');
    }
  };

  useEffect(() => {
    if (preselectedProduct) {
      resetConversation(preselectedProduct);
      onClearPreselected();
    } else if (messages.length === 0) {
      resetConversation(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedProduct]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, step]);

  const handleChooseProductMenu = () => {
    pushMessage('user', 'Cotizar un producto');
    pushMessage(
      'bot',
      'Excelente. Selecciona el producto del catálogo que deseas cotizar:'
    );
    setStep('product');
  };

  const handleShowHours = () => {
    pushMessage('user', 'Horarios y ubicación');
    pushMessage(
      'bot',
      'Estamos ubicados en el centro de Villanueva, Cortés.\nHorario: Lunes a Sábado de 8:00 a.m. a 5:30 p.m.\nAtendemos cotizaciones y pedidos por WhatsApp, Facebook y en tienda física.'
    );
    setStep('menu');
  };

  const handleSelectProduct = (prod: Product) => {
    setDraft((prev) => ({
      ...prev,
      product: prod,
      date: getOffsetDate(prod.prodDays),
    }));
    pushMessage('user', prod.name);
    pushMessage(
      'bot',
      `Has elegido: ${prod.name}\nMedidas reales: ${prod.heightCm} × ${prod.widthCm} cm\nMaterial: ${prod.material}\n\n¿Ya tienes tu diseño o arte listo, o necesitas que nuestro equipo lo diseñe?`
    );
    setStep('design');
  };

  const handleSelectDesign = (needsDesign: boolean) => {
    setDraft((prev) => ({ ...prev, customDesign: needsDesign }));
    pushMessage(
      'user',
      needsDesign ? 'Necesito que hagan el diseño' : 'Ya tengo el diseño listo'
    );
    pushMessage(
      'bot',
      `¿Cuántas unidades deseas cotizar? (A partir de ${VOLUME_DISCOUNT_THRESHOLD} unidades se aplica automáticamente un 10% de descuento por volumen).`
    );
    setTextInput('');
    setInputError('');
    setStep('qty');
  };

  const handleSelectQty = (rawQty: number | string) => {
    const parsed = typeof rawQty === 'number' ? rawQty : parseInt(rawQty, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 10000) {
      setInputError('Ingresa una cantidad válida mayor a 0.');
      return;
    }
    setInputError('');
    setDraft((prev) => ({ ...prev, qty: parsed }));
    pushMessage('user', `${parsed} unidad${parsed === 1 ? '' : 'es'}`);
    pushMessage('bot', 'Perfecto. ¿A nombre de quién emitimos esta cotización?');
    setTextInput('');
    setStep('client');
  };

  const handleSubmitClient = (name: string) => {
    const cleaned = name.trim();
    if (cleaned.length < 2) {
      setInputError('Escribe el nombre completo del cliente.');
      return;
    }
    setInputError('');
    const suggestedDate = draft.product
      ? getOffsetDate(draft.product.prodDays)
      : getOffsetDate(2);
    setDraft((prev) => ({ ...prev, client: cleaned, date: suggestedDate }));
    pushMessage('user', cleaned);
    pushMessage(
      'bot',
      `Gracias, ${cleaned}. ¿Para qué fecha necesitas tu pedido? (Tiempo sugerido de producción: ${draft.product?.prodDays ?? 2} día(s)).`
    );
    setTextInput(suggestedDate);
    setStep('date');
  };

  const handleSubmitDate = (dateStr: string) => {
    if (!dateStr) {
      setInputError('Selecciona una fecha de entrega válida.');
      return;
    }
    const p = draft.product;
    if (!p) return;

    const unitExtra = draft.customDesign ? p.customExtra : 0;
    const subtotal = (p.price + unitExtra) * draft.qty;
    const discount =
      draft.qty >= VOLUME_DISCOUNT_THRESHOLD ? subtotal * VOLUME_DISCOUNT_RATE : 0;
    const total = subtotal - discount;

    setInputError('');
    setDraft((prev) => ({ ...prev, date: dateStr, total, discount }));
    pushMessage('user', dateStr);

    const summary =
      `RESUMEN DE COTIZACIÓN AUTOMÁTICA\n` +
      `Cliente: ${draft.client}\n` +
      `Producto: ${p.name} (${p.heightCm} × ${p.widthCm} cm)\n` +
      `Cantidad: ${draft.qty} ud(s)\n` +
      `Diseño: ${draft.customDesign ? `Incluido (+${formatLempiras(unitExtra)}/u)` : 'Enviado por cliente'}\n` +
      `Fecha solicitada: ${dateStr}\n` +
      (discount > 0
        ? `Descuento volumen (10%): -${formatLempiras(discount)}\n`
        : '') +
      `TOTAL ESTIMADO: ${formatLempiras(total)}`;

    pushMessage('bot', summary);
    setTextInput('');
    setStep('summary');
  };

  const handleConfirmOrder = () => {
    if (!draft.product) return;
    const newOrder: Order = {
      id: generateOrderId(),
      client: draft.client,
      phone: 'Bot Web/FB',
      productName: draft.product.name,
      qty: draft.qty,
      total: draft.total,
      deliveryDate: draft.date,
      status: 'Pendiente',
      source: 'Bot Omnicanal',
    };
    onOrderCreated(newOrder);
    pushMessage(
      'bot',
      `Pedido ${newOrder.id} registrado en el Panel de Control con alerta automática para el ${newOrder.deliveryDate}.`
    );
    setStep('confirmed');
  };

  const handleTextFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'qty') handleSelectQty(textInput);
    else if (step === 'client') handleSubmitClient(textInput);
    else if (step === 'date') handleSubmitDate(textInput);
  };

  const waHref = (() => {
    if (!draft.product) return '#';
    const message = encodeURIComponent(
      `¡Hola Foto Estudio Tejada! Realicé esta cotización en su asistente:\n` +
        `• Cliente: ${draft.client}\n` +
        `• Producto: ${draft.product.name} (${draft.qty} uds)\n` +
        `• Medidas: ${draft.product.heightCm} × ${draft.product.widthCm} cm\n` +
        `• Entrega deseada: ${draft.date}\n` +
        `• Total cotizado: ${formatLempiras(draft.total)}`
    );
    const cleanPhone = waNumber.replace(/\D/g, '') || '50499990000';
    return `https://wa.me/${cleanPhone}?text=${message}`;
  })();

  const handleSaveWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    saveWhatsAppNumber(waNumber);
    setWaSavedFeedback(true);
    setTimeout(() => setWaSavedFeedback(false), 2000);
  };

  const showTextInput = step === 'qty' || step === 'client' || step === 'date';

  return (
    <section aria-labelledby="bot-heading" className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-blue-700">
            02. Orientación al Cliente y Omnicanalidad · Facebook y WhatsApp
          </p>
          <h2
            id="bot-heading"
            className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl text-balance"
          >
            Asistente Virtual de Cotizaciones
          </h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Flujo conversacional guiado que calcula precios en Lempiras sin error humano, aplica descuentos por volumen y registra pedidos directo al panel interno.
          </p>
        </div>

        <button
          type="button"
          onClick={() => resetConversation(null)}
          className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
        >
          <RotateCcw className="h-4 w-4" />
          Reiniciar Conversación
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-start">
        {/* Ventana de Chat */}
        <div className="flex h-[560px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-[#EFEAE2]">
          <div className="flex items-center justify-between bg-[#075E54] px-4 py-3.5 text-white">
            <div>
              <h3 className="text-sm font-semibold">TejadaBot · Asistente Virtual</h3>
              <p className="text-xs text-emerald-100">
                Cotización automática 24/7 · Canal WhatsApp / Facebook
              </p>
            </div>
            <span className="font-mono text-[11px] font-medium text-emerald-100">
              Árbol de Decisión
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] whitespace-pre-line rounded-xl px-3.5 py-2.5 text-sm leading-relaxed shadow-xs ${
                  m.sender === 'bot'
                    ? 'self-start rounded-tl-xs bg-white text-slate-900 mr-auto'
                    : 'self-end rounded-tr-xs bg-[#D9FDD3] text-slate-900 ml-auto'
                }`}
              >
                {m.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-200 bg-slate-50 p-3.5 space-y-3">
            {/* Quick Replies / Botones de acción por paso */}
            <div className="flex flex-wrap gap-2">
              {step === 'menu' && (
                <>
                  <button
                    type="button"
                    onClick={handleChooseProductMenu}
                    className="min-h-[38px] rounded-lg border border-[#075E54] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#075E54] transition-colors hover:bg-[#075E54] hover:text-white"
                  >
                    Cotizar un producto
                  </button>
                  <button
                    type="button"
                    onClick={handleShowHours}
                    className="min-h-[38px] rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    Horarios y ubicación
                  </button>
                </>
              )}

              {step === 'product' &&
                CATALOG.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handleSelectProduct(prod)}
                    className="min-h-[38px] rounded-lg border border-[#075E54]/40 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 transition-colors hover:border-[#075E54] hover:bg-emerald-50"
                  >
                    {prod.name} ·{' '}
                    <span className="font-mono font-semibold tabular-nums">
                      {formatLempiras(prod.price)}
                    </span>
                  </button>
                ))}

              {step === 'design' && draft.product && (
                <>
                  <button
                    type="button"
                    onClick={() => handleSelectDesign(false)}
                    className="min-h-[38px] rounded-lg border border-[#075E54] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#075E54] transition-colors hover:bg-[#075E54] hover:text-white"
                  >
                    Ya tengo diseño (+ L. 0.00)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectDesign(true)}
                    className="min-h-[38px] rounded-lg border border-[#075E54] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#075E54] transition-colors hover:bg-[#075E54] hover:text-white"
                  >
                    Necesito diseño (+ {formatLempiras(draft.product.customExtra)}/u)
                  </button>
                </>
              )}

              {step === 'qty' && (
                <>
                  {[1, 6, 12, 24].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleSelectQty(q)}
                      className="min-h-[38px] rounded-lg border border-[#075E54] bg-white px-3 py-1.5 text-xs font-semibold text-[#075E54] transition-colors hover:bg-[#075E54] hover:text-white"
                    >
                      {q} {q === 1 ? 'unidad' : 'unidades'}
                      {q >= 12 ? ' (-10%)' : ''}
                    </button>
                  ))}
                </>
              )}

              {step === 'summary' && (
                <div className="flex w-full flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmOrder}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800"
                  >
                    <ClipboardCheck className="h-4 w-4" />
                    Confirmar y Registrar en Sistema
                  </button>
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#128C7E] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#075E54]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Enviar por WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={() => resetConversation(null)}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Nueva Cotización
                  </button>
                </div>
              )}

              {step === 'confirmed' && (
                <div className="flex w-full flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onNavigateToOrders}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800"
                  >
                    Ir al Panel de Control
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#128C7E] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#075E54]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Enviar copia por WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={() => resetConversation(null)}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Otra Cotización
                  </button>
                </div>
              )}
            </div>

            {showTextInput && (
              <form onSubmit={handleTextFormSubmit} className="space-y-1.5">
                <div className="flex gap-2">
                  <input
                    type={
                      step === 'qty' ? 'number' : step === 'date' ? 'date' : 'text'
                    }
                    min={step === 'qty' ? 1 : undefined}
                    value={textInput}
                    onChange={(e) => {
                      setTextInput(e.target.value);
                      if (inputError) setInputError('');
                    }}
                    placeholder={
                      step === 'qty'
                        ? 'O escribe la cantidad exacta (ej. 15)...'
                        : step === 'client'
                          ? 'Escribe el nombre completo del cliente...'
                          : ''
                    }
                    className="min-h-[40px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0"
                  >
                    <span>Enviar</span>
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
                {inputError && (
                  <p className="text-xs font-medium text-red-600">{inputError}</p>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Panel Informativo y Configuración de WhatsApp */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-base font-bold text-slate-900">
              Lógica del Bot en la Estrategia de Innovación
            </h3>
            <ul className="mt-4 space-y-3.5 text-sm text-slate-600">
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  <strong className="font-semibold text-slate-900">
                    Atención inmediata 24/7:
                  </strong>{' '}
                  Estandariza preguntas frecuentes de Facebook y WhatsApp sin esperas manuales.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  <strong className="font-semibold text-slate-900">
                    Cálculo exacto sin error humano:
                  </strong>{' '}
                  Aplica precio base, costo de diseño personalizado y{' '}
                  <span className="font-medium text-slate-900">
                    10% de descuento automático
                  </span>{' '}
                  desde 12 unidades.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  <strong className="font-semibold text-slate-900">
                    Salida dual integrada:
                  </strong>{' '}
                  Envía la cotización al WhatsApp del estudio y guarda el pedido directo en el Control Interno con alertas automáticas.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  <strong className="font-semibold text-slate-900">
                    Transparencia previa:
                  </strong>{' '}
                  Confirma medidas reales en centímetros y material antes de cerrar la venta.
                </span>
              </li>
            </ul>

            <div className="mt-6 border-t border-slate-200 pt-5">
              <p className="text-xs font-medium text-slate-500">
                Demostración sugerida en exposición
              </p>
              <p className="mt-1 text-sm text-slate-700">
                Cotiza <strong className="text-slate-900">15 Termos Grabados</strong>{' '}
                para observar el descuento por volumen y la generación inmediata de la alerta en el Control de Pedidos.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSaveWhatsApp}
            className="rounded-xl border border-slate-200 bg-white p-6"
          >
            <label
              htmlFor="wa-number-input"
              className="flex items-center gap-2 text-sm font-semibold text-slate-900"
            >
              <Phone className="h-4 w-4 text-[#128C7E]" />
              Número de WhatsApp del Estudio
            </label>
            <p className="mt-1 text-xs text-slate-500">
              Incluye código de país (504 para Honduras) sin espacios ni símbolos.
            </p>
            <div className="mt-3 flex gap-2">
              <input
                id="wa-number-input"
                type="text"
                value={waNumber}
                onChange={(e) => setWaNumber(e.target.value)}
                placeholder="50499990000"
                className="min-h-[40px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-blue-700 focus:outline-none"
              />
              <button
                type="submit"
                className="min-h-[40px] rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
              >
                {waSavedFeedback ? 'Guardado' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
