import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { FeedbackProvider } from "@/components/ui/Feedback";
import { CartProvider } from "@/components/shop/CartProvider";
import { PWAProvider } from "@/components/pwa/PWAProvider";

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
  applicationName: "Garcia Teleka",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/favicon-64.png", sizes: "64x64", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: "Garcia Teleka",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0b1d3a",
  width: "device-width",
  initialScale: 1,
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
          <PWAProvider>
            <CartProvider>{children}</CartProvider>
          </PWAProvider>
        </FeedbackProvider>
      </body>
    </html>
  );
}
