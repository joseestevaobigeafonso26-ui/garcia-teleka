"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Banknote, Clock, ShoppingBag } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { useFeedback } from "@/components/ui/Feedback";
import { formatKz } from "@/lib/whatsapp";
import { statusMeta, statusOrder, type OrderStatus } from "@/lib/orderStatus";

type Row = {
  status: OrderStatus;
  total: number;
  created_at: string;
  paid_at: string | null;
  order_items: { title: string; quantity: number; unit_price: number }[];
};

type StockBook = {
  id: string;
  title: string;
  stock: number;
  track_stock: boolean;
  book_type: string;
};

const PAID: OrderStatus[] = ["paid", "preparing", "delivered"];

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Banknote;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${tone}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-[11px] font-semibold text-brand-textMuted">{label}</p>
      <p className="text-lg sm:text-xl font-bold text-brand-navy leading-tight">
        {value}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const sb = getSupabase()!;
  const { toast, track } = useFeedback();
  const [rows, setRows] = useState<Row[]>([]);
  const [books, setBooks] = useState<StockBook[]>([]);

  const load = useCallback(async () => {
    const [o, b] = await track(
      Promise.all([
        sb
          .from("orders")
          .select("status,total,created_at,paid_at,order_items(title,quantity,unit_price)")
          .limit(2000),
        sb.from("books").select("id,title,stock,track_stock,book_type"),
      ])
    );
    if (o.error) toast("error", o.error.message);
    else setRows((o.data ?? []) as unknown as Row[]);
    if (!b.error) setBooks((b.data ?? []) as StockBook[]);
  }, [sb, track, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const s = useMemo(() => {
    const now = new Date();
    const sameMonth = (iso: string) => {
      const d = new Date(iso);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    };
    const sold = rows.filter((r) => PAID.includes(r.status));
    const revenue = sold.reduce((n, r) => n + r.total, 0);
    const monthRevenue = sold
      .filter((r) => sameMonth(r.paid_at ?? r.created_at))
      .reduce((n, r) => n + r.total, 0);

    const byStatus: Record<string, number> = {};
    for (const r of rows) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;

    const top = new Map<string, { qty: number; value: number }>();
    for (const r of sold)
      for (const i of r.order_items) {
        const cur = top.get(i.title) ?? { qty: 0, value: 0 };
        cur.qty += i.quantity;
        cur.value += i.quantity * i.unit_price;
        top.set(i.title, cur);
      }
    const topList = [...top.entries()]
      .map(([title, v]) => ({ title, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return {
      revenue,
      monthRevenue,
      byStatus,
      topList,
      pending: byStatus["new"] ?? 0,
      count: rows.length,
    };
  }, [rows]);

  const lowStock = books
    .filter((b) => b.track_stock && b.book_type !== "digital" && b.stock <= 3)
    .sort((a, b) => a.stock - b.stock);

  const maxStatus = Math.max(1, ...Object.values(s.byStatus));
  const maxQty = Math.max(1, ...s.topList.map((t) => t.qty));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Stat icon={Clock} label="Pedidos novos" value={String(s.pending)} tone="bg-amber-100 text-amber-700" />
        <Stat icon={ShoppingBag} label="Total de pedidos" value={String(s.count)} tone="bg-blue-100 text-blue-700" />
        <Stat icon={Banknote} label="Vendas deste mês" value={formatKz(s.monthRevenue)} tone="bg-emerald-100 text-emerald-700" />
        <Stat icon={Banknote} label="Vendas totais" value={formatKz(s.revenue)} tone="bg-emerald-100 text-emerald-700" />
      </div>
      <p className="text-[11px] text-brand-textMuted -mt-2">
        As vendas contam pedidos com pagamento confirmado.
      </p>

      <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <h3 className="font-serif font-bold text-brand-navy">Pedidos por estado</h3>
        {statusOrder.map((st) => (
          <div key={st} className="flex items-center gap-3 text-xs">
            <span className="w-24 shrink-0 font-semibold text-brand-navy">
              {statusMeta[st].label}
            </span>
            <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  st === "cancelled" ? "bg-red-400" : "bg-brand-blue"
                }`}
                style={{ width: `${((s.byStatus[st] ?? 0) / maxStatus) * 100}%` }}
              />
            </div>
            <span className="w-6 text-right font-bold">{s.byStatus[st] ?? 0}</span>
          </div>
        ))}
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <h3 className="font-serif font-bold text-brand-navy">Livros mais vendidos</h3>
        {s.topList.length === 0 && (
          <p className="text-xs text-brand-textMuted">
            Ainda não há vendas confirmadas.
          </p>
        )}
        {s.topList.map((t) => (
          <div key={t.title} className="space-y-1">
            <div className="flex justify-between gap-3 text-xs">
              <span className="font-semibold text-brand-navy truncate">{t.title}</span>
              <span className="shrink-0 text-brand-textMuted">
                {t.qty} un. · {formatKz(t.value)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${(t.qty / maxQty) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
        <h3 className="font-serif font-bold text-brand-navy flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" /> Stock baixo
        </h3>
        {lowStock.length === 0 ? (
          <p className="text-xs text-brand-textMuted">
            Nenhum livro com stock baixo (só aparecem livros com controlo de
            stock ativo).
          </p>
        ) : (
          lowStock.map((b) => (
            <div key={b.id} className="flex justify-between gap-3 text-sm">
              <span className="truncate">{b.title}</span>
              <span
                className={`shrink-0 font-bold ${
                  b.stock <= 0 ? "text-red-600" : "text-amber-600"
                }`}
              >
                {b.stock <= 0 ? "Esgotado" : `${b.stock} un.`}
              </span>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
