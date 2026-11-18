import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "786.Chat Confirmation",
  description: "Confirmation that the workspace is operating in 786.Chat."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f7f8fc] text-ink antialiased">{children}<script src="/786-visual-editor.js" defer></script></body>
    </html>
  );
}
