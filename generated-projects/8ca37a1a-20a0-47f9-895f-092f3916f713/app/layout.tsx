import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Luxury Estates | Login",
  description: "Sign in to your luxury real estate account.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}<script src="/786-visual-editor.js" defer></script></body>
    </html>
  );
}
