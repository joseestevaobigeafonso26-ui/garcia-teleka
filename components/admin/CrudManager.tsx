"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { useFeedback } from "@/components/ui/Feedback";
import { NO_PERMISSION, type Field } from "./fields";
import FieldInput from "./FieldInput";

type Row = Record<string, unknown> & { id?: string; sort_order?: number };

export default function CrudManager({
  table,
  singular,
  gender,
  fields,
  titleKey,
  thumbKey,
  subtitleKey,
  subtitle,
  defaults,
}: {
  table: string;
  singular: string;
  gender: "m" | "f";
  fields: Field[];
  titleKey: string;
  thumbKey?: string;
  subtitleKey?: string;
  /** Texto de apoio calculado (tem prioridade sobre subtitleKey) */
  subtitle?: (row: Row) => string;
  defaults: Row;
}) {
  const sb = getSupabase()!;
  const router = useRouter();
  const { toast, track } = useFeedback();
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<Row | null>(null);
  const [toDelete, setToDelete] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const sfx = gender === "f" ? "a" : "o";
  const Cap = singular.charAt(0).toUpperCase() + singular.slice(1);

  const load = useCallback(async () => {
    const { data, error } = await track(
      sb.from(table).select("*").order("sort_order", { ascending: true })
    );
    if (error) toast("error", error.message);
    else setRows((data ?? []) as Row[]);
  }, [sb, table, track, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);

    const { id, created_at: _created, ...rest } = editing as Row & {
      created_at?: unknown;
    };
    void _created;
    const payload: Record<string, unknown> = { ...rest };
    for (const f of fields) {
      if (f.nullable && payload[f.key] === "") payload[f.key] = null;
    }

    // Só um livro em destaque de cada vez
    if (table === "books" && payload.is_featured) {
      let q = sb.from("books").update({ is_featured: false }).eq("is_featured", true);
      if (id) q = q.neq("id", id);
      await track(q);
    }

    let errMsg: string | null = null;
    if (id) {
      const { data, error } = await track(
        sb.from(table).update(payload).eq("id", id).select("id")
      );
      errMsg = error?.message ?? (!data?.length ? NO_PERMISSION : null);
    } else {
      const nextOrder =
        rows.reduce((m, r) => Math.max(m, r.sort_order ?? 0), 0) + 1;
      const { error } = await track(
        sb.from(table).insert({ ...payload, sort_order: nextOrder })
      );
      errMsg = error?.message ?? null;
    }

    if (errMsg) {
      toast("error", errMsg);
    } else {
      toast(
        "success",
        id
          ? `${Cap} atualizad${sfx} com sucesso!`
          : `${Cap} cadastrad${sfx} com sucesso!`
      );
      setEditing(null);
      await load();
      router.refresh();
    }
    setSaving(false);
  }

  async function confirmDelete() {
    if (!toDelete?.id) return;
    setBusy(true);
    const { data, error } = await track(
      sb.from(table).delete().eq("id", toDelete.id).select("id")
    );
    if (error || !data?.length) {
      toast("error", error?.message ?? NO_PERMISSION);
    } else {
      toast("danger", `${Cap} apagad${sfx} com sucesso!`);
      await load();
      router.refresh();
    }
    setToDelete(null);
    setBusy(false);
  }

  async function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= rows.length || busy) return;
    setBusy(true);

    const next = [...rows];
    [next[index], next[j]] = [next[j], next[index]];
    // Renumera tudo (evita problemas com posições repetidas)
    const renumbered = next.map((r, idx) => ({ ...r, sort_order: idx + 1 }));
    const changed = renumbered.filter(
      (r) => r.sort_order !== rows.find((o) => o.id === r.id)?.sort_order
    );

    setRows(renumbered); // atualização imediata na lista

    const results = await track(
      Promise.all(
        changed.map((r) =>
          sb
            .from(table)
            .update({ sort_order: r.sort_order })
            .eq("id", r.id!)
            .select("id")
        )
      )
    );
    const failed = results.find((r) => r.error || !r.data?.length);
    if (failed) {
      toast("error", failed.error?.message ?? NO_PERMISSION);
      await load();
    } else {
      toast("success", "Posição atualizada com sucesso!");
      router.refresh();
    }
    setBusy(false);
  }

  if (editing) {
    return (
      <form
        onSubmit={save}
        className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4"
      >
        <h3 className="font-serif font-bold text-lg text-brand-navy">
          {editing.id ? `Editar ${singular}` : `Novo ${singular}`}
        </h3>
        {fields
          .filter((f) => !f.showIf || f.showIf(editing))
          .map((f) => (
          <FieldInput
            key={f.key}
            field={f}
            folder={table}
            value={editing[f.key]}
            onChange={(v) => setEditing({ ...editing, [f.key]: v })}
          />
        ))}
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            disabled={saving}
            className="bg-brand-blue hover:bg-blue-600 text-white font-bold rounded-full px-6 py-2 text-sm disabled:opacity-60"
          >
            {saving ? "A guardar..." : "Guardar"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="px-6 py-2 border border-slate-300 rounded-full text-sm hover:bg-slate-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-brand-textMuted">
          {rows.length} {rows.length === 1 ? "item" : "itens"} · use as setas
          para mudar a ordem no site.
        </p>
        <button
          onClick={() => setEditing({ ...defaults })}
          className="inline-flex items-center gap-1.5 bg-brand-blue hover:bg-blue-600 text-white font-bold text-xs rounded-full px-4 py-2 shrink-0"
        >
          <Plus className="w-4 h-4" /> Novo {singular}
        </button>
      </div>

      <ul className="space-y-3">
        {rows.map((row, i) => (
          <li
            key={row.id}
            className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-center gap-3"
          >
            {thumbKey && row[thumbKey] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={String(row[thumbKey])}
                alt=""
                className="w-14 h-14 rounded-lg object-cover shrink-0 bg-slate-100"
              />
            ) : null}
            <div className="min-w-0 flex-1 basis-40">
              <p className="font-semibold text-sm text-brand-navy truncate">
                {String(row[titleKey] || "(sem título)")}
              </p>
              {(subtitle || subtitleKey) && (
                <p className="text-xs text-brand-textMuted truncate">
                  {subtitle ? subtitle(row) : String(row[subtitleKey!] ?? "")}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-auto">
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0 || busy}
                className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30"
                aria-label="Subir"
                title="Subir"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === rows.length - 1 || busy}
                className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30"
                aria-label="Descer"
                title="Descer"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => setEditing({ ...row })}
                className="p-2 rounded-lg hover:bg-brand-sky text-brand-blue"
                aria-label="Editar"
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => setToDelete(row)}
                className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                aria-label="Apagar"
                title="Apagar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="text-sm text-brand-textMuted bg-white rounded-xl border border-dashed border-slate-300 p-6 text-center">
            Ainda não há itens. Clique em &ldquo;Novo {singular}&rdquo;.
          </li>
        )}
      </ul>

      {toDelete && (
        <div
          className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !busy && setToDelete(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-lg text-brand-navy">
              Apagar {singular}?
            </h4>
            <p className="text-sm text-brand-textMuted mt-1 break-words">
              &ldquo;{String(toDelete[titleKey] || "(sem título)")}&rdquo; será
              removid{sfx} do site. Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setToDelete(null)}
                disabled={busy}
                className="flex-1 py-2 border border-slate-300 rounded-full text-sm hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={busy}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full text-sm disabled:opacity-60"
              >
                {busy ? "A apagar..." : "Apagar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
