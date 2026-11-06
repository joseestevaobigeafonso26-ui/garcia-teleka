"use client";

import { useState } from "react";
import { ArrowRight, ShoppingBag } from "lucide-react";
import type { Book } from "@/lib/types";
import { useSettings, useWhatsapp } from "./WhatsappProvider";
import { useBuy } from "./shop/useBuy";
import SampleModal from "./SampleModal";
import PhoneMockup from "./PhoneMockup";

export default function Hero({
  book,
  books,
}: {
  book: Book | null;
  books: Book[];
}) {
  const buy = useBuy();
  const whatsapp = useWhatsapp();
  const s = useSettings();
  const [sample, setSample] = useState<Book | null>(null);

  const main = book ?? books[0] ?? null;
  const others = books.filter((b) => b.id !== main?.id);

  return (
    <section
      id="inicio"
      className="hero-gradient relative py-12 md:py-20 border-b border-slate-200 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-bold text-brand-blue uppercase tracking-widest block">
              {s.hero_kicker}
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-navy leading-tight">
              {s.author_name}
            </h1>
            <h2 className="text-lg sm:text-xl font-semibold text-brand-lightBlue -mt-3">
              {s.author_tagline}
            </h2>
            <p className="text-brand-textMuted text-base sm:text-lg leading-relaxed max-w-xl">
              {s.hero_description}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#livros"
                className="flex items-center gap-2 bg-brand-blue hover:bg-blue-600 text-white font-semibold px-6 py-3.5 rounded-full shadow-lg shadow-blue-500/25 transition transform hover:-translate-y-0.5"
              >
                <span>Explorar Livros</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              {main && (
                <button
                  onClick={() => buy(main)}
                  className="flex items-center gap-2 bg-white hover:bg-slate-50 text-brand-navy font-semibold px-6 py-3.5 rounded-full border border-slate-300 shadow-sm transition"
                >
                  <ShoppingBag className="w-4 h-4 text-brand-blue" />
                  <span>Comprar Lançamento</span>
                </button>
              )}
            </div>
          </div>

          {main && (
            <div className="lg:col-span-6">
              <PhoneMockup
                main={main}
                others={others}
                onBuy={(b) => buy(b)}
                onSample={setSample}
                onContact={() => whatsapp()}
              />
            </div>
          )}
        </div>
      </div>
      <SampleModal book={sample} onClose={() => setSample(null)} />
    </section>
  );
}
