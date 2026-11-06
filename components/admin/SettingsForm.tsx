"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { fallbackSettings } from "@/lib/fallback";
import type { SiteSettings } from "@/lib/types";
import { useFeedback } from "@/components/ui/Feedback";
import { NO_PERMISSION, type Field } from "./fields";
import FieldInput from "./FieldInput";

type Group = {
  title: string;
  scope: "site" | "shop";
  fields: (Field & { key: keyof SiteSettings })[];
};

const groups: Group[] = [
  {
    title: "WhatsApp (contacto e dúvidas dos clientes)",
    scope: "site",
    fields: [
      {
        key: "whatsapp_number",
        label: "Número com indicativo",
        type: "text",
        required: true,
        placeholder: "244923000000",
        help: "Só números, com indicativo do país (Angola = 244).",
      },
    ],
  },
  {
    title: "Identidade do autor",
    scope: "site",
    fields: [
      { key: "author_name", label: "Nome do autor", type: "text", required: true },
      { key: "author_tagline", label: "Profissões (abaixo do nome)", type: "text" },
    ],
  },
  {
    title: "Página inicial",
    scope: "site",
    fields: [
      { key: "hero_kicker", label: "Frase de destaque (topo)", type: "text" },
      { key: "hero_description", label: "Texto de apresentação", type: "textarea" },
    ],
  },
  {
    title: "Sobre o autor",
    scope: "site",
    fields: [
      { key: "about_quote", label: "Citação em destaque", type: "text" },
      { key: "about_bio_1", label: "Biografia — parágrafo 1", type: "textarea" },
      { key: "about_bio_2", label: "Biografia — parágrafo 2", type: "textarea" },
    ],
  },
  {
    title: "Textos das secções",
    scope: "site",
    fields: [
      { key: "books_intro", label: "Introdução da secção Livros", type: "textarea" },
      { key: "gallery_intro", label: "Introdução da Galeria", type: "text" },
      { key: "contact_title", label: "Título do Contacto", type: "text" },
      { key: "contact_text", label: "Texto do Contacto", type: "textarea" },
    ],
  },
  {
    title: "Rodapé e redes sociais",
    scope: "site",
    fields: [
      { key: "footer_quote", label: "Citação do rodapé", type: "text" },
      { key: "facebook_url", label: "Link do Facebook", type: "text" },
      { key: "instagram_url", label: "Link do Instagram", type: "text" },
      { key: "youtube_url", label: "Link do YouTube", type: "text" },
    ],
  },
  {
    title: "Levantamento e entregas",
    scope: "shop",
    fields: [
      {
        key: "pickup_enabled",
        label: "Aceitar levantamento no local",
        type: "checkbox",
      },
      {
        key: "pickup_info",
        label: "Onde e como levantar",
        type: "textarea",
        help: "Aparece ao cliente no checkout (ex.: morada, horário, sessão de autógrafos).",
      },
      {
        key: "delivery_enabled",
        label: "Fazer entregas ao domicílio",
        type: "checkbox",
        help: "Os preços por zona definem-se abaixo.",
      },
    ],
  },
];

export default function SettingsForm({
  scope = "site",
}: {
  scope?: "site" | "shop";
}) {
  const sb = getSupabase()!;
  const router = useRouter();
  const { toast, track } = useFeedback();
  const [data, setData] = useState<SiteSettings>(fallbackSettings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    track(sb.from("site_settings").select("*").eq("id", 1).maybeSingle()).then(
      ({ data: row }) => row && setData({ ...fallbackSettings, ...row })
    );
  }, [sb, track]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const whatsapp_number = data.whatsapp_number.replace(/[^0-9]/g, "");
    if (!whatsapp_number) {
      toast("error", "Número de WhatsApp inválido.");
      setSaving(false);
      return;
    }
    const { data: rows, error } = await track(
      sb
        .from("site_settings")
        .upsert({ ...data, whatsapp_number, id: 1 })
        .select("id")
    );
    if (error || !rows?.length) {
      toast("error", error?.message ?? NO_PERMISSION);
    } else {
      setData((d) => ({ ...d, whatsapp_number }));
      toast("success", "Informações atualizadas com sucesso!");
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <form onSubmit={save} className="space-y-6">
      {groups
        .filter((g) => g.scope === scope)
        .map((g) => (
          <section
            key={g.title}
            className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4"
          >
            <h3 className="font-serif font-bold text-brand-navy">{g.title}</h3>
            {g.fields.map((f) => (
              <FieldInput
                key={f.key}
                field={f}
                folder="settings"
                value={data[f.key]}
                onChange={(v) =>
                  setData((d) => ({ ...d, [f.key]: v }) as SiteSettings)
                }
              />
            ))}
          </section>
        ))}
      <div
        className={
          scope === "site"
            ? "sticky bottom-0 -mx-4 sm:-mx-6 -mb-5 px-4 sm:px-6 py-3 bg-brand-grayBg/95 backdrop-blur border-t border-slate-200"
            : ""
        }
      >
        <button
          disabled={saving}
          className="w-full sm:w-auto bg-brand-blue hover:bg-blue-600 text-white font-bold rounded-full px-8 py-2.5 text-sm disabled:opacity-60"
        >
          {saving ? "A guardar..." : "Guardar alterações"}
        </button>
      </div>
    </form>
  );
}
