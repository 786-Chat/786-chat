import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: '786 Journey Coffee — Specialty Coffee, Delivered',
  description: 'Ethically sourced specialty coffee beans and brewing gear for the modern café and home brewer.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}<script src="/786-visual-editor.js" defer></script></body>
    </html>
  );
}