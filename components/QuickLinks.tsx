import { BookOpen, Image as ImageIcon, Send, User } from "lucide-react";

const items = [
  {
    href: "#livros",
    icon: BookOpen,
    title: "Livros",
    text: "Adquira as obras e descubra novas perspetivas.",
  },
  {
    href: "#sobre",
    icon: User,
    title: "Sobre o Autor",
    text: "Conheça a trajetória, valores e missão de Garcia Pedro Teleka.",
  },
  {
    href: "#galeria",
    icon: ImageIcon,
    title: "Galeria",
    text: "Acompanhe momentos, eventos e sessões de autógrafos.",
  },
  {
    href: "#contacto",
    icon: Send,
    title: "Contacto",
    text: "Fale diretamente com o autor ou envie uma mensagem.",
  },
];

export default function QuickLinks() {
  return (
    <section className="py-10 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map(({ href, icon: Icon, title, text }) => (
            <a
              key={href}
              href={href}
              className="p-5 rounded-2xl bg-brand-grayBg hover:bg-brand-sky border border-slate-200/80 transition group flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-brand-navy text-white flex items-center justify-center flex-shrink-0 group-hover:bg-brand-blue transition">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-brand-navy text-base group-hover:text-brand-blue transition">
                  {title}
                </h4>
                <p className="text-xs text-brand-textMuted mt-1">{text}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
