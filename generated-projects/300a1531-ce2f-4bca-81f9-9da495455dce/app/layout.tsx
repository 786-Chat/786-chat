import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';

export const metadata: Metadata = {
  title: 'Saffron Manager',
  description: 'Restaurant CRM',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <Nav />
        <main className="container mx-auto p-4">{children}</main>
      <script src="/786-visual-editor.js" defer></script></body>
    </html>
  );
}
