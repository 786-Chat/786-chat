import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "786 Journey Coffee — Specialty Coffee, Roasted with Intention",
  description:
    "786 Journey Coffee is a specialty roaster offering single-origin beans, guided tastings and wholesale partnerships."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-graphite antialiased">
        <SiteHeader />
        <main className="pt-20">{children}</main>
        <SiteFooter />
      <script src="/786-visual-editor.js" defer></script></body>
    </html>
  );
}
