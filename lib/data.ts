import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./supabase";
import {
  fallbackBooks,
  fallbackPhotos,
  fallbackSettings,
  fallbackVideos,
} from "./fallback";
import type {
  Book,
  DeliveryZone,
  GalleryPhoto,
  PaymentMethod,
  SiteSettings,
  Video,
} from "./types";

/**
 * Cliente só para leitura no servidor, SEM cache.
 * (O Next.js guarda respostas de fetch em cache; sem isto, livros apagados
 * no painel continuariam a aparecer no site.)
 */
function serverClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
      },
    }
  );
}

// Só usa os dados de demonstração se o Supabase não estiver configurado
// ou se houver um erro. Tabela vazia = lista vazia (o autor apagou tudo).
async function fetchTable<T>(table: string, fallback: T[]): Promise<T[]> {
  const sb = serverClient();
  if (!sb) return fallback;
  const { data, error } = await sb
    .from(table)
    .select("*")
    .order("sort_order", { ascending: true });
  if (error || !data) return fallback;
  return data as T[];
}

export const getBooks = () => fetchTable<Book>("books", fallbackBooks);
export const getVideos = () => fetchTable<Video>("videos", fallbackVideos);
export const getPhotos = () =>
  fetchTable<GalleryPhoto>("gallery_photos", fallbackPhotos);

async function fetchActive<T>(table: string): Promise<T[]> {
  const sb = serverClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from(table)
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return data as T[];
}

export const getPaymentMethods = () =>
  fetchActive<PaymentMethod>("payment_methods");
export const getZones = () => fetchActive<DeliveryZone>("delivery_zones");

export async function getSettings(): Promise<SiteSettings> {
  const sb = serverClient();
  if (!sb) return fallbackSettings;
  const { data, error } = await sb
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) return fallbackSettings;
  return { ...fallbackSettings, ...data } as SiteSettings;
}
