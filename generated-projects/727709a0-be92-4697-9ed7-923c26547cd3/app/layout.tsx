import './globals.css';
import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

export const metadata: Metadata = { title: 'Royal Spice', description: 'Premium Indian restaurant' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-gold min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      <script src="/786-visual-editor.js" defer></script></body>
    </html>
  );
}
