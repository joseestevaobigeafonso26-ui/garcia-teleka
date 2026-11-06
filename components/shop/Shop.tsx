"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { useFeedback } from "@/components/ui/Feedback";
import Sheet from "@/components/ui/Sheet";
import { inputClass } from "@/components/admin/fields";
import { useSettings, useWhatsapp } from "@/components/WhatsappProvider";
import { formatKz } from "@/lib/whatsapp";
import type { DeliveryZone, PaymentMethod } from "@/lib/types";
import { useCart } from "./CartProvider";
import { OPEN_TRACKER_EVENT } from "./events";
import OrderView from "./OrderView";

type Step = "cart" | "details" | "done";
type Placed = { code: string; phone: string };

function Choice({
  active,
  onClick,
  title,
  desc,
  right,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc?: string;
  right?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-3 flex items-start gap-3 transition ${
        active
          ? "border-brand-blue bg-brand-sky/60 ring-1 ring-brand-blue"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <span
        className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 ${
          active ? "border-brand-blue bg-brand-blue" : "border-slate-300"
        }`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-brand-navy">{title}</p>
        {desc && (
          <p className="text-xs text-brand-textMuted whitespace-pre-line">
            {desc}
          </p>
        )}
      </div>
      {right && (
        <span className="text-sm font-bold text-brand-navy shrink-0">
          {right}
        </span>
      )}
    </button>
  );
}

function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-semibold text-brand-textMuted mb-1">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
}

export default function Shop({
  methods,
  zones,
}: {
  methods: PaymentMethod[];
  zones: DeliveryZone[];
}) {
  const cart = useCart();
  const s = useSettings();
  const whatsapp = useWhatsapp();
  const router = useRouter();
  const { toast, track } = useFeedback();

  const [step, setStep] = useState<Step>("cart");
  const [placed, setPlaced] = useState<Placed | null>(null);
  const [busy, setBusy] = useState(false);

  // formulário
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<"pickup" | "delivery">(
    s.pickup_enabled ? "pickup" : "delivery"
  );
  const [zoneId, setZoneId] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [payId, setPayId] = useState("");
  const [hp, setHp] = useState(""); // anti-spam (campo escondido)

  // acompanhar pedido
  const [tracker, setTracker] = useState(false);
  const [tCode, setTCode] = useState("");
  const [tPhone, setTPhone] = useState("");
  const [lookup, setLookup] = useState<Placed | null>(null);

  useEffect(() => {
    const open = () => {
      try {
        const last = JSON.parse(localStorage.getItem("gpt_last_order") || "null");
        if (last?.code) {
          setTCode(last.code);
          setTPhone(last.phone ?? "");
        }
      } catch {
        /* ignorar */
      }
      setLookup(null);
      setTracker(true);
    };
    window.addEventListener(OPEN_TRACKER_EVENT, open);
    return () => window.removeEventListener(OPEN_TRACKER_EVENT, open);
  }, []);

  const closeShop = useCallback(() => {
    cart.closeCart();
    if (step === "done") {
      setStep("cart");
      setPlaced(null);
    }
  }, [cart, step]);

  if (!isSupabaseConfigured) return null;

  const needsShipping = cart.lines.some((l) => l.format === "physical");
  const payOptions = methods.filter((m) => needsShipping || m.kind !== "cash");
  const zone = zones.find((z) => z.id === zoneId);
  const fee = needsShipping && method === "delivery" && zone ? zone.fee_kz : 0;
  const total = cart.subtotal + fee;

  const phoneDigits = phone.replace(/[^0-9]/g, "");
  const canSubmit =
    name.trim().length >= 2 &&
    phoneDigits.length >= 9 &&
    !!payId &&
    (!needsShipping ||
      method === "pickup" ||
      (!!zoneId && address.trim().length >= 3));

  async function submit() {
    const sb = getSupabase();
    if (!sb || !canSubmit) return;
    setBusy(true);
    const payload = {
      name: name.trim(),
      phone: phoneDigits,
      email: email.trim(),
      delivery_method: needsShipping ? method : "digital",
      zone_id: needsShipping && method === "delivery" ? zoneId : null,
      address: needsShipping && method === "delivery" ? address.trim() : null,
      notes: notes.trim(),
      payment_method_id: payId,
      hp,
      items: cart.lines.map((l) => ({
        book_id: l.bookId,
        format: l.format,
        qty: l.qty,
      })),
    };
    const { data, error } = await track(sb.rpc("create_order", { p: payload }));
    if (error || !data) {
      toast("error", error?.message ?? "Não foi possível registar o pedido.");
      setBusy(false);
      return;
    }
    const res = data as { code: string; total: number };
    try {
      localStorage.setItem(
        "gpt_last_order",
        JSON.stringify({ code: res.code, phone: phoneDigits })
      );
    } catch {
      /* ignorar */
    }
    cart.clear();
    setPlaced({ code: res.code, phone: phoneDigits });
    setStep("done");
    toast("success", "Pedido registado com sucesso!");
    router.refresh(); // atualiza o stock mostrado no site
    setBusy(false);
  }

  function lookupOrder(e: React.FormEvent) {
    e.preventDefault();
    setLookup({ code: tCode.trim().toUpperCase(), phone: tPhone });
  }

  return (
    <>
      {/* ===== CARRINHO / CHECKOUT ===== */}
      {cart.isOpen && (
        <>
          {step === "cart" && (
            <Sheet
              title="O seu carrinho"
              subtitle={
                cart.count > 0
                  ? `${cart.count} ${cart.count === 1 ? "item" : "itens"}`
                  : undefined
              }
              onClose={closeShop}
              footer={
                cart.lines.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-brand-navy">
                      <span className="text-sm font-semibold">Subtotal</span>
                      <span className="text-xl font-bold">
                        {formatKz(cart.subtotal)}
                      </span>
                    </div>
                    <button
                      onClick={() => setStep("details")}
                      className="w-full bg-brand-blue hover:bg-blue-600 text-white font-bold rounded-full py-3 text-sm transition"
                    >
                      Continuar
                    </button>
                    <button
                      onClick={closeShop}
                      className="w-full text-xs font-semibold text-brand-blue"
                    >
                      Continuar a ver livros
                    </button>
                  </div>
                ) : undefined
              }
            >
              {cart.lines.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-brand-textMuted">
                    O seu carrinho está vazio.
                  </p>
                  <button
                    onClick={closeShop}
                    className="text-sm font-bold text-brand-blue"
                  >
                    Ver livros
                  </button>
                  <div>
                    <button
                      onClick={() =>
                        window.dispatchEvent(new Event(OPEN_TRACKER_EVENT))
                      }
                      className="text-xs text-brand-textMuted underline"
                    >
                      Já fez um pedido? Acompanhar pedido
                    </button>
                  </div>
                </div>
              ) : (
                <ul className="space-y-3">
                  {cart.lines.map((l) => (
                    <li
                      key={l.key}
                      className="bg-white rounded-xl border border-slate-200 p-3 flex gap-3"
                    >
                      <div className="relative w-14 h-20 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                        <Image
                          src={l.cover}
                          alt={l.title}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col justify-between">
                        <div>
                          <p className="font-serif font-bold text-sm text-brand-navy leading-snug">
                            {l.title}
                          </p>
                          <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-sky text-brand-blue">
                            {l.format === "digital" ? "Digital (PDF)" : "Físico"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-2">
                          {l.format === "physical" ? (
                            <div className="inline-flex items-center border border-slate-300 rounded-full">
                              <button
                                onClick={() => cart.setQty(l.key, l.qty - 1)}
                                className="p-1.5 disabled:opacity-30"
                                disabled={l.qty <= 1}
                                aria-label="Menos"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-6 text-center text-sm font-semibold">
                                {l.qty}
                              </span>
                              <button
                                onClick={() => cart.setQty(l.key, l.qty + 1)}
                                className="p-1.5 disabled:opacity-30"
                                disabled={l.max !== null && l.qty >= l.max}
                                aria-label="Mais"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-brand-textMuted">
                              1 ficheiro
                            </span>
                          )}
                          <span className="font-bold text-sm text-brand-navy">
                            {formatKz(l.price * l.qty)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => cart.remove(l.key)}
                        className="self-start p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                        aria-label="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Sheet>
          )}

          {step === "details" && (
            <Sheet
              title="Finalizar pedido"
              subtitle="Sem criar conta"
              onClose={closeShop}
              onBack={() => setStep("cart")}
              footer={
                <div className="space-y-3">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-brand-textMuted">
                      <span>Subtotal</span>
                      <span>{formatKz(cart.subtotal)}</span>
                    </div>
                    {needsShipping && method === "delivery" && (
                      <div className="flex justify-between text-brand-textMuted">
                        <span>Entrega{zone ? ` — ${zone.name}` : ""}</span>
                        <span>{zone ? formatKz(fee) : "—"}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-brand-navy text-lg font-bold">
                      <span>Total</span>
                      <span>{formatKz(total)}</span>
                    </div>
                  </div>
                  <button
                    onClick={submit}
                    disabled={!canSubmit || busy}
                    className="w-full bg-brand-blue hover:bg-blue-600 text-white font-bold rounded-full py-3 text-sm transition disabled:opacity-50"
                  >
                    {busy ? "A registar…" : "Confirmar pedido"}
                  </button>
                </div>
              }
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
                className="space-y-6"
              >
                {/* honeypot */}
                <input
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                  value={hp}
                  onChange={(e) => setHp(e.target.value)}
                />

                <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                  <h3 className="font-serif font-bold text-brand-navy">
                    Os seus dados
                  </h3>
                  <div>
                    <Label required>Nome</Label>
                    <input
                      className={inputClass}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <Label required>Telefone / WhatsApp</Label>
                    <input
                      className={inputClass}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="923 000 000"
                    />
                  </div>
                  <div>
                    <Label>Email (opcional)</Label>
                    <input
                      type="email"
                      className={inputClass}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                </section>

                {needsShipping ? (
                  <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                    <h3 className="font-serif font-bold text-brand-navy">
                      Como quer receber?
                    </h3>
                    {!s.pickup_enabled && !s.delivery_enabled && (
                      <p className="text-xs text-red-600">
                        De momento não há levantamento nem entrega disponíveis.
                        Fale com o autor pelo WhatsApp.
                      </p>
                    )}
                    {s.pickup_enabled && (
                      <Choice
                        active={method === "pickup"}
                        onClick={() => setMethod("pickup")}
                        title="Levantamento no local"
                        desc={s.pickup_info}
                        right="Grátis"
                      />
                    )}
                    {s.delivery_enabled && zones.length > 0 && (
                      <Choice
                        active={method === "delivery"}
                        onClick={() => setMethod("delivery")}
                        title="Entrega ao domicílio"
                        desc="O preço depende da zona."
                      />
                    )}
                    {method === "delivery" && s.delivery_enabled && (
                      <div className="space-y-3 pt-1">
                        <div>
                          <Label required>Zona de entrega</Label>
                          <select
                            className={inputClass}
                            value={zoneId}
                            onChange={(e) => setZoneId(e.target.value)}
                          >
                            <option value="">Escolha a zona…</option>
                            {zones.map((z) => (
                              <option key={z.id} value={z.id}>
                                {z.name} — {formatKz(z.fee_kz)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label required>Morada / ponto de referência</Label>
                          <textarea
                            rows={2}
                            className={inputClass}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </section>
                ) : (
                  <section className="bg-brand-sky/60 border border-blue-100 rounded-2xl p-4 text-sm text-brand-navy">
                    Só livros digitais: não há entrega. O download fica
                    disponível na página do pedido assim que o pagamento for
                    confirmado.
                  </section>
                )}

                <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                  <h3 className="font-serif font-bold text-brand-navy">
                    Forma de pagamento
                  </h3>
                  {payOptions.length === 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-red-600">
                        As formas de pagamento ainda não estão configuradas.
                      </p>
                      <button
                        type="button"
                        onClick={() => whatsapp()}
                        className="text-xs font-bold text-brand-blue underline"
                      >
                        Fale com o autor no WhatsApp
                      </button>
                    </div>
                  ) : (
                    payOptions.map((m) => (
                      <Choice
                        key={m.id}
                        active={payId === m.id}
                        onClick={() => setPayId(m.id)}
                        title={m.label}
                        desc={
                          payId === m.id && m.kind === "cash"
                            ? m.details
                            : m.kind === "cash"
                            ? undefined
                            : "Os dados para pagar aparecem a seguir, depois de confirmar o pedido."
                        }
                      />
                    ))
                  )}
                </section>

                <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
                  <Label>Observações (opcional)</Label>
                  <textarea
                    rows={2}
                    className={inputClass}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Dedicatória para o autógrafo, horário preferido…"
                  />
                </section>
              </form>
            </Sheet>
          )}

          {step === "done" && placed && (
            <Sheet
              title="Pedido registado"
              onClose={closeShop}
              footer={
                <button
                  onClick={closeShop}
                  className="w-full border border-slate-300 text-brand-navy font-semibold rounded-full py-3 text-sm hover:bg-slate-50"
                >
                  Fechar
                </button>
              }
            >
              <OrderView code={placed.code} phone={placed.phone} justPlaced />
            </Sheet>
          )}
        </>
      )}

      {/* ===== ACOMPANHAR PEDIDO ===== */}
      {tracker && (
        <Sheet
          title="Acompanhar pedido"
          subtitle="Use o código do pedido e o seu telefone"
          onClose={() => setTracker(false)}
        >
          {lookup ? (
            <div className="space-y-4">
              <OrderView code={lookup.code} phone={lookup.phone} />
              <button
                onClick={() => setLookup(null)}
                className="w-full text-xs font-semibold text-brand-blue"
              >
                Consultar outro pedido
              </button>
            </div>
          ) : (
            <form
              onSubmit={lookupOrder}
              className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3"
            >
              <div>
                <Label required>Código do pedido</Label>
                <input
                  className={inputClass}
                  value={tCode}
                  onChange={(e) => setTCode(e.target.value)}
                  placeholder="GPT-0042"
                  required
                />
              </div>
              <div>
                <Label required>Telefone usado na compra</Label>
                <input
                  className={inputClass}
                  value={tPhone}
                  onChange={(e) => setTPhone(e.target.value)}
                  inputMode="tel"
                  required
                />
              </div>
              <button className="w-full bg-brand-blue hover:bg-blue-600 text-white font-bold rounded-full py-3 text-sm">
                Ver pedido
              </button>
            </form>
          )}
        </Sheet>
      )}
    </>
  );
}
