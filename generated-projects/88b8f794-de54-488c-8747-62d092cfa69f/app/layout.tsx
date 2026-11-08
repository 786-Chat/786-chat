import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "786 Journey Coffee | Specialty Coffee & Community",
  description: "Experience the journey of specialty coffee at 786 Journey Coffee. Ethically sourced beans, expertly roasted, and served with warmth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>{children}<script src="/786-visual-editor.js" defer></script></body>
    </html>
  );
}