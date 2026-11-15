import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "786 Journey Coffee",
  description: "Small-batch coffee, brewed with intention. Wholesale, subscriptions and café experiences.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">{children}</main>
        <SiteFooter />
      <script src="/786-visual-editor.js" defer></script></body>
    </html>
  );
}
