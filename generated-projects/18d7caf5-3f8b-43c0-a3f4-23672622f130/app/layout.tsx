import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Raja Catering Operations",
  description: "Production, quality and stock control for Raja Catering",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased">
        <AppShell>{children}</AppShell>
      <script src="/786-visual-editor.js" defer></script></body>
    </html>
  );
}
