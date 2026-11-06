"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck, X } from "lucide-react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { useFeedback } from "@/components/ui/Feedback";
import { formatKz } from "@/lib/whatsapp";
import { inputClass } from "./fields";
import AdminPanel from "./AdminPanel";

export const OPEN_ADMIN_EVENT = "open-admin";

/**
 * Área reservada dentro do próprio site.
 * - Visitantes só veem o link discreto "Área reservada" no rodapé.
 * - Só entra quem tiver as credenciais (sem registo de contas).
 */
export default function AdminGate() {
  const sb = getSupabase();
  const router = useRouter();
  const { toast, track } = useFeedback();
  const [logged, setLogged] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(0);

  // Sessão existente + mudanças de sessão
  useEffect(() => {
    const wantsAdmin = () => {
      const has = new URLSearchParams(window.location.search).has("admin");
      if (has) window.history.replaceState(null, "", window.location.pathname);
      return has;
    };
    if (!sb) {
      if (wantsAdmin()) setShowLogin(true);
      return;
    }
    sb.auth.getSession().then(({ data }) => {
      const has = !!data.session;
      setLogged(has);
      if (wantsAdmin()) {
        if (has) setShowPanel(true);
        else setShowLogin(true);
      }
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) =>
      setLogged(!!session)
    );
    return () => sub.subscription.unsubscribe();
  }, [sb]);

  // O link do rodapé dispara este evento
  useEffect(() => {
    const open = () => {
      if (logged) setShowPanel(true);
      else setShowLogin(true);
    };
    window.addEventListener(OPEN_ADMIN_EVENT, open);
    return () => window.removeEventListener(OPEN_ADMIN_EVENT, open);
  }, [logged]);

  // Novos pedidos em tempo real (só para o administrador autenticado)
  useEffect(() => {
    if (!sb || !logged) return;

    const refresh = async () => {
      const { count } = await sb
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "new");
      setPending(count ?? 0);
    };
    refresh();

    const channel = sb
      .channel("orders-watch")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const row = payload.new as { code?: string; total?: number };
          toast(
            "success",
            `Novo pedido ${row.code ?? ""} — ${formatKz(row.total ?? 0)}`
          );
          refresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        () => refresh()
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [sb, logged, toast]);

  const logout = useCallback(async () => {
    await sb?.auth.signOut();
    setShowPanel(false);
    toast("info", "Sessão terminada.");
    router.refresh();
  }, [sb, toast, router]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    if (!sb) return;
    setBusy(true);

    const { error } = await track(
      sb.auth.signInWithPassword({ email: email.trim(), password })
    );
    if (error) {
      const m = error.message.toLowerCase();
      let text: string;
      if (m.includes("invalid login credentials")) {
        text =
          "Email ou palavra-passe incorretos (ou o utilizador não existe neste projeto Supabase).";
      } else if (m.includes("email not confirmed")) {
        text =
          "Email ainda não confirmado. No Supabase: Authentication → Users → ⋯ → Confirm user.";
      } else if (m.includes("invalid api key") || m.includes("apikey")) {
        text =
          "Chave do Supabase inválida. Verifique NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local e reinicie o servidor.";
      } else if (m.includes("fetch") || m.includes("network")) {
        text =
          "Não foi possível ligar ao Supabase. Verifique NEXT_PUBLIC_SUPABASE_URL em .env.local.";
      } else {
        text = error.message;
      }
      toast("error", text);
      setBusy(false);
      return;
    }

    // Só administradores autorizados entram
    const { data: isAdmin } = await track(sb.rpc("is_admin"));
    if (!isAdmin) {
      await sb.auth.signOut();
      toast("error", "Esta conta não tem permissão de administrador.");
      setBusy(false);
      return;
    }

    setPassword("");
    setShowLogin(false);
    setShowPanel(true);
    toast("success", "Bem-vindo ao painel do autor!");
    setBusy(false);
  }

  return (
    <>
      {logged && !showPanel && (
        <button
          onClick={() => setShowPanel(true)}
          className="fixed bottom-5 left-5 z-50 inline-flex items-center gap-2 bg-brand-navy hover:bg-brand-blue text-white text-sm font-bold px-5 py-3 rounded-full shadow-2xl transition"
        >
          <ShieldCheck className="w-4 h-4" /> Painel do Autor
          {pending > 0 && (
            <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1 rounded-full bg-amber-400 text-brand-navy text-xs font-bold flex items-center justify-center shadow">
              {pending}
            </span>
          )}
        </button>
      )}

      {showLogin && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowLogin(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLogin(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-700"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 rounded-full bg-brand-navy text-white flex items-center justify-center mx-auto mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-xl font-bold text-brand-navy text-center">
              Área reservada
            </h2>
            <p className="text-xs text-brand-textMuted text-center mb-5">
              Acesso exclusivo do autor.
            </p>

            {!isSupabaseConfigured ? (
              <p className="text-xs text-red-600 text-center">
                Configure o Supabase em <code>.env.local</code> para ativar o
                acesso.
              </p>
            ) : (
              <form onSubmit={login} className="space-y-3">
                <input
                  type="email"
                  required
                  autoFocus
                  autoComplete="username"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Palavra-passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
                <button
                  disabled={busy}
                  className="w-full bg-brand-blue hover:bg-blue-600 text-white font-bold rounded-lg py-2.5 text-sm disabled:opacity-60"
                >
                  {busy ? "A entrar..." : "Entrar"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {logged && showPanel && (
        <AdminPanel
          onClose={() => setShowPanel(false)}
          onLogout={logout}
          pending={pending}
        />
      )}
    </>
  );
}
