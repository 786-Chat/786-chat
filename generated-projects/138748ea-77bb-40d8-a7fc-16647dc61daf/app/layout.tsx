import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Raja Catering',
  description: 'Operational dashboard for catering production',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased">{children}<script src="/786-visual-editor.js" defer></script></body>
    </html>
  );
}
