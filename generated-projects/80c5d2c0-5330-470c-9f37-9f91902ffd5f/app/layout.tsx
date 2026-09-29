import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import MobileLauncher from "@/components/mobile-launcher";

export const metadata: Metadata = {
  title: "Super Business Mujeeb – Master Template",
  description: "Clean master template for Super Admin. No live data.",
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
        <MobileLauncher />
        <script src="/786-visual-editor.js" defer></script>
      </body>
    </html>
  );
}
