"use client";

import Image from "next/image";
import {
  BookOpen,
  Home,
  MessageCircle,
  Play,
  ShoppingCart,
} from "lucide-react";
import type { Book } from "@/lib/types";
import { formatKz } from "@/lib/whatsapp";
import { defaultFormat, isSoldOut, priceFor } from "@/lib/shop";
import { useSettings } from "./WhatsappProvider";

type Props = {
  main: Book;
  others: Book[];
  onBuy: (book: Book) => void;
  onSample: (book: Book) => void;
  onContact: () => void;
};

export default function PhoneMockup({
  main,
  others,
  onBuy,
  onSample,
  onContact,
}: Props) {
  const s = useSettings();

  return (
    <div className="relative flex justify-center w-full py-8 lg:py-2">
      {/* brilho atrás do telemóvel */}
      <div className="absolute inset-0 m-auto w-64 h-64 sm:w-96 sm:h-96 rounded-full bg-brand-blue/20 blur-3xl pointer-events-none" />

      <div className="relative [perspective:1600px] animate-float">
        <div
          className="group relative w-[250px] min-[400px]:w-[280px] sm:w-[310px] lg:w-[350px] [transform-style:preserve-3d] transition-transform duration-700 ease-out
            [transform:rotateY(-14deg)_rotateX(4deg)_rotateZ(2deg)]
            hover:[transform:rotateY(0deg)_rotateX(0deg)_rotateZ(0deg)]
            lg:[transform:rotateY(-20deg)_rotateX(6deg)_rotateZ(4deg)]
            lg:hover:[transform:rotateY(-4deg)_rotateX(2deg)_rotateZ(1deg)]"
        >
          {/* botões laterais */}
          <span className="absolute -left-[3px] top-24 w-[3px] h-8 rounded-l bg-slate-600" />
          <span className="absolute -left-[3px] top-36 w-[3px] h-12 rounded-l bg-slate-600" />
          <span className="absolute -right-[3px] top-32 w-[3px] h-16 rounded-r bg-slate-600" />

          {/* corpo do telemóvel */}
          <div className="relative aspect-[9/19] rounded-[2.8rem] p-[9px] bg-gradient-to-br from-slate-500 via-slate-800 to-slate-900 ring-1 ring-slate-400/40 shadow-[30px_45px_70px_-25px_rgba(11,29,58,0.55)]">
            {/* ecrã */}
            <div className="relative h-full w-full rounded-[2.2rem] bg-white overflow-hidden flex flex-col">
              {/* notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20 flex items-center justify-end pr-3">
                <span className="w-2 h-2 rounded-full bg-slate-700" />
              </div>

              {/* cabeçalho da app */}
              <div className="pt-10 px-4 pb-2 flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-brand-navy text-white font-serif font-bold text-sm flex items-center justify-center shrink-0">
                  {s.author_name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-serif text-[13px] font-bold text-brand-navy leading-tight truncate">
                    {s.author_name}
                  </p>
                  <p className="text-[8px] uppercase tracking-wider text-brand-textMuted font-semibold truncate">
                    {s.author_tagline}
                  </p>
                </div>
              </div>

              {/* banner: livro em destaque */}
              <div className="mx-3 shrink-0 rounded-2xl bg-gradient-to-r from-brand-navy to-brand-darkBlue text-white p-3 flex gap-3 relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-20 h-20 bg-blue-500/20 rounded-full blur-xl" />
                <div className="relative w-[76px] h-[108px] shrink-0 rounded-lg overflow-hidden book-shadow border border-slate-700">
                  <Image
                    src={main.cover_url}
                    alt={main.title}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-1.5">
                    <span className="text-[7px] text-amber-300 font-bold uppercase">
                      Obra Principal
                    </span>
                  </div>
                </div>

                <div className="relative min-w-0 space-y-1.5">
                  <span className="bg-blue-500/30 text-blue-200 text-[7px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide inline-block leading-tight">
                    Venda e Sessão de Autógrafo
                  </span>
                  <h3 className="font-serif text-[13px] font-bold leading-snug">
                    {main.title}
                  </h3>
                  <p className="text-[9px] text-slate-300 leading-snug line-clamp-2">
                    {main.description}
                  </p>
                  <div className="text-sm font-bold text-amber-400">
                    {formatKz(priceFor(main, defaultFormat(main)))}
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      onClick={() => onBuy(main)}
                      disabled={isSoldOut(main)}
                      className="bg-brand-blue hover:bg-blue-500 text-white font-bold text-[9px] px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 disabled:bg-slate-500 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-3 h-3" />{" "}
                      {isSoldOut(main) ? "Esgotado" : "Comprar Obra"}
                    </button>
                    <button
                      onClick={() => onSample(main)}
                      className="bg-white/10 hover:bg-white/20 text-white font-medium text-[9px] px-2.5 py-1.5 rounded-lg transition border border-white/20"
                    >
                      Degustação
                    </button>
                  </div>
                </div>
              </div>

              {/* mais obras */}
              {others.length > 0 && (
                <>
                  <div className="px-4 pt-3 flex items-center justify-between shrink-0">
                    <span className="text-[11px] font-bold text-brand-navy">
                      Mais obras
                    </span>
                    <a
                      href="#livros"
                      className="text-[9px] text-brand-blue font-semibold"
                    >
                      Ver todas
                    </a>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar px-3 pt-2 pb-2 space-y-2">
                    {others.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => onBuy(b)}
                        className="w-full flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2 text-left hover:border-brand-blue transition"
                      >
                        <div className="relative w-9 h-12 shrink-0 rounded-md overflow-hidden bg-slate-100">
                          <Image
                            src={b.cover_url}
                            alt={b.title}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-brand-navy truncate">
                            {b.title}
                          </p>
                          <p className="text-[9px] text-brand-textMuted truncate">
                            {b.category}
                          </p>
                          <p className="text-[10px] font-bold text-brand-blue">
                            {formatKz(priceFor(b, defaultFormat(b)))}
                          </p>
                        </div>
                        <span className="w-6 h-6 rounded-full bg-brand-blue text-white flex items-center justify-center shrink-0">
                          <ShoppingCart className="w-3 h-3" />
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {others.length === 0 && <div className="flex-1" />}

              {/* barra inferior */}
              <nav className="shrink-0 border-t border-slate-200 bg-white grid grid-cols-4 pt-2 pb-1">
                <a
                  href="#inicio"
                  className="flex flex-col items-center gap-0.5 text-[8px] font-semibold text-brand-blue"
                >
                  <Home className="w-4 h-4" /> Início
                </a>
                <a
                  href="#livros"
                  className="flex flex-col items-center gap-0.5 text-[8px] font-semibold text-slate-500 hover:text-brand-blue"
                >
                  <BookOpen className="w-4 h-4" /> Livros
                </a>
                <a
                  href="#midia"
                  className="flex flex-col items-center gap-0.5 text-[8px] font-semibold text-slate-500 hover:text-brand-blue"
                >
                  <Play className="w-4 h-4" /> Vídeos
                </a>
                <button
                  onClick={onContact}
                  className="flex flex-col items-center gap-0.5 text-[8px] font-semibold text-slate-500 hover:text-brand-blue"
                >
                  <MessageCircle className="w-4 h-4" /> Contacto
                </button>
              </nav>
              <div className="shrink-0 pb-1.5 bg-white">
                <div className="w-20 h-1 rounded-full bg-slate-800 mx-auto" />
              </div>
            </div>

            {/* reflexo do vidro */}
            <div className="absolute inset-0 rounded-[2.8rem] pointer-events-none bg-gradient-to-tr from-white/10 via-transparent to-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
