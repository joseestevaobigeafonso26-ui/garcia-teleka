"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Download,
  FileText,
  MessageCircle,
  Search,
} from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { useFeedback } from "@/components/ui/Feedback";
import { buildWhatsappText, formatKz } from "@/lib/whatsapp";
import { statusMeta, statusOrder, type OrderStatus } from "@/lib/orderStatus";
import { inputClass } from "./fields";

type Item = {
  id: string;
  book_id: string | null;
  title: string;
  format: "physical" | "digital";
  unit_price: number;
  quantity: number;
};

export type Order = {
  id: string;
  code: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_method: "pickup" | "delivery" | "digital";
  zone_name: string | null;
  delivery_fee: number;
  address: string | null;
  notes: string | null;
  payment_label: string | null;
  subtotal: number;
  total: number;
  status: OrderStatus;
  proof_path: string | null;
  admin_notes: string | null;
  created_at: string;
  order_items: Item[];
};

const deliveryText = (o: Order) =>
  o.delivery_method === "pickup"
    ? "Levantamento"
    : o.delivery_method === "digital"
    ? "Digital"
    : `Entrega — ${o.zone_name ?? ""}`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function nextAction(o: Order): { to: OrderStatus; label: string } | null {
  switch (o.status) {
    case "new":
      return { to: "paid", label: "Confirmar pagamento" };
    case "paid":
      return o.delivery_method === "digital"
        ? { to: "delivered", label: "Marcar como concluído" }
        : { to: "preparing", label: "Iniciar preparação" };
    case "preparing":
      return { to: "delivered", label: "Marcar como concluído" };
    default:
      return null;
  }
}

function waMessage(o: Order): string {
  const base = `Olá ${o.customer_name}! `;
  switch (o.status) {
    case "new":
      return `${base}Recebemos o seu pedido ${o.code} (${formatKz(
        o.total
      )}). Pode confirmar o pagamento ou enviar o comprovativo? Obrigado!`;
    case "paid":
      return `${base}O pagamento do pedido ${o.code} foi confirmado. Obrigado!`;
    case "preparing":
      return `${base}O seu pedido ${o.code} está a ser preparado.`;
    case "delivered":
      return `${base}O seu pedido ${o.code} foi concluído. Obrigado pela compra!`;
    default:
      return `${base}O pedido ${o.code} foi cancelado. Qualquer dúvida, fale connosco.`;
  }
}

function exportCsv(orders: Order[]) {
  const head = [
    "Código", "Data", "Estado", "Cliente", "Telefone", "Email", "Entrega",
    "Morada", "Pagamento", "Itens", "Subtotal (Kz)", "Taxa entrega (Kz)", "Total (Kz)",
  ];
  const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = orders.map((o) =>
    [
      o.code,
      fmtDate(o.created_at),
      statusMeta[o.status].label,
      o.customer_name,
      o.customer_phone,
      o.customer_email,
      deliveryText(o),
      o.address,
      o.payment_label,
      o.order_items
        .map((i) => `${i.quantity}x ${i.title} (${i.format === "digital" ? "digital" : "físico"})`)
        .join(" | "),
      o.subtotal,
      o.delivery_fee,
      o.total,
    ]
      .map(q)
      .join(";")
  );
  const csv = "﻿" + [head.map(q).join(";"), ...rows].join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `pedidos-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function OrdersManager() {
  const sb = getSupabase()!;
  const { toast, track } = useFeedback();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await track(
      sb
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false })
        .limit(500)
    );
    if (error) toast("error", error.message);
    else setOrders((data ?? []) as Order[]);
  }, [sb, track, toast]);

  useEffect(() => {
    load();
  }, [load]);

  // Atualiza sozinho quando entra/muda um pedido
  useEffect(() => {
    const ch = sb
      .channel("orders-list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => load()
      )
      .subscribe();
    return () => {
      sb.removeChannel(ch);
    };
  }, [sb, load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter(
      (o) =>
        (filter === "all" || o.status === filter) &&
        (!q ||
          o.code.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_phone.includes(q))
    );
  }, [orders, filter, query]);

  async function setStatus(o: Order, status: OrderStatus) {
    setBusy(true);
    const { error } = await track(
      sb.rpc("admin_set_order_status", { p_id: o.id, p_status: status })
    );
    if (error) {
      toast("error", error.message);
    } else if (status === "cancelled") {
      toast("danger", `Pedido ${o.code} cancelado (stock reposto).`);
    } else if (status === "paid") {
      toast("success", `Pagamento do pedido ${o.code} confirmado!`);
    } else {
      toast("success", `Pedido ${o.code}: ${statusMeta[status].label}.`);
    }
    setConfirmCancel(null);
    await load();
    setBusy(false);
  }

  async function saveNotes(o: Order) {
    const text = notes[o.id] ?? o.admin_notes ?? "";
    const { data, error } = await track(
      sb.from("orders").update({ admin_notes: text }).eq("id", o.id).select("id")
    );
    if (error || !data?.length) toast("error", error?.message ?? "Sem permissão.");
    else {
      toast("success", "Nota guardada com sucesso!");
      await load();
    }
  }

  async function viewProof(path: string) {
    const { data, error } = await track(
      sb.storage.from("proofs").createSignedUrl(path, 300)
    );
    if (error || !data) toast("error", "Não foi possível abrir o comprovativo.");
    else window.open(data.signedUrl, "_blank");
  }

  return (
    <div className="space-y-4">
      {/* filtros */}
      <div className="flex flex-wrap gap-2">
        {(["all", ...statusOrder] as const).map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
              filter === st
                ? "bg-brand-navy text-white"
                : "bg-white border border-slate-300 text-brand-navy hover:bg-brand-sky"
            }`}
          >
            {st === "all" ? "Todos" : statusMeta[st].label}{" "}
            <span className="opacity-60">{counts[st] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className={`${inputClass} pl-9`}
            placeholder="Procurar por código, nome ou telefone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => exportCsv(visible)}
          disabled={visible.length === 0}
          className="shrink-0 inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-brand-navy text-xs font-bold rounded-lg px-3 disabled:opacity-40"
          title="Exportar para Excel (CSV)"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Excel</span>
        </button>
      </div>

      {visible.length === 0 && (
        <div className="text-sm text-brand-textMuted bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
          Nenhum pedido encontrado.
        </div>
      )}

      <ul className="space-y-3">
        {visible.map((o) => {
          const open = openId === o.id;
          const action = nextAction(o);
          return (
            <li
              key={o.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              <button
                onClick={() => setOpenId(open ? null : o.id)}
                className="w-full text-left p-3 flex items-center gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-brand-navy">
                      {o.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusMeta[o.status].badge}`}
                    >
                      {statusMeta[o.status].label}
                    </span>
                    {o.proof_path && o.status === "new" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                        Comprovativo enviado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-brand-textMuted truncate">
                    {o.customer_name} · {fmtDate(o.created_at)}
                  </p>
                </div>
                <span className="font-bold text-sm text-brand-navy shrink-0">
                  {formatKz(o.total)}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 transition ${open ? "rotate-180" : ""}`}
                />
              </button>

              {open && (
                <div className="border-t border-slate-200 p-4 space-y-4 text-sm bg-slate-50/60">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold uppercase text-brand-textMuted">Cliente</p>
                      <p className="font-semibold">{o.customer_name}</p>
                      <p>{o.customer_phone}</p>
                      {o.customer_email && <p className="break-all">{o.customer_email}</p>}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold uppercase text-brand-textMuted">Entrega e pagamento</p>
                      <p>{deliveryText(o)}</p>
                      {o.address && <p className="whitespace-pre-line">{o.address}</p>}
                      <p>Pagamento: {o.payment_label}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] font-bold uppercase text-brand-textMuted">Itens</p>
                    {o.order_items.map((i) => (
                      <div key={i.id} className="flex justify-between gap-3">
                        <span>
                          {i.quantity}× {i.title}{" "}
                          <span className="text-[10px] text-brand-textMuted">
                            ({i.format === "digital" ? "digital" : "físico"})
                          </span>
                        </span>
                        <span className="font-semibold shrink-0">
                          {formatKz(i.unit_price * i.quantity)}
                        </span>
                      </div>
                    ))}
                    {o.delivery_fee > 0 && (
                      <div className="flex justify-between text-brand-textMuted">
                        <span>Taxa de entrega</span>
                        <span>{formatKz(o.delivery_fee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-brand-navy">
                      <span>Total</span>
                      <span>{formatKz(o.total)}</span>
                    </div>
                  </div>

                  {o.notes && (
                    <div>
                      <p className="text-[11px] font-bold uppercase text-brand-textMuted">Observações do cliente</p>
                      <p className="whitespace-pre-line">{o.notes}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {o.proof_path && (
                      <button
                        onClick={() => viewProof(o.proof_path!)}
                        className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-brand-navy text-xs font-bold rounded-full px-4 py-2"
                      >
                        <FileText className="w-4 h-4" /> Ver comprovativo
                      </button>
                    )}
                    <button
                      onClick={() =>
                        window.open(
                          buildWhatsappText(o.customer_phone, waMessage(o)),
                          "_blank"
                        )
                      }
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-full px-4 py-2"
                    >
                      <MessageCircle className="w-4 h-4" /> Falar com o cliente
                    </button>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold uppercase text-brand-textMuted mb-1">Nota interna (só o autor vê)</p>
                    <textarea
                      rows={2}
                      className={inputClass}
                      value={notes[o.id] ?? o.admin_notes ?? ""}
                      onChange={(e) =>
                        setNotes((n) => ({ ...n, [o.id]: e.target.value }))
                      }
                    />
                    <button
                      onClick={() => saveNotes(o)}
                      className="mt-2 text-xs font-bold text-brand-blue"
                    >
                      Guardar nota
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                    {action && (
                      <button
                        disabled={busy}
                        onClick={() => setStatus(o, action.to)}
                        className="bg-brand-blue hover:bg-blue-600 text-white text-xs font-bold rounded-full px-5 py-2.5 disabled:opacity-60"
                      >
                        {action.label}
                      </button>
                    )}

                    <select
                      className="border border-slate-300 rounded-full px-3 py-2 text-xs bg-white"
                      value={o.status}
                      disabled={busy}
                      onChange={(e) => {
                        const to = e.target.value as OrderStatus;
                        if (to === "cancelled") setConfirmCancel(o.id);
                        else setStatus(o, to);
                      }}
                      aria-label="Mudar estado"
                    >
                      {statusOrder.map((st) => (
                        <option key={st} value={st}>
                          {statusMeta[st].label}
                        </option>
                      ))}
                    </select>

                    {o.status !== "cancelled" && (
                      <button
                        onClick={() => setConfirmCancel(o.id)}
                        className="ml-auto text-xs font-bold text-red-600 hover:bg-red-50 rounded-full px-3 py-2"
                      >
                        Cancelar pedido
                      </button>
                    )}
                  </div>

                  {confirmCancel === o.id && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex flex-wrap items-center gap-3">
                      <p className="text-xs text-red-800 flex-1 min-w-[10rem]">
                        Cancelar o pedido {o.code}? O stock dos livros físicos é reposto.
                      </p>
                      <button
                        disabled={busy}
                        onClick={() => setStatus(o, "cancelled")}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-full px-4 py-2 disabled:opacity-60"
                      >
                        Sim, cancelar
                      </button>
                      <button
                        onClick={() => setConfirmCancel(null)}
                        className="text-xs font-semibold text-slate-600"
                      >
                        Não
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
