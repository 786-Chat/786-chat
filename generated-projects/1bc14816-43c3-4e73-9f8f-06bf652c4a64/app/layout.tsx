import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "786 Journey Coffee — Command Centre",
  description: "Specialty coffee roasted and dispatched with telemetry-grade precision.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
        <Footer />
      <script src="/786-visual-editor.js" defer></script></body>
    </html>
  );
}
