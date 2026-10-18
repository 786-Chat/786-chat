import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Manufacturing Ops',
  description: 'Secure email/password authentication for manufacturing operations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0f172a] text-slate-100 antialiased">
        {children}
      <script src="/786-visual-editor.js" defer></script></body>
    </html>
  );
}
