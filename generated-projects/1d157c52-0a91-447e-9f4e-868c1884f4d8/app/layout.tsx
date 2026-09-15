import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Animated Login & Hero",
  description: "A Next.js app with animated login and hero page.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-white antialiased">
        {children}
      <script src="/786-visual-editor.js" defer></script></body>
    </html>
  );
}
