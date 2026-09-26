import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "786 Journey Coffee — Roasted with intention",
  description:
    "786 Journey Coffee is a small-batch roastery. Explore our craft services and start a conversation about wholesale, subscriptions and events."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-ink antialiased">
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      <script src="/786-visual-editor.js" defer></script></body>
    </html>
  );
}
