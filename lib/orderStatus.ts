export type OrderStatus =
  | "new"
  | "paid"
  | "preparing"
  | "delivered"
  | "cancelled";

export const statusMeta: Record<
  OrderStatus,
  { label: string; customer: string; badge: string }
> = {
  new: {
    label: "Novo",
    customer: "Pedido recebido. A aguardar o pagamento e a confirmação do autor.",
    badge: "bg-amber-100 text-amber-800",
  },
  paid: {
    label: "Pago",
    customer: "Pagamento confirmado! Obrigado.",
    badge: "bg-emerald-100 text-emerald-800",
  },
  preparing: {
    label: "Em preparação",
    customer: "O seu pedido está a ser preparado.",
    badge: "bg-blue-100 text-blue-800",
  },
  delivered: {
    label: "Concluído",
    customer: "Pedido concluído. Obrigado pela compra!",
    badge: "bg-slate-200 text-slate-800",
  },
  cancelled: {
    label: "Cancelado",
    customer: "Este pedido foi cancelado.",
    badge: "bg-red-100 text-red-700",
  },
};

export const statusOrder: OrderStatus[] = [
  "new",
  "paid",
  "preparing",
  "delivered",
  "cancelled",
];
