"use client";

import { ArrowRight, Quote } from "lucide-react";
import { useSettings, useWhatsapp } from "./WhatsappProvider";

export default function About() {
  const whatsapp = useWhatsapp();
  const s = useSettings();

  return (
    <section
      id="sobre"
      className="py-16 md:py-24 bg-white border-b border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 flex flex-col justify-center items-center text-center p-8 bg-brand-sky/60 rounded-3xl border border-blue-100">
            <Quote className="w-12 h-12 text-brand-blue opacity-40 mb-4" />
            <blockquote className="font-serif italic text-2xl sm:text-3xl text-brand-navy font-semibold leading-relaxed">
              &ldquo;{s.about_quote}&rdquo;
            </blockquote>
            <span className="mt-4 font-bold text-brand-blue text-sm uppercase tracking-wider">
              — {s.author_name}
            </span>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div>
              <span className="text-xs font-bold text-brand-blue uppercase tracking-widest block mb-1">
                SOBRE O AUTOR
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-navy">
                {s.author_name}
              </h2>
            </div>
            <p className="text-brand-textMuted text-base leading-relaxed">
              {s.about_bio_1}
            </p>
            <p className="text-brand-textMuted text-base leading-relaxed">
              {s.about_bio_2}
            </p>
            <div className="pt-4">
              <button
                onClick={() => whatsapp()}
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-brand-blue font-bold px-6 py-3 rounded-full border-2 border-brand-blue shadow-sm transition"
              >
                <span>Falar com o Autor no WhatsApp</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
