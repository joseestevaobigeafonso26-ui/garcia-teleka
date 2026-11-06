import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Garcia Pedro Teleka — Escritor, Palestrante e Mentor",
    short_name: "Garcia Teleka",
    description:
      "Livros que inspiram, transformam e fazem pensar. Compre as obras de Garcia Pedro Teleka.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "pt",
    background_color: "#f4f7fb",
    theme_color: "#0b1d3a",
    categories: ["books", "education", "shopping"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Livros", short_name: "Livros", url: "/#livros", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Contacto", short_name: "Contacto", url: "/#contacto", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
