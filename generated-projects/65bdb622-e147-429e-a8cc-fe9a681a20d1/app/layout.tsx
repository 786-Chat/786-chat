import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "786 Journey Coffee",
  description: "Artisanal coffee journey from bean to cup.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#faf7f2] text-[#1a1a1a] antialiased">{children}<script src="/786-visual-editor.js" defer></script></body>
    </html>
  );
}
