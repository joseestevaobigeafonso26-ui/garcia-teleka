"use client";

import { createContext, useContext } from "react";
import { buildWhatsappUrl } from "@/lib/whatsapp";
import { fallbackSettings } from "@/lib/fallback";
import type { SiteSettings } from "@/lib/types";

const SettingsContext = createContext<SiteSettings>(fallbackSettings);

export function WhatsappProvider({
  settings,
  children,
}: {
  settings: SiteSettings;
  children: React.ReactNode;
}) {
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

export function useWhatsapp() {
  const { whatsapp_number, author_name } = useContext(SettingsContext);
  return (titulo?: string, preco?: string) => {
    window.open(
      buildWhatsappUrl(whatsapp_number, titulo, preco, author_name),
      "_blank"
    );
  };
}
