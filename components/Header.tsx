"use client";

import { useState } from "react";
import { Download, Lock, Menu, ShoppingCart, X } from "lucide-react";
import { useInstall } from "./pwa/PWAProvider";
import { useSettings, useWhatsapp } from "./WhatsappProvider";
import { OPEN_ADMIN_EVENT } from "./admin/AdminGate";
import { useCart } from "./shop/CartProvider";
import { OPEN_TRACKER_EVENT } from "./shop/events";
import { isSupabaseConfigured } from "@/lib/supabase";

const openAdmin = () => window.dispatchEvent(new Event(OPEN_ADMIN_EVENT));

const links = [
  { href: "#inicio", label: "Início" },
  { href: "#livros", label: "Livros" },
  { href: "#sobre", label: "Sobre" },
  { href: "#midia", label: "Dia a Dia & Vídeos" },
  { href: "#galeria", label: "Galeria" },
  { href: "#contacto", label: "Contacto" },
];

export default function Header() {
  const { canInstall, install } = useInstall();
  const [open, setOpen] = useState(false);
  const whatsapp = useWhatsapp();
  const s = useSettings();
  const cart = useCart();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <a href="#inicio" className="flex items-center gap-3 group min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-lg bg-brand-navy flex items-center justify-center text-white font-serif font-bold text-lg shadow-md group-hover:bg-brand-blue transition">
            {s.author_name.charAt(0)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-brand-navy leading-none truncate">
              {s.author_name}
            </span>
            <span className="text-[9px] sm:text-[10px] text-brand-textMuted tracking-wider sm:tracking-widest uppercase font-semibold mt-1 truncate">
              {s.author_tagline}
            </span>
          </div>
        </a>

        <nav className="hidden lg:flex items-center gap-5 xl:gap-8 text-sm font-semibold text-brand-textDark">
          {links.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              className={`hover:text-brand-blue transition py-1 border-b-2 ${
                i === 0 ? "border-brand-blue" : "border-transparent"
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={openAdmin}
            aria-label="Área do Autor"
            className="hidden lg:flex items-center gap-2 border border-brand-navy/30 hover:border-brand-blue hover:text-brand-blue text-brand-navy text-sm font-semibold px-3 xl:px-4 py-2.5 rounded-full transition"
          >
            <Lock className="w-4 h-4" />
            <span className="hidden xl:inline">Área do Autor</span>
          </button>
          <button
            onClick={() =>
              isSupabaseConfigured ? cart.openCart() : whatsapp()
            }
            aria-label="Carrinho"
            className="relative flex items-center gap-2 bg-brand-blue hover:bg-blue-600 text-white text-sm font-semibold px-3.5 sm:px-5 py-2.5 rounded-full shadow-md shadow-blue-500/20 transition transform hover:-translate-y-0.5"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">
              {isSupabaseConfigured ? "Carrinho" : "Comprar Livros"}
            </span>
            {cart.count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-amber-400 text-brand-navy text-[11px] font-bold flex items-center justify-center">
                {cart.count}
              </span>
            )}
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden shrink-0 text-brand-navy hover:text-brand-blue p-2"
            aria-label="Menu"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3 shadow-lg max-h-[calc(100dvh-5rem)] overflow-y-auto">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block text-brand-textDark font-medium hover:text-brand-blue py-1"
            >
              {l.label}
            </a>
          ))}
          {isSupabaseConfigured && (
            <button
              onClick={() => {
                setOpen(false);
                window.dispatchEvent(new Event(OPEN_TRACKER_EVENT));
              }}
              className="block w-full text-left text-brand-textDark font-medium hover:text-brand-blue py-1"
            >
              Acompanhar pedido
            </button>
          )}
          {canInstall && (
            <button
              onClick={() => {
                setOpen(false);
                install();
              }}
              className="w-full flex items-center justify-center gap-2 bg-brand-blue text-white text-sm font-semibold px-4 py-3 rounded-full mt-2"
            >
              <Download className="w-4 h-4" />
              <span>Instalar app</span>
            </button>
          )}
          <button
            onClick={() => {
              setOpen(false);
              openAdmin();
            }}
            className="w-full flex items-center justify-center gap-2 border border-brand-navy/30 text-brand-navy text-sm font-semibold px-4 py-3 rounded-full mt-2"
          >
            <Lock className="w-4 h-4" />
            <span>Área do Autor</span>
          </button>
          <button
            onClick={() => {
              setOpen(false);
              whatsapp();
            }}
            className="w-full flex items-center justify-center gap-2 bg-brand-blue hover:bg-blue-600 text-white text-sm font-bold px-4 py-3 rounded-full mt-2"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Comprar Livros no WhatsApp</span>
          </button>
        </div>
      )}
    </header>
  );
}
