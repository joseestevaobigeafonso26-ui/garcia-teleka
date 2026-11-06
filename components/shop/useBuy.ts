"use client";

import type { Book } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase";
import { defaultFormat, priceFor, type Format } from "@/lib/shop";
import { formatKz } from "@/lib/whatsapp";
import { useWhatsapp } from "@/components/WhatsappProvider";
import { useCart } from "./CartProvider";

/**
 * Ação "Comprar": adiciona ao carrinho e abre-o.
 * Sem Supabase configurado, volta a abrir o WhatsApp (modo demonstração).
 */
export function useBuy() {
  const cart = useCart();
  const whatsapp = useWhatsapp();

  return (book: Book, format?: Format) => {
    const f = format ?? defaultFormat(book);
    if (!isSupabaseConfigured) {
      whatsapp(book.title, formatKz(priceFor(book, f)));
      return;
    }
    if (cart.add(book, f)) cart.openCart();
  };
}
