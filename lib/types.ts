export type BookType = "physical" | "digital" | "both";

export type Book = {
  id: string;
  title: string;
  category: string;
  description: string;
  price_kz: number;
  cover_url: string;
  sample_text: string;
  badge: string | null;
  is_featured: boolean;
  sort_order: number;
  // Loja (opcionais: só existem depois de executar supabase/loja.sql)
  book_type?: BookType;
  digital_price_kz?: number | null;
  digital_path?: string | null;
  track_stock?: boolean;
  stock?: number;
};

export type GalleryPhoto = {
  id: string;
  image_url: string;
  caption: string;
  sort_order: number;
};

export type Video = {
  id: string;
  title: string;
  tag: string;
  duration: string;
  thumbnail_url: string;
  video_url: string;
  sort_order: number;
};

export type PaymentMethod = {
  id: string;
  kind: "bank_transfer" | "multicaixa_express" | "cash" | "other";
  label: string;
  details: string;
  is_active: boolean;
  sort_order: number;
};

export type DeliveryZone = {
  id: string;
  name: string;
  fee_kz: number;
  is_active: boolean;
  sort_order: number;
};

export type SiteSettings = {
  whatsapp_number: string;
  author_name: string;
  author_tagline: string;
  hero_kicker: string;
  hero_description: string;
  about_quote: string;
  about_bio_1: string;
  about_bio_2: string;
  books_intro: string;
  gallery_intro: string;
  contact_title: string;
  contact_text: string;
  footer_quote: string;
  facebook_url: string;
  instagram_url: string;
  youtube_url: string;
  pickup_enabled: boolean;
  pickup_info: string;
  delivery_enabled: boolean;
};
