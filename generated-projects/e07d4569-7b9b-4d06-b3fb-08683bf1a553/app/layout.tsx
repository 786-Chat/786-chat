import type { Metadata } from 'next';
import { Orbitron, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-display' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: '786 Journey Coffee — Cyberpunk Brew',
  description: 'Neon-lit coffee journey. Services and contact for 786 Journey Coffee.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${orbitron.variable} ${jetbrains.variable}`}>
      <body className="scanlines min-h-screen flex flex-col">
        {children}
      <script src="/786-visual-editor.js" defer></script></body>
    </html>
  );
}