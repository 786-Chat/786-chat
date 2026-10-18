import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Ledger — Sign In",
  description: "Sign in to your subscriber account.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-paper text-ink antialiased">{children}<script src="/786-visual-editor.js" defer></script></body>
    </html>
  );
}
