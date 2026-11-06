import {
  getBooks,
  getPaymentMethods,
  getPhotos,
  getSettings,
  getVideos,
  getZones,
} from "@/lib/data";
import Shop from "@/components/shop/Shop";
import { WhatsappProvider } from "@/components/WhatsappProvider";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import QuickLinks from "@/components/QuickLinks";
import About from "@/components/About";
import Books from "@/components/Books";
import Videos from "@/components/Videos";
import Gallery from "@/components/Gallery";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import AdminGate from "@/components/admin/AdminGate";

// Sempre dados frescos: o que o autor altera no painel aparece logo
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function Home() {
  const [settings, books, videos, photos, methods, zones] = await Promise.all([
    getSettings(),
    getBooks(),
    getVideos(),
    getPhotos(),
    getPaymentMethods(),
    getZones(),
  ]);

  const featured = books.find((b) => b.is_featured) ?? books[0] ?? null;

  return (
    <WhatsappProvider settings={settings}>
      <Header />
      <main>
        <Hero book={featured} books={books} />
        <QuickLinks />
        <About />
        <Books books={books} />
        {videos.length > 0 && <Videos videos={videos} />}
        {photos.length > 0 && <Gallery photos={photos} />}
        <Contact />
      </main>
      <Footer />
      <Shop methods={methods} zones={zones} />
      <AdminGate />
    </WhatsappProvider>
  );
}
