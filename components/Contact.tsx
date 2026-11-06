"use client";

import { MessageCircle } from "lucide-react";
import { useSettings, useWhatsapp } from "./WhatsappProvider";
import { OPEN_TRACKER_EVENT } from "./shop/events";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function Contact() {
  const whatsapp = useWhatsapp();
  const s = useSettings();

  return (
    <section
      id="contacto"
      className="py-16 bg-brand-sky/50 border-b border-slate-200"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="w-12 h-12 rounded-full bg-brand-blue text-white flex items-center justify-center mx-auto shadow-md">
          <MessageCircle className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-brand-navy">
          {s.contact_title}
        </h2>
        <p className="text-brand-textMuted text-sm max-w-lg mx-auto">
          {s.contact_text}
        </p>
        <button
          onClick={() => whatsapp()}
          className="inline-flex max-w-full items-center justify-center gap-3 bg-brand-blue hover:bg-blue-600 text-white font-bold text-sm sm:text-base px-6 sm:px-8 py-4 rounded-full shadow-lg shadow-blue-500/25 transition transform hover:-translate-y-0.5"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Enviar Mensagem no WhatsApp</span>
        </button>
        {isSupabaseConfigured && (
          <div>
            <button
              onClick={() => window.dispatchEvent(new Event(OPEN_TRACKER_EVENT))}
              className="text-sm font-semibold text-brand-blue underline underline-offset-4"
            >
              Já fez um pedido? Acompanhar pedido
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
