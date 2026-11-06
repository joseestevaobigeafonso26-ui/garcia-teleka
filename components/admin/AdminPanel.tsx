"use client";

import { useEffect, useState } from "react";
import { LogOut, ShieldCheck, X } from "lucide-react";
import { formatKz } from "@/lib/whatsapp";
import { formatLabel } from "@/lib/shop";
import SettingsForm from "./SettingsForm";
import CrudManager from "./CrudManager";
import OrdersManager from "./OrdersManager";
import Dashboard from "./Dashboard";
import type { Field } from "./fields";

const bookFields: Field[] = [
  { key: "title", label: "Título", type: "text", required: true },
  { key: "category", label: "Categoria", type: "text", placeholder: "Autoajuda | Motivação" },
  { key: "description", label: "Descrição curta", type: "textarea" },
  {
    key: "book_type",
    label: "Formato de venda",
    type: "select",
    options: [
      { value: "physical", label: "Só físico" },
      { value: "digital", label: "Só digital (PDF/EPUB)" },
      { value: "both", label: "Físico + Digital" },
    ],
  },
  { key: "price_kz", label: "Preço (Kz)", type: "number", required: true, help: "Preço do livro físico (ou do digital, se for só digital)." },
  {
    key: "digital_price_kz",
    label: "Preço da versão digital (Kz)",
    type: "number",
    help: "Deixe 0 para usar o mesmo preço.",
    showIf: (r) => r.book_type === "both",
  },
  {
    key: "digital_path",
    label: "Ficheiro do livro digital",
    type: "privatefile",
    nullable: true,
    help: "Fica guardado em privado. O cliente só descarrega depois de o pagamento ser confirmado.",
    showIf: (r) => r.book_type === "digital" || r.book_type === "both",
  },
  {
    key: "track_stock",
    label: "Controlar stock deste livro",
    type: "checkbox",
    help: "O stock desce a cada pedido e volta a subir se o pedido for cancelado.",
    showIf: (r) => r.book_type !== "digital",
  },
  {
    key: "stock",
    label: "Quantidade em stock",
    type: "number",
    showIf: (r) => r.book_type !== "digital" && !!r.track_stock,
  },
  { key: "cover_url", label: "Capa", type: "image", required: true },
  { key: "sample_text", label: "Texto da amostra (Ler Amostra)", type: "textarea" },
  { key: "badge", label: "Etiqueta (ex.: Lançamento)", type: "text", nullable: true, help: "Deixe vazio para não mostrar." },
  { key: "is_featured", label: "Livro em destaque na página inicial", type: "checkbox" },
];

const paymentFields: Field[] = [
  {
    key: "kind",
    label: "Tipo",
    type: "select",
    options: [
      { value: "bank_transfer", label: "Transferência bancária (IBAN)" },
      { value: "multicaixa_express", label: "Multicaixa Express" },
      { value: "cash", label: "Dinheiro (levantamento / entrega)" },
      { value: "other", label: "Outro (Unitel Money, e-Kwanza, PayPay…)" },
    ],
  },
  { key: "label", label: "Nome mostrado ao cliente", type: "text", required: true, placeholder: "Transferência bancária (IBAN)" },
  {
    key: "details",
    label: "Dados para pagar / instruções",
    type: "textarea",
    help: "Ex.: banco, IBAN, titular, número Multicaixa Express. O cliente vê isto depois de fazer o pedido.",
  },
  { key: "is_active", label: "Ativa (visível no checkout)", type: "checkbox" },
];

const zoneFields: Field[] = [
  { key: "name", label: "Zona", type: "text", required: true, placeholder: "Luanda — Talatona" },
  { key: "fee_kz", label: "Preço da entrega (Kz)", type: "number", required: true },
  { key: "is_active", label: "Ativa (visível no checkout)", type: "checkbox" },
];

const videoFields: Field[] = [
  { key: "title", label: "Título", type: "text", required: true },
  { key: "tag", label: "Etiqueta", type: "text", placeholder: "Palestra, Evento..." },
  { key: "duration", label: "Duração", type: "text", placeholder: "40 seg" },
  { key: "thumbnail_url", label: "Imagem de capa", type: "image", required: true },
  {
    key: "video_url",
    label: "Vídeo",
    type: "video",
    required: true,
    help: "Envie um ficheiro MP4 (até 50 MB no plano gratuito) ou cole um link direto.",
  },
];

const photoFields: Field[] = [
  { key: "image_url", label: "Foto", type: "image", required: true },
  { key: "caption", label: "Legenda", type: "text" },
];

const tabs = [
  { id: "dashboard", label: "Resumo" },
  { id: "orders", label: "Pedidos" },
  { id: "books", label: "Livros" },
  { id: "payments", label: "Pagamentos" },
  { id: "delivery", label: "Entregas" },
  { id: "videos", label: "Vídeos" },
  { id: "gallery", label: "Galeria" },
  { id: "info", label: "Informações" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const kindLabel: Record<string, string> = {
  bank_transfer: "Transferência",
  multicaixa_express: "Multicaixa Express",
  cash: "Dinheiro",
  other: "Outro",
};

export default function AdminPanel({
  onClose,
  onLogout,
  pending = 0,
}: {
  onClose: () => void;
  onLogout: () => void;
  pending?: number;
}) {
  const [tab, setTab] = useState<TabId>(pending > 0 ? "orders" : "dashboard");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center sm:p-6 animate-fade-in"
      onClick={onClose}
    >
      {/* Telemóvel: ecrã inteiro · Computador: janela centrada */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Painel do Autor"
        className="bg-brand-grayBg w-full sm:max-w-3xl h-[100dvh] sm:h-[90vh] sm:max-h-[90vh] sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shrink-0 bg-gradient-to-r from-brand-navy to-brand-darkBlue text-white">
          <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-blue-300" />
              </div>
              <div className="min-w-0">
                <h2 className="font-serif font-bold text-lg leading-tight truncate">
                  Painel do Autor
                </h2>
                <p className="text-[11px] text-blue-200/80 truncate">
                  Tudo o que alterar aparece logo no site
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 border border-white/25 rounded-full px-3 py-2 text-xs font-semibold hover:bg-white/10 transition"
                aria-label="Sair"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 transition"
                aria-label="Fechar painel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <nav className="px-4 sm:px-6 flex gap-1 overflow-x-auto hide-scrollbar">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative whitespace-nowrap px-4 py-2.5 text-sm font-semibold rounded-t-xl transition ${
                  tab === t.id
                    ? "bg-brand-grayBg text-brand-navy"
                    : "text-blue-100/80 hover:text-white hover:bg-white/10"
                }`}
              >
                {t.label}
                {t.id === "orders" && pending > 0 && (
                  <span className="ml-1.5 inline-flex min-w-[18px] h-[18px] px-1 items-center justify-center rounded-full bg-amber-400 text-brand-navy text-[10px] font-bold">
                    {pending}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
          {tab === "dashboard" && <Dashboard />}
          {tab === "orders" && <OrdersManager />}
          {tab === "books" && (
            <CrudManager
              table="books"
              singular="livro"
              gender="m"
              fields={bookFields}
              titleKey="title"
              thumbKey="cover_url"
              subtitle={(r) => {
                const type = String(r.book_type ?? "physical");
                const stock =
                  type !== "digital" && r.track_stock
                    ? ` · Stock: ${Number(r.stock ?? 0)}`
                    : "";
                return `${formatLabel[type] ?? "Físico"} · ${formatKz(
                  Number(r.price_kz ?? 0)
                )}${stock}`;
              }}
              defaults={{
                title: "",
                category: "",
                description: "",
                book_type: "physical",
                price_kz: 0,
                digital_price_kz: 0,
                digital_path: "",
                track_stock: false,
                stock: 0,
                cover_url: "",
                sample_text: "",
                badge: "",
                is_featured: false,
              }}
            />
          )}
          {tab === "payments" && (
            <div className="space-y-4">
              <p className="text-xs text-brand-textMuted bg-white rounded-xl border border-slate-200 p-3">
                Crie aqui as formas de pagamento que os clientes veem ao finalizar
                o pedido (IBAN, Multicaixa Express, dinheiro…). Só as{" "}
                <strong>ativas</strong> aparecem no site.
              </p>
              <CrudManager
                table="payment_methods"
                singular="forma de pagamento"
                gender="f"
                fields={paymentFields}
                titleKey="label"
                subtitle={(r) =>
                  `${kindLabel[String(r.kind)] ?? ""} · ${
                    r.is_active ? "Ativa" : "Inativa"
                  }`
                }
                defaults={{ kind: "bank_transfer", label: "", details: "", is_active: true }}
              />
            </div>
          )}
          {tab === "delivery" && (
            <div className="space-y-6">
              <SettingsForm scope="shop" />
              <div className="space-y-3">
                <h3 className="font-serif font-bold text-brand-navy">
                  Zonas e preços de entrega
                </h3>
                <CrudManager
                  table="delivery_zones"
                  singular="zona de entrega"
                  gender="f"
                  fields={zoneFields}
                  titleKey="name"
                  subtitle={(r) =>
                    `${formatKz(Number(r.fee_kz ?? 0))} · ${
                      r.is_active ? "Ativa" : "Inativa"
                    }`
                  }
                  defaults={{ name: "", fee_kz: 0, is_active: true }}
                />
              </div>
            </div>
          )}
          {tab === "videos" && (
            <CrudManager
              table="videos"
              singular="vídeo"
              gender="m"
              fields={videoFields}
              titleKey="title"
              subtitleKey="tag"
              thumbKey="thumbnail_url"
              defaults={{ title: "", tag: "", duration: "", thumbnail_url: "", video_url: "" }}
            />
          )}
          {tab === "gallery" && (
            <CrudManager
              table="gallery_photos"
              singular="foto"
              gender="f"
              fields={photoFields}
              titleKey="caption"
              thumbKey="image_url"
              defaults={{ image_url: "", caption: "" }}
            />
          )}
          {tab === "info" && <SettingsForm scope="site" />}
        </div>
      </div>
    </div>
  );
}
