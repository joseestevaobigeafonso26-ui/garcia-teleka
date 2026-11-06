export function formatKz(value: number): string {
  return `${Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")} Kz`;
}

/** Números de 9 dígitos (Angola) ganham o indicativo 244. */
export function waPhone(phone: string): string {
  const d = phone.replace(/[^0-9]/g, "");
  return d.length === 9 ? `244${d}` : d;
}

export function buildWhatsappText(phone: string, text: string): string {
  return `https://wa.me/${waPhone(phone)}?text=${encodeURIComponent(text)}`;
}

export function buildWhatsappUrl(
  phone: string,
  titulo?: string,
  preco?: string,
  autor = "Garcia Pedro Teleka"
): string {
  const num = phone.replace(/[^0-9]/g, "");
  const mensagem = titulo
    ? `Olá ${autor}! Gostaria de adquirir o livro "${titulo}" (Preço: ${preco ?? "Consulte valor"}). Como posso proceder com o pagamento?`
    : `Olá ${autor}! Gostaria de obter mais informações sobre os seus livros e palestras.`;
  return `https://wa.me/${num}?text=${encodeURIComponent(mensagem)}`;
}
