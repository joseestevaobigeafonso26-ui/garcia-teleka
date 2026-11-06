"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Book } from "@/lib/types";
import { isSoldOut, priceFor, type Format } from "@/lib/shop";
import { useFeedback } from "@/components/ui/Feedback";

export type CartLine = {
  key: string;
  bookId: string;
  title: string;
  cover: string;
  format: Format;
  price: number;
  qty: number;
  /** stock máximo (null = sem limite) */
  max: number | null;
};

type CartCtx = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  add: (book: Book, format: Format) => boolean;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartCtx | null>(null);
const STORAGE_KEY = "gpt_cart_v1";

export function useCart(): CartCtx {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de CartProvider");
  return ctx;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useFeedback();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Carrinho guardado no navegador (sem conta)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignorar */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* ignorar */
    }
  }, [lines, loaded]);

  const add = useCallback(
    (book: Book, format: Format): boolean => {
      if (isSoldOut(book, format)) {
        toast("error", "Este livro está esgotado.");
        return false;
      }
      const max =
        format === "physical" && book.track_stock ? book.stock ?? 0 : null;
      const key = `${book.id}:${format}`;
      const existing = lines.find((l) => l.key === key);

      if (existing && format === "digital") {
        toast("info", "A versão digital já está no seu carrinho.");
        return true;
      }
      if (existing && max !== null && existing.qty + 1 > max) {
        toast("error", `Só há ${max} unidade(s) em stock.`);
        return false;
      }

      setLines((prev) => {
        const found = prev.find((l) => l.key === key);
        if (found) {
          return prev.map((l) =>
            l.key === key
              ? { ...l, qty: l.qty + 1, max, price: priceFor(book, format) }
              : l
          );
        }
        return [
          ...prev,
          {
            key,
            bookId: book.id,
            title: book.title,
            cover: book.cover_url,
            format,
            price: priceFor(book, format),
            qty: 1,
            max,
          },
        ];
      });
      toast("success", `"${book.title}" adicionado ao carrinho.`);
      return true;
    },
    [lines, toast]
  );

  const setQty = useCallback((key: string, qty: number) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l;
        const cap = l.format === "digital" ? 1 : l.max ?? 20;
        return { ...l, qty: Math.max(1, Math.min(qty, cap)) };
      })
    );
  }, []);

  const remove = useCallback(
    (key: string) => setLines((prev) => prev.filter((l) => l.key !== key)),
    []
  );
  const clear = useCallback(() => setLines([]), []);
  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => setOpen(false), []);

  const value = useMemo<CartCtx>(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotal: lines.reduce((n, l) => n + l.price * l.qty, 0),
      isOpen,
      openCart,
      closeCart,
      add,
      setQty,
      remove,
      clear,
    }),
    [lines, isOpen, openCart, closeCart, add, setQty, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
