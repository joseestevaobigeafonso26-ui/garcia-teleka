"use client";

import { Facebook, Instagram, Lock, MessageCircle, Youtube } from "lucide-react";
import { OPEN_ADMIN_EVENT } from "./admin/AdminGate";
import { OPEN_TRACKER_EVENT } from "./shop/events";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useSettings, useWhatsapp } from "./WhatsappProvider";

export default function Footer() {
  const whatsapp = useWhatsapp();
  const s = useSettings();

  return (
    <footer className="bg-brand-navy text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center pb-8 border-b border-slate-800">
          <div className="md:col-span-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-blue flex items-center justify-center text-white font-serif font-bold text-lg">
              {s.author_name.charAt(0)}
            </div>
            <div>
              <span className="font-serif text-lg font-bold text-white block">
                {s.author_name}
              </span>
              <span className="text-[9px] text-slate-400 tracking-widest uppercase block">
                {s.author_tagline}
              </span>
            </div>
          </div>

          <div className="md:col-span-5 text-center md:text-left text-xs italic text-slate-300">
            &ldquo;{s.footer_quote}&rdquo;
            <span className="block font-bold text-blue-400 not-italic mt-0.5">
              — {s.author_name}
            </span>
          </div>

          <div className="md:col-span-3 flex justify-center md:justify-end gap-3">
            {[
              { href: s.facebook_url, Icon: Facebook },
              { href: s.instagram_url, Icon: Instagram },
              { href: s.youtube_url, Icon: Youtube },
            ]
              .filter((l) => l.href)
              .map(({ href, Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-brand-blue flex items-center justify-center transition"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
            <button
              onClick={() => whatsapp()}
              className="w-9 h-9 rounded-full bg-brand-blue hover:bg-blue-600 flex items-center justify-center transition"
              aria-label="WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-4">
          <p>
            &copy; {new Date().getFullYear()} {s.author_name}. Todos os
            direitos reservados.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <a href="#" className="hover:text-white transition">
              Termos e Condições
            </a>
            <a href="#" className="hover:text-white transition">
              Política de Privacidade
            </a>
            {isSupabaseConfigured && (
              <button
                onClick={() =>
                  window.dispatchEvent(new Event(OPEN_TRACKER_EVENT))
                }
                className="hover:text-white transition"
              >
                Acompanhar pedido
              </button>
            )}
            <button
              onClick={() => window.dispatchEvent(new Event(OPEN_ADMIN_EVENT))}
              className="inline-flex items-center gap-1 hover:text-white transition"
            >
              <Lock className="w-3 h-3" /> Área reservada
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
