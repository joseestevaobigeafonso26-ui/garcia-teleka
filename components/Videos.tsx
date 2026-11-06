"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Play, X } from "lucide-react";
import type { Video } from "@/lib/types";

export default function Videos({ videos }: { videos: Video[] }) {
  const [active, setActive] = useState<Video | null>(null);
  const player = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (active && player.current) {
      player.current.load();
      player.current.play().catch(() => {});
    }
  }, [active]);

  return (
    <section
      id="midia"
      className="py-16 md:py-20 bg-brand-sky/40 border-b border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-brand-blue uppercase tracking-widest block mb-1">
              BASTIDORES & TRAILERS
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-navy">
              Dia a Dia do Escritor
            </h2>
          </div>
          <span className="text-xs text-brand-textMuted hidden sm:inline">
            Clique para assistir aos vídeos curtos →
          </span>
        </div>

        <div className="flex gap-5 overflow-x-auto pb-4 hide-scrollbar">
          {videos.map((v) => (
            <div
              key={v.id}
              onClick={() => setActive(v)}
              className="flex-shrink-0 w-48 sm:w-56 h-80 bg-brand-navy rounded-2xl overflow-hidden relative cursor-pointer border border-slate-300 hover:border-brand-blue transition group shadow-lg"
            >
              <Image
                src={v.thumbnail_url}
                alt={v.title}
                fill
                sizes="224px"
                className="object-cover group-hover:scale-105 transition duration-300 opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-4 flex flex-col justify-between">
                <span className="bg-brand-blue text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full w-fit uppercase">
                  {v.tag}
                </span>
                <div className="space-y-1">
                  <div className="w-9 h-9 rounded-full bg-brand-blue flex items-center justify-center text-white mb-2 shadow-md">
                    <Play className="w-4 h-4 fill-white" />
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-2">
                    {v.title}
                  </h4>
                  <span className="text-[10px] text-slate-300 block">
                    {v.duration}
                  </span>
                </div>
              </div>
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
            className="relative max-w-sm w-full bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-slate-800 flex justify-between items-center text-white">
              <span className="text-xs font-bold truncate">{active.title}</span>
              <button
                onClick={() => setActive(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-[9/16] bg-black relative flex items-center justify-center">
              <video
                ref={player}
                controls
                className="w-full h-full object-cover"
              >
                <source src={active.video_url} type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
