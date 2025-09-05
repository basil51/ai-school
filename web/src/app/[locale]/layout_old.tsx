import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import Providers from "../providers";
import Topbar from "@/components/layout/Topbar";
import { Toaster } from "@/components/ui/sonner";
//import { getDictionary } from "@/lib/i18n";
//import { Locale } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EduVibe AI Academy",
  description: "AI-powered tutoring system with RAG (Retrieval-Augmented Generation)",
};

export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'ar' }];
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  //const dict = await getDictionary(locale as Locale);
  
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Topbar locale={""} />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
