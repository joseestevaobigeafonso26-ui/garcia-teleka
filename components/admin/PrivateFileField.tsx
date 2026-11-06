"use client";

import { useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { useFeedback } from "@/components/ui/Feedback";

/** Envio de ficheiro PRIVADO (livro digital). Guarda o caminho, não um link público. */
export default function PrivateFileField({
  value,
  onChange,
  folder,
}: {
  value: string;
  onChange: (path: string) => void;
  folder: string;
}) {
  const { toast, track } = useFeedback();
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true);
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${folder}/${Date.now()}-${safe}`;
    const { error } = await track(
      sb.storage.from("digital").upload(path, file, { upsert: false })
    );
    if (error) {
      toast("error", `Falha no envio: ${error.message}`);
    } else {
      onChange(path);
      toast("success", "Ficheiro digital enviado com sucesso!");
    }
    setBusy(false);
  }

  const fileName = value ? value.split("/").pop()?.replace(/^\d+-/, "") : "";

  return (
    <div className="space-y-2">
      {value ? (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
          <FileText className="w-4 h-4 text-brand-blue shrink-0" />
          <span className="truncate flex-1">{fileName}</span>
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-red-500 hover:bg-red-50 rounded p-1"
            aria-label="Remover ficheiro"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <p className="text-xs text-brand-textMuted">Nenhum ficheiro enviado.</p>
      )}
      <label
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-navy text-white text-xs font-bold transition ${
          busy ? "opacity-60" : "cursor-pointer hover:bg-brand-blue"
        }`}
      >
        <Upload className="w-3.5 h-3.5" />
        {busy ? "A enviar..." : value ? "Substituir ficheiro" : "Enviar PDF / EPUB"}
        <input
          type="file"
          accept=".pdf,.epub,application/pdf,application/epub+zip"
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}
