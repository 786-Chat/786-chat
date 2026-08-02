import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Obsidian & Ivory — Private Client Login",
  description: "A premium private client experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-obsidian text-ivory antialiased">{children}<script src="/786-visual-editor.js" defer></script></body>
    </html>
  );
}
