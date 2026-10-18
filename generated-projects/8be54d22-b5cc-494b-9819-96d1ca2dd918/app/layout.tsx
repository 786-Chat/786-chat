import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Crime Game Prototype',
  description: 'A small open-world crime game prototype',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}<script src="/786-visual-editor.js" defer></script></body>
    </html>
  );
}