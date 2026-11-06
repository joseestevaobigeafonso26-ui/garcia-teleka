"use client";

import { useEffect } from "react";
import { ArrowLeft, X } from "lucide-react";

/**
 * Janela reutilizável: ecrã inteiro no telemóvel, centrada no computador.
 */
export default function Sheet({
  title,
  subtitle,
  onClose,
  onBack,
  footer,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  onBack?: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center sm:p-6 animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="bg-white w-full sm:max-w-xl h-[100dvh] sm:h-auto sm:max-h-[92vh] sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shrink-0 bg-gradient-to-r from-brand-navy to-brand-darkBlue text-white px-4 sm:px-6 py-4 flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-full hover:bg-white/10 transition"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="font-serif font-bold text-lg leading-tight truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[11px] text-blue-200/80 truncate">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 bg-brand-grayBg">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-slate-200 bg-white px-4 sm:px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
