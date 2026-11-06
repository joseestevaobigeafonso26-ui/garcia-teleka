export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "checkbox"
  | "image"
  | "video"
  | "select"
  | "privatefile";

export type Field = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  /** Se vazio, guarda null na base de dados */
  nullable?: boolean;
  help?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  /** Mostra o campo só quando a condição for verdadeira */
  showIf?: (row: Record<string, unknown>) => boolean;
};

export const inputClass =
  "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-blue bg-white";

export const NO_PERMISSION =
  "Sem permissão para alterar. Confirme que o seu email está na tabela admins do Supabase.";
