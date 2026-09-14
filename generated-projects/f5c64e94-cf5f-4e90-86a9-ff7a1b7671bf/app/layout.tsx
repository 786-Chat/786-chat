import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bean House',
  description: 'Production-ready web application for Bean House with authentication, dashboard, customers, orders, and contact form.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        {children}
      <script src="/786-visual-editor.js" defer></script></body>
    </html>
  );
}
