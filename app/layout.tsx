import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { FeedbackProvider } from "@/components/ui/Feedback";
import { CartProvider } from "@/components/shop/CartProvider";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Garcia Pedro Teleka | Escritor · Palestrante · Mentor",
  description:
    "Livros que inspiram, transformam e fazem pensar. Conheça as obras de Garcia Pedro Teleka.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" className={`${jakarta.variable} ${playfair.variable}`}>
      <body className="bg-brand-grayBg text-brand-textDark font-sans antialiased min-h-screen flex flex-col">
        <FeedbackProvider>
          <CartProvider>{children}</CartProvider>
        </FeedbackProvider>
      </body>
    </html>
  );
}
