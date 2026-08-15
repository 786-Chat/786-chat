import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bean House — Premium Coffee',
  description: 'Artisan coffee crafted with passion. Warm, cozy, and unforgettable.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-cream text-espresso antialiased">{children}<script src="/786-visual-editor.js" defer></script></body>
    </html>
  );
}
