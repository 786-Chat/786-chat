import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Saffron Manager',
  description: 'Restaurant CRM',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">{children}<script src="/786-visual-editor.js" defer></script></body>
    </html>
  );
}
