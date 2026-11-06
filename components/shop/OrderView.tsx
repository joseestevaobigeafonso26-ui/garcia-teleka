"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Download,
  FileCheck2,
  MessageCircle,
  RefreshCw,
  Upload,
} from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { useFeedback } from "@/components/ui/Feedback";
import { buildWhatsappText, formatKz } from "@/lib/whatsapp";
import { statusMeta, type OrderStatus } from "@/lib/orderStatus";
import { useSettings } from "@/components/WhatsappProvider";

type OrderData = {
  code: string;
  status: OrderStatus;
  customer_name: string;
  delivery_method: "pickup" | "delivery" | "digital";
  zone_name: string | null;
  delivery_fee: number;
  address: string | null;
  subtotal: number;
  total: number;
  payment_label: string | null;
  payment_kind: string | null;
  payment_details: string | null;
  has_proof: boolean;
  created_at: string;
  items: {
    book_id: string | null;
    title: string;
    format: "physical" | "digital";
    unit_price: number;
    qty: number;
  }[];
};

const MAX_PROOF = 5 * 1024 * 1024;

export default function OrderView({
  code,
  phone,
  justPlaced,
}: {
  code: string;
  phone: string;
  justPlaced?: boolean;
}) {
  const sb = getSupabase();
  const s = useSettings();
  const { toast, track } = useFeedback();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!sb) return;
    setLoading(true);
    const { data, error } = await track(
      sb.rpc("get_order", { p_code: code, p_phone: phone })
    );
    if (error || !data) {
      setOrder(null);
      setNotFound(true);
    } else {
      setOrder(data as OrderData);
      setNotFound(false);
    }
    setLoading(false);
  }, [sb, code, phone, track]);

  useEffect(() => {
    load();
  }, [load]);

  async function uploadProof(file: File) {
    if (!sb || !order) return;
    if (file.size > MAX_PROOF) {
      toast("error", "O ficheiro é demasiado grande (máximo 5 MB).");
      return;
    }
    if (!/^(image\/(jpeg|png|webp)|application\/pdf)$/.test(file.type)) {
      toast("error", "Envie uma imagem (JPG, PNG, WEBP) ou um PDF.");
      return;
    }
    setUploading(true);
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${order.code}/${Date.now()}-${safe}`;

    const up = await track(
      sb.storage.from("proofs").upload(path, file, { upsert: false })
    );
    if (up.error) {
      toast("error", `Falha no envio: ${up.error.message}`);
      setUploading(false);
      return;
    }
    const { data: ok, error } = await track(
      sb.rpc("attach_proof", {
        p_code: order.code,
        p_phone: phone,
        p_path: path,
      })
    );
    if (error || !ok) {
      toast("error", "Não foi possível associar o comprovativo ao pedido.");
    } else {
      toast("success", "Comprovativo enviado com sucesso!");
      await load();
    }
    setUploading(false);
  }

  if (loading && !order) {
    return <p className="text-sm text-brand-textMuted py-8 text-center">A carregar…</p>;
  }
  if (notFound || !order) {
    return (
      <div className="text-center py-8 space-y-3">
        <p className="text-sm text-red-600 font-semibold">
          Pedido não encontrado.
        </p>
        <p className="text-xs text-brand-textMuted">
          Verifique o código (ex.: GPT-0042) e o telefone usado na compra.
        </p>
      </div>
    );
  }

  const meta = statusMeta[order.status];
  const steps: OrderStatus[] =
    order.delivery_method === "digital"
      ? ["new", "paid", "delivered"]
      : ["new", "paid", "preparing", "delivered"];
  const stepIndex = steps.indexOf(order.status);
  const needsProof = order.payment_kind && order.payment_kind !== "cash";
  const hasDigital = order.items.some((i) => i.format === "digital");
  const unlocked = ["paid", "preparing", "delivered"].includes(order.status);

  const waText = `Olá ${s.author_name}! Fiz o pedido ${order.code} (${order.items
    .map((i) => `${i.qty}x ${i.title}`)
    .join(", ")}) no valor de ${formatKz(order.total)}. ${
    order.has_proof
      ? "Já enviei o comprovativo de pagamento."
      : "Vou efetuar o pagamento."
  }`;

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
        {justPlaced && (
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-7 h-7" />
          </div>
        )}
        <p className="text-xs text-brand-textMuted">
          {justPlaced ? "Pedido registado! O seu código:" : "Pedido"}
        </p>
        <p className="font-serif text-3xl font-bold text-brand-navy tracking-wide">
          {order.code}
        </p>
        <span
          className={`inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full ${meta.badge}`}
        >
          {meta.label}
        </span>
        <p className="text-sm text-brand-textMuted mt-2">{meta.customer}</p>
        {justPlaced && (
          <p className="text-[11px] text-brand-textMuted mt-2">
            Guarde este código. Com ele e o seu telefone pode acompanhar o pedido
            a qualquer momento.
          </p>
        )}
      </div>

      {/* Linha do tempo */}
      {order.status !== "cancelled" && (
        <ol className="flex items-center justify-between gap-1 px-1">
          {steps.map((st, i) => {
            const done = i <= stepIndex;
            return (
              <li key={st} className="flex-1 flex flex-col items-center gap-1 relative">
                <span
                  className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center z-10 ${
                    done ? "bg-brand-blue text-white" : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {i + 1}
                </span>
                <span
                  className={`text-[10px] text-center leading-tight ${
                    done ? "text-brand-navy font-semibold" : "text-slate-400"
                  }`}
                >
                  {statusMeta[st].label}
                </span>
                {i < steps.length - 1 && (
                  <span
                    className={`absolute top-3 left-1/2 w-full h-0.5 ${
                      i < stepIndex ? "bg-brand-blue" : "bg-slate-200"
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      )}

      {/* Pagamento pendente */}
      {order.status === "new" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-bold text-amber-900">
            Como pagar — {order.payment_label}
          </p>
          <p className="text-sm text-amber-900">
            Valor a pagar:{" "}
            <strong className="text-lg">{formatKz(order.total)}</strong>
          </p>
          {order.payment_details && (
            <p className="text-sm text-amber-900 whitespace-pre-line bg-white/70 rounded-lg p-3">
              {order.payment_details}
            </p>
          )}
          <p className="text-xs text-amber-800">
            Use <strong>{order.code}</strong> como referência do pagamento.
          </p>

          {needsProof &&
            (order.has_proof ? (
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <FileCheck2 className="w-4 h-4" /> Comprovativo enviado. Aguarde a
                confirmação do autor.
              </p>
            ) : (
              <label
                className={`flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-amber-400 bg-white px-4 py-3 text-sm font-bold text-amber-900 ${
                  uploading ? "opacity-60" : "cursor-pointer hover:bg-amber-100"
                }`}
              >
                <Upload className="w-4 h-4" />
                {uploading ? "A enviar…" : "Enviar comprovativo (foto ou PDF)"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadProof(f);
                    e.target.value = "";
                  }}
                />
              </label>
            ))}
        </div>
      )}

      {/* Livros digitais */}
      {hasDigital && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
          <p className="text-sm font-bold text-brand-navy">Livros digitais</p>
          {unlocked ? (
            order.items
              .filter((i) => i.format === "digital" && i.book_id)
              .map((i) => (
                <a
                  key={i.book_id}
                  href={`/api/download?code=${encodeURIComponent(
                    order.code
                  )}&phone=${encodeURIComponent(phone)}&book=${i.book_id}`}
                  className="flex items-center justify-between gap-3 rounded-xl bg-brand-blue hover:bg-blue-600 text-white px-4 py-3 text-sm font-bold transition"
                >
                  <span className="truncate">{i.title}</span>
                  <span className="inline-flex items-center gap-1.5 shrink-0">
                    <Download className="w-4 h-4" /> Descarregar
                  </span>
                </a>
              ))
          ) : (
            <p className="text-xs text-brand-textMuted">
              O download fica disponível aqui assim que o pagamento for
              confirmado.
            </p>
          )}
        </div>
      )}

      {/* Resumo */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 text-sm">
        <p className="font-bold text-brand-navy">Resumo</p>
        {order.items.map((i, idx) => (
          <div key={idx} className="flex justify-between gap-3">
            <span className="min-w-0">
              {i.qty}× {i.title}{" "}
              <span className="text-[10px] text-brand-textMuted">
                ({i.format === "digital" ? "digital" : "físico"})
              </span>
            </span>
            <span className="shrink-0 font-semibold">
              {formatKz(i.unit_price * i.qty)}
            </span>
          </div>
        ))}
        {order.delivery_method === "delivery" && (
          <div className="flex justify-between text-brand-textMuted">
            <span>Entrega — {order.zone_name}</span>
            <span>{formatKz(order.delivery_fee)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-brand-navy">
          <span>Total</span>
          <span>{formatKz(order.total)}</span>
        </div>
        <p className="text-xs text-brand-textMuted">
          {order.delivery_method === "pickup" && "Levantamento no local."}
          {order.delivery_method === "delivery" && `Entrega em: ${order.address}`}
          {order.delivery_method === "digital" && "Entrega digital."}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={() =>
            window.open(buildWhatsappText(s.whatsapp_number, waText), "_blank")
          }
          className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-full px-5 py-3 transition"
        >
          <MessageCircle className="w-4 h-4" /> Falar com o autor no WhatsApp
        </button>
        <button
          onClick={load}
          className="inline-flex items-center justify-center gap-2 border border-slate-300 bg-white text-brand-navy font-semibold text-sm rounded-full px-5 py-3 hover:bg-slate-50"
        >
          <RefreshCw className="w-4 h-4" /> Atualizar
        </button>
      </div>
    </div>
  );
}
