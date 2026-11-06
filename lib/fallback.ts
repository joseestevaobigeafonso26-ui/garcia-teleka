import type { Book, GalleryPhoto, SiteSettings, Video } from "./types";

const U = (id: string, w: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const fallbackSettings: SiteSettings = {
  whatsapp_number: "244923000000",
  author_name: "Garcia Pedro Teleka",
  author_tagline: "Escritor · Palestrante · Mentor",
  hero_kicker: "LIVROS QUE INSPIRAM, TRANSFORMAM E FAZEM PENSAR",
  hero_description:
    "Através das suas obras, Garcia Pedro Teleka partilha experiências de vida, valores e ensinamentos que conectam o ser humano ao seu propósito.",
  about_quote: "A verdadeira força está em nunca desistir dos seus sonhos.",
  about_bio_1:
    "Escritor, palestrante e mentor, Garcia Pedro Teleka é um dos nomes emergentes da literatura contemporânea, conhecido por suas obras que abordam temas como superação, fé, disciplina e desenvolvimento pessoal.",
  about_bio_2:
    "Com uma escrita profunda e inspiradora, tem vindo a impactar milhares de leitores, dentro e fora de Angola, motivando jovens e adultos a alcançarem a sua melhor versão.",
  books_intro:
    "Livros que passam mensagens edificantes, despertam a mente e fortalecem o espírito.",
  gallery_intro:
    "Imagens de eventos, lançamentos, sessões de autógrafos e muito mais.",
  contact_title: "Fale Diretamente com Garcia Pedro Teleka",
  contact_text:
    "Para convites de palestras, mentorias, encomendas de livros em lote ou dúvidas sobre e-books, entre em contacto via WhatsApp.",
  footer_quote: "Grandes mudanças começam com grandes decisões.",
  facebook_url: "https://facebook.com",
  instagram_url: "https://instagram.com",
  youtube_url: "https://youtube.com",
  pickup_enabled: true,
  pickup_info: "Levantamento combinado com o autor pelo WhatsApp.",
  delivery_enabled: true,
};

export const fallbackBooks: Book[] = [
  {
    id: "1",
    title: "Quando os Bons Decidem Falar",
    category: "Autoajuda | Motivação",
    description:
      "Sobre posicionamento, valores e a responsabilidade de liderar transformações sociais.",
    price_kz: 8000,
    cover_url: U("1544716278-ca5e3f4abd8c", 500),
    sample_text:
      "Capítulo 1: O Silêncio Ruinoso\n\nNão é o ruído dos maus que destrói a sociedade, mas o silêncio complacente daqueles que carregam a luz e escolhem calar. Quando a verdade recua, a mentira avança com a firmeza de um exército não contestado...\n\nO verdadeiro valor de um líder mede-se no momento em que a decisão certa exige coragem para falar sozinho.",
    badge: "Lançamento",
    is_featured: true,
    sort_order: 1,
  },
  {
    id: "2",
    title: "Disciplina é Liberdade",
    category: "Desenvolvimento Pessoal",
    description:
      "Como construir hábitos sólidos para conquistar a verdadeira independência profissional e pessoal.",
    price_kz: 7500,
    cover_url: U("1512820790803-83ca734da794", 500),
    sample_text:
      "Capítulo 1: A Ilusão do Atalho\n\nTodos querem o resultado da vitória, mas poucos aceitam o peso da preparação diária...",
    badge: null,
    is_featured: false,
    sort_order: 2,
  },
  {
    id: "3",
    title: "Sonhos em Ação",
    category: "Motivação | Superação",
    description:
      "Transforme ideias em metas concretas e vença o medo da execução.",
    price_kz: 7500,
    cover_url: U("1516979187457-637abb4f9353", 500),
    sample_text:
      "Capítulo 1: Da Ideia à Realidade\n\nSonhar é gratuito, mas realizar exige o preço do foco inabalável...",
    badge: null,
    is_featured: false,
    sort_order: 3,
  },
  {
    id: "4",
    title: "O Poder da Fé",
    category: "Espiritualidade | Vida",
    description:
      "Encontre refúgio e força espiritual para superar os momentos de maior adversidade.",
    price_kz: 6500,
    cover_url: U("1476275466078-4007374efbbe", 500),
    sample_text:
      "Capítulo 1: A Ancoragem da Alma\n\nQuando a tempestade exterior parece desmoronar tudo, a fé é a âncora invisível que nos segura...",
    badge: null,
    is_featured: false,
    sort_order: 4,
  },
];

const DEMO_VIDEO = "https://www.w3schools.com/html/mov_bbb.mp4";

export const fallbackVideos: Video[] = [
  {
    id: "1",
    title: "Bastidores: Preparação para a Grande Palestra",
    tag: "Palestra",
    duration: "40 seg",
    thumbnail_url: U("1475721027785-f74eccf877e2", 400),
    video_url: DEMO_VIDEO,
    sort_order: 1,
  },
  {
    id: "2",
    title: "A rotina de escrita nas primeiras horas da manhã",
    tag: "Escrita",
    duration: "30 seg",
    thumbnail_url: U("1455390582262-044cdead277a", 400),
    video_url: DEMO_VIDEO,
    sort_order: 2,
  },
  {
    id: "3",
    title: "Sessão de Autógrafos e carinho dos leitores",
    tag: "Evento",
    duration: "55 seg",
    thumbnail_url: U("1511578314322-379afb476865", 400),
    video_url: DEMO_VIDEO,
    sort_order: 3,
  },
  {
    id: "4",
    title: "Sessão de mentoria em grupo sobre propósito",
    tag: "Mentoria",
    duration: "45 seg",
    thumbnail_url: U("1522202176988-66273c2fd55f", 400),
    video_url: DEMO_VIDEO,
    sort_order: 4,
  },
];

export const fallbackPhotos: GalleryPhoto[] = [
  {
    id: "1",
    image_url: U("1475721027785-f74eccf877e2", 800),
    caption: "Palestra Principal sobre Liderança",
    sort_order: 1,
  },
  {
    id: "2",
    image_url: U("1511578314322-379afb476865", 800),
    caption: "Apresentação Oficial da Obra",
    sort_order: 2,
  },
  {
    id: "3",
    image_url: U("1455390582262-044cdead277a", 800),
    caption: "Sessão Individual de Autógrafos",
    sort_order: 3,
  },
  {
    id: "4",
    image_url: U("1522202176988-66273c2fd55f", 800),
    caption: "Fotografia com Leitores",
    sort_order: 4,
  },
];
