import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ask a Question",
  description: "A simple page to ask a question.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      <script src="/786-visual-editor.js" defer></script></body>
    </html>
  );
}
