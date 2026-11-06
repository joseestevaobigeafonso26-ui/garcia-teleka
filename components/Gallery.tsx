"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, X } from "lucide-react";
import type { GalleryPhoto } from "@/lib/types";
import { useSettings } from "./WhatsappProvider";

export default function Gallery({ photos }: { photos: GalleryPhoto[] }) {
  const s = useSettings();
  const [active, setActive] = useState<GalleryPhoto | null>(null);

  return (
    <section
      id="galeria"
      className="py-16 md:py-24 bg-white border-b border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-bold text-brand-blue uppercase tracking-widest block mb-1">
              GALERIA
            </span>
            <h2 className="font-serif text-3xl font-bold text-brand-navy">
              Momentos que Inspiram
            </h2>
            <p className="text-xs text-brand-textMuted mt-1">
              {s.gallery_intro}
            </p>
          </div>
          <a
            href="#contacto"
            className="inline-flex items-center gap-2 bg-white text-brand-blue font-bold text-xs px-5 py-2.5 rounded-full border border-brand-blue hover:bg-brand-sky transition w-fit"
          >
            <span>Ver Galeria Completa</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {photos.map((p) => (
            <div
              key={p.id}
              onClick={() => setActive(p)}
              className="h-60 rounded-xl overflow-hidden cursor-pointer border border-slate-200 hover:shadow-xl transition group relative"
            >
              <Image
                src={p.image_url}
                alt={p.caption}
                fill
                sizes="(min-width: 768px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover group-hover:scale-105 transition duration-300"
              />
            </div>
          ))}
        </div>
      </div>

      {active && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setActive(null)}
        >
          <div
            className="relative max-w-3xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActive(null)}
              className="absolute -top-10 right-0 text-slate-300 hover:text-white"
            >
              <X className="w-7 h-7" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.image_url}
              alt={active.caption}
              className="w-full h-auto rounded-xl border border-slate-700 shadow-2xl"
            />
            <p className="text-center text-xs text-slate-300 mt-2 font-serif">
              {active.caption}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
