"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AlertTriangle, CheckCircle2, Info, Trash2, X } from "lucide-react";

export type ToastType = "success" | "danger" | "error" | "info";

type ToastItem = { id: number; type: ToastType; message: string };

type FeedbackCtx = {
  /** Mostra um aviso. success = verde, danger = vermelho (apagado), error = vermelho escuro, info = azul */
  toast: (type: ToastType, message: string) => void;
  /** Envolve uma operação assíncrona e mostra a barra de progresso no topo */
  track: <T,>(p: PromiseLike<T>) => Promise<T>;
};

const FeedbackContext = createContext<FeedbackCtx>({
  toast: () => {},
  track: async <T,>(p: PromiseLike<T>): Promise<T> => await p,
});

export const useFeedback = () => useContext(FeedbackContext);

const styles: Record<
  ToastType,
  { bg: string; bar: string; Icon: typeof Info; title: string }
> = {
  success: {
    bg: "bg-emerald-600",
    bar: "bg-emerald-200",
    Icon: CheckCircle2,
    title: "Sucesso",
  },
  danger: {
    bg: "bg-red-600",
    bar: "bg-red-200",
    Icon: Trash2,
    title: "Apagado",
  },
  error: {
    bg: "bg-rose-800",
    bar: "bg-rose-200",
    Icon: AlertTriangle,
    title: "Erro",
  },
  info: {
    bg: "bg-brand-navy",
    bar: "bg-blue-300",
    Icon: Info,
    title: "Informação",
  },
};

const DURATION = 4000;

function ToastView({
  item,
  onClose,
}: {
  item: ToastItem;
  onClose: (id: number) => void;
}) {
  const { bg, bar, Icon, title } = styles[item.type];

  useEffect(() => {
    const t = setTimeout(() => onClose(item.id), DURATION);
    return () => clearTimeout(t);
  }, [item.id, onClose]);

  return (
    <div
      role="status"
      className={`${bg} text-white rounded-xl shadow-2xl overflow-hidden w-[min(92vw,22rem)] animate-toast-in`}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">
            {title}
          </p>
          <p className="text-sm font-semibold leading-snug break-words">
            {item.message}
          </p>
        </div>
        <button
          onClick={() => onClose(item.id)}
          className="opacity-70 hover:opacity-100 shrink-0"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="h-1 bg-black/10">
        <div className={`h-full ${bar} animate-toast-bar`} />
      </div>
    </div>
  );
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const active = useRef(0);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
  const hider = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(1);

  const start = useCallback(() => {
    active.current += 1;
    if (active.current !== 1) return;
    if (hider.current) clearTimeout(hider.current);
    setVisible(true);
    setProgress(8);
    ticker.current = setInterval(
      () => setProgress((p) => p + (90 - p) * 0.08),
      200
    );
  }, []);

  const done = useCallback(() => {
    active.current = Math.max(0, active.current - 1);
    if (active.current !== 0) return;
    if (ticker.current) clearInterval(ticker.current);
    setProgress(100);
    hider.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 400);
  }, []);

  const track = useCallback(
    async <T,>(p: PromiseLike<T>): Promise<T> => {
      start();
      try {
        return await p;
      } finally {
        done();
      }
    },
    [start, done]
  );

  const close = useCallback(
    (id: number) => setToasts((t) => t.filter((x) => x.id !== id)),
    []
  );

  const toast = useCallback((type: ToastType, message: string) => {
    const id = nextId.current++;
    setToasts((t) => [...t.slice(-3), { id, type, message }]);
  }, []);

  const value = useMemo(() => ({ toast, track }), [toast, track]);

  return (
    <FeedbackContext.Provider value={value}>
      {/* Barra de carregamento no topo (estilo Facebook/YouTube) */}
      <div
        className="fixed top-0 left-0 right-0 z-[110] h-[3px] pointer-events-none"
        style={{ opacity: visible ? 1 : 0, transition: "opacity 300ms" }}
      >
        <div
          className="h-full bg-gradient-to-r from-brand-blue via-sky-400 to-brand-lightBlue shadow-[0_0_10px_#0066ff]"
          style={{ width: `${progress}%`, transition: "width 300ms ease-out" }}
        />
      </div>

      {children}

      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 items-end">
        {toasts.map((t) => (
          <ToastView key={t.id} item={t} onClose={close} />
        ))}
      </div>
    </FeedbackContext.Provider>
  );
}
