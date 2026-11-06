"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";
import Sheet from "@/components/ui/Sheet";
import { useFeedback } from "@/components/ui/Feedback";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PWACtx = {
  /** Mostrar o botão "Instalar app"? (false se já instalado ou sem suporte) */
  canInstall: boolean;
  install: () => Promise<void>;
};

const PWAContext = createContext<PWACtx>({
  canInstall: false,
  install: async () => {},
});

export const useInstall = () => useContext(PWAContext);

const DISMISS_KEY = "gpt_install_dismissed";
const DISMISS_DAYS = 7;

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /iPhone|iPad|iPod/.test(ua) || iPadOS;
}

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useFeedback();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showIOS, setShowIOS] = useState(false);
  const [banner, setBanner] = useState(false);

  // Service worker (só em produção, para não atrapalhar o desenvolvimento)
  useEffect(() => {
    if (
      process.env.NODE_ENV === "production" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Captura o pedido de instalação do navegador (Android / Chrome / Edge)
  useEffect(() => {
    setInstalled(isStandalone());
    setIos(isIOS());

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setInstalled(true);
      setBanner(false);
      toast("success", "App instalado com sucesso!");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [toast]);

  const canInstall = !installed && (!!deferred || ios);

  // Faixa de convite (uma vez; volta a aparecer só após 7 dias)
  useEffect(() => {
    if (!canInstall) return;
    let dismissedAt = 0;
    try {
      dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    } catch {
      /* ignorar */
    }
    if (Date.now() - dismissedAt < DISMISS_DAYS * 86400000) return;
    const t = setTimeout(() => setBanner(true), 5000);
    return () => clearTimeout(t);
  }, [canInstall]);

  const dismissBanner = useCallback(() => {
    setBanner(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignorar */
    }
  }, []);

  const install = useCallback(async () => {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") setBanner(false);
      setDeferred(null);
      return;
    }
    if (ios) setShowIOS(true);
  }, [deferred, ios]);

  const value = useMemo(() => ({ canInstall, install }), [canInstall, install]);

  return (
    <PWAContext.Provider value={value}>
      {children}

      {banner && canInstall && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-[55] bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 flex items-center gap-3 animate-pop-in">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt=""
            className="w-12 h-12 rounded-xl shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-brand-navy leading-tight">
              Instale o app
            </p>
            <p className="text-xs text-brand-textMuted leading-snug">
              Acesso rápido aos livros, direto do ecrã do telemóvel.
            </p>
          </div>
          <button
            onClick={() => {
              dismissBanner();
              install();
            }}
            className="shrink-0 bg-brand-blue hover:bg-blue-600 text-white text-xs font-bold rounded-full px-4 py-2"
          >
            Instalar
          </button>
          <button
            onClick={dismissBanner}
            className="shrink-0 p-1 text-slate-400 hover:text-slate-700"
            aria-label="Agora não"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {showIOS && (
        <Sheet
          title="Instalar no iPhone / iPad"
          subtitle="Dois toques e fica no ecrã principal"
          onClose={() => setShowIOS(false)}
        >
          <ol className="space-y-3 text-sm text-brand-navy">
            <li className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-brand-blue text-white text-xs font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <span>
                Abra este site no <strong>Safari</strong> e toque no botão{" "}
                <strong>Partilhar</strong>{" "}
                <Share className="inline w-4 h-4 -mt-1 text-brand-blue" /> na
                barra do Safari.
              </span>
            </li>
            <li className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-brand-blue text-white text-xs font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <span>
                Deslize e escolha <strong>Adicionar ao ecrã principal</strong>{" "}
                <SquarePlus className="inline w-4 h-4 -mt-1 text-brand-blue" />.
              </span>
            </li>
            <li className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-brand-blue text-white text-xs font-bold flex items-center justify-center shrink-0">
                3
              </span>
              <span>
                Toque em <strong>Adicionar</strong>. O ícone do app aparece no
                seu ecrã.
              </span>
            </li>
          </ol>
          <p className="text-[11px] text-brand-textMuted mt-4 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Em outros navegadores do iPhone
            (Chrome, etc.) abra o link no Safari.
          </p>
        </Sheet>
      )}
    </PWAContext.Provider>
  );
}
