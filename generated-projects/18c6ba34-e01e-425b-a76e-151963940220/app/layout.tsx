import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saffron Manager Test",
  description: "Restaurant CRM and reservation management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream text-charcoal antialiased">
        {children}
      <script src="/786-visual-editor.js" defer></script></body>
    </html>
  );
}
