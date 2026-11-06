"use client";

import { inputClass, type Field } from "./fields";
import UploadField from "./UploadField";
import PrivateFileField from "./PrivateFileField";

export default function FieldInput({
  field,
  value,
  onChange,
  folder,
}: {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
  folder: string;
}) {
  const str = value == null ? "" : String(value);

  return (
    <div>
      <label className="block text-xs font-semibold text-brand-textMuted mb-1">
        {field.label}
        {field.required && <span className="text-red-500"> *</span>}
      </label>

      {field.type === "text" && (
        <input
          className={inputClass}
          value={str}
          required={field.required}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {field.type === "number" && (
        <input
          type="number"
          min={0}
          inputMode="numeric"
          className={inputClass}
          value={str}
          required={field.required}
          onChange={(e) =>
            onChange(e.target.value === "" ? 0 : Number(e.target.value))
          }
        />
      )}
      {field.type === "textarea" && (
        <textarea
          rows={5}
          className={inputClass}
          value={str}
          required={field.required}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {field.type === "select" && (
        <select
          className={inputClass}
          value={str}
          required={field.required}
          onChange={(e) => onChange(e.target.value)}
        >
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
      {field.type === "checkbox" && (
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
          />
          Sim
        </label>
      )}
      {(field.type === "image" || field.type === "video") && (
        <UploadField
          value={str}
          kind={field.type}
          folder={folder}
          onChange={onChange}
        />
      )}
      {field.type === "privatefile" && (
        <PrivateFileField value={str} folder={folder} onChange={onChange} />
      )}
      {field.help && (
        <p className="text-[11px] text-brand-textMuted mt-1">{field.help}</p>
      )}
    </div>
  );
}
