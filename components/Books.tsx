"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, MessageCircle, ShoppingCart } from "lucide-react";
import type { Book } from "@/lib/types";
import {
  bookType,
  defaultFormat,
  formatLabel,
  isSoldOut,
  priceFor,
  stockLabel,
  type Format,
} from "@/lib/shop";
import { formatKz } from "@/lib/whatsapp";
import { useSettings, useWhatsapp } from "./WhatsappProvider";
import { useBuy } from "./shop/useBuy";
import SampleModal from "./SampleModal";

function BookCard({
  book,
  onSample,
}: {
  book: Book;
  onSample: (b: Book) => void;
}) {
  const buy = useBuy();
  const whatsapp = useWhatsapp();
  const type = bookType(book);
  const [format, setFormat] = useState<Format>(defaultFormat(book));

  const price = priceFor(book, format);
  const soldOut = isSoldOut(book, format);
  const stock = stockLabel(book, format);

  return (
    <div className="bg-white text-brand-textDark rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between border border-slate-200 hover:shadow-2xl transition duration-300">
      <div>
        <div className="h-64 bg-slate-800 relative overflow-hidden">
          <Image
            src={book.cover_url}
            alt={book.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className={`object-cover ${soldOut ? "opacity-50 grayscale" : ""}`}
          />
          {book.badge && (
            <div className="absolute top-3 right-3 bg-brand-navy text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
              {book.badge}
            </div>
          )}
          <div className="absolute bottom-3 left-3 bg-white/90 text-brand-navy text-[10px] font-bold px-2.5 py-1 rounded-full">
            {formatLabel[type]}
          </div>
          {soldOut && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-red-600 text-white font-bold text-sm px-4 py-1.5 rounded-full shadow-lg">
                Esgotado
              </span>
            </div>
          )}
        </div>
        <div className="p-5">
          <span className="text-[11px] text-brand-textMuted font-semibold">
            {book.category}
          </span>
          <h3 className="font-serif text-lg font-bold text-brand-navy mt-1">
            {book.title}
          </h3>
          <p className="text-xs text-brand-textMuted mt-2 line-clamp-2">
            {book.description}
          </p>
        </div>
      </div>

      <div className="p-5 pt-0 space-y-3">
        {type === "both" && (
          <div className="grid grid-cols-2 gap-1 bg-slate-100 rounded-lg p-1 text-[11px] font-bold">
            {(["physical", "digital"] as Format[]).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`py-1.5 rounded-md transition ${
                  format === f
                    ? "bg-white text-brand-navy shadow"
                    : "text-brand-textMuted"
                }`}
              >
                {f === "physical" ? "Físico" : "Digital"}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end justify-between gap-2">
          <div className="text-lg font-bold text-brand-navy">
            {formatKz(price)}
          </div>
          {stock && !soldOut && (
            <span className="text-[11px] font-bold text-amber-600">{stock}</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onSample(book)}
            className="py-2 bg-slate-100 hover:bg-slate-200 text-brand-navy font-bold text-xs rounded-lg transition text-center"
          >
            Ler Amostra
          </button>
          <button
            onClick={() => buy(book, format)}
            disabled={soldOut}
            className="py-2 bg-brand-blue hover:bg-blue-600 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1 shadow-md disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-3.5 h-3.5" />{" "}
            {soldOut ? "Esgotado" : "Comprar"}
          </button>
        </div>

        <button
          onClick={() => whatsapp(book.title, formatKz(price))}
          className="w-full inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold text-brand-textMuted hover:text-emerald-600 transition"
        >
          <MessageCircle className="w-3.5 h-3.5" /> ou perguntar no WhatsApp
        </button>
      </div>
    </div>
  );
}

export default function Books({ books }: { books: Book[] }) {
  const whatsapp = useWhatsapp();
  const s = useSettings();
  const [sample, setSample] = useState<Book | null>(null);

  return (
    <section
      id="livros"
      className="py-16 md:py-24 dark-section-gradient text-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block mb-1">
              LIVROS EM DESTAQUE
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
              As Obras
            </h2>
            <p className="text-slate-400 text-sm mt-2 max-w-xl">
              {s.books_intro}
            </p>
          </div>
          <button
            onClick={() => whatsapp()}
            className="inline-flex items-center gap-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 text-sm font-semibold px-5 py-2.5 rounded-full transition w-fit"
          >
            <span>Falar com o autor</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {books.length === 0 && (
          <p className="text-slate-400 text-sm text-center py-10">
            Novos livros em breve.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {books.map((book) => (
            <BookCard key={book.id} book={book} onSample={setSample} />
          ))}
        </div>
      </div>
      <SampleModal book={sample} onClose={() => setSample(null)} />
    </section>
  );
}
