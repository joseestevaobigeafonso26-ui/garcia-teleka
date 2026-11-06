"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { useFeedback } from "@/components/ui/Feedback";
import { inputClass } from "./fields";

export default function UploadField({
  value,
  onChange,
  kind,
  folder,
}: {
  value: string;
  onChange: (url: string) => void;
  kind: "image" | "video";
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
      sb.storage
        .from("media")
        .upload(path, file, { cacheControl: "31536000", upsert: false })
    );
    if (error) {
      toast("error", `Falha no envio: ${error.message}`);
    } else {
      const { data } = sb.storage.from("media").getPublicUrl(path);
      onChange(data.publicUrl);
      toast("success", "Ficheiro enviado com sucesso!");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-2">
      {value && kind === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt=""
          className="h-24 w-auto rounded-lg border border-slate-200 object-cover"
        />
      )}
      {value && kind === "video" && (
        <video
          src={value}
          controls
          className="h-32 rounded-lg border border-slate-200"
        />
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          className={inputClass}
          value={value}
          placeholder="Cole um link ou envie um ficheiro →"
          onChange={(e) => onChange(e.target.value)}
        />
        <label
          className={`shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-brand-navy text-white text-xs font-bold transition ${
            busy ? "opacity-60" : "cursor-pointer hover:bg-brand-blue"
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          {busy ? "A enviar..." : "Enviar"}
          <input
            type="file"
            accept={kind === "image" ? "image/*" : "video/*"}
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
    </div>
  );
}
