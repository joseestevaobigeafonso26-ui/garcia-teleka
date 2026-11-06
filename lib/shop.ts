import type { Book } from "./types";

export type Format = "physical" | "digital";

export const bookType = (b: Book) => b.book_type ?? "physical";

/** Preço do livro no formato escolhido (digital a 0/vazio = mesmo preço do físico) */
export function priceFor(b: Book, f: Format): number {
  return f === "digital" ? b.digital_price_kz || b.price_kz : b.price_kz;
}

export function isSoldOut(b: Book, f: Format = defaultFormat(b)): boolean {
  if (f === "digital") return false;
  return !!b.track_stock && (b.stock ?? 0) <= 0;
}

export function defaultFormat(b: Book): Format {
  const t = bookType(b);
  if (t === "digital") return "digital";
  if (t === "both" && b.track_stock && (b.stock ?? 0) <= 0) return "digital";
  return "physical";
}

/** "Esgotado", "Últimas 3 unidades" ou null */
export function stockLabel(b: Book, f: Format): string | null {
  if (f === "digital" || !b.track_stock) return null;
  const n = b.stock ?? 0;
  if (n <= 0) return "Esgotado";
  if (n <= 3) return `Últimas ${n} ${n === 1 ? "unidade" : "unidades"}`;
  return null;
}

export const formatLabel: Record<string, string> = {
  physical: "Físico",
  digital: "Digital (PDF)",
  both: "Físico + Digital",
};
