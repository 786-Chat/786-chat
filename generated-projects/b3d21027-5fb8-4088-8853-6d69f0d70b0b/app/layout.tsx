import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bean House",
  description: "Artisan coffee shop",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0f1e] text-slate-100 antialiased">
        {children}
      <script src="/786-visual-editor.js" defer></script></body>
    </html>
  );
}
