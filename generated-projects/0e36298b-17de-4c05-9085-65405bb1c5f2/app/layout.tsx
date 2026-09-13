import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Animated Login",
  description: "Login page with animated gradient background and hero image",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}<script src="/786-visual-editor.js" defer></script></body>
    </html>
  );
}