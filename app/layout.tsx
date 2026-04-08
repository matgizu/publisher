import { Inter } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Calculadoras y Herramientas Gratuitas en Español | CalcuTools",
    template: "%s | CalcuTools",
  },
  description:
    "Calculadoras financieras, conversores y generadores gratuitos para Colombia, México y España. Sin registro, resultado inmediato.",
  metadataBase: new URL("https://publisher-production-26af.up.railway.app"),
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "CalcuTools",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <head>
        {/* Google AdSense — activar cuando se tenga publisher ID */}
        {/* <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXX" crossOrigin="anonymous" /> */}
      </head>
      <body className="bg-white text-text-primary antialiased">
        <Navigation />
        <div className="min-h-screen">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
