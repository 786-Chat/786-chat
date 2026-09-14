import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Neon Kids Arcade",
  description: "A cyberpunk neon entertainment hub for kids with games, stories, and activities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0f] text-cyan-100 antialiased">
        {children}
      <script src="/786-visual-editor.js" defer></script></body>
    </html>
  );
}