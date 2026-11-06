"use client";

import { X, BookOpen, ShoppingCart } from "lucide-react";
import type { Book } from "@/lib/types";
import { useBuy } from "./shop/useBuy";

export default function SampleModal({
  book,
  onClose,
}: {
  book: Book | null;
  onClose: () => void;
}) {
  const buy = useBuy();
  if (!book) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-brand-navy text-white">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <h3 className="font-serif font-bold text-lg text-white">
              Degustação: {book.title}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto whitespace-pre-line font-serif text-slate-700 leading-relaxed text-sm sm:text-base bg-slate-50">
          {book.sample_text}
        </div>

        <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-3">
          <span className="text-xs text-slate-500">
            Gostou deste capítulo? Adquira a obra completa com o autor.
          </span>
          <button
            onClick={() => {
              onClose();
              buy(book);
            }}
            className="w-full sm:w-auto bg-brand-blue hover:bg-blue-600 text-white font-bold text-xs px-5 py-2.5 rounded-full transition flex items-center justify-center gap-2 shadow-md"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Comprar Obra Completa</span>
          </button>
        </div>
      </div>
    </div>
  );
}
