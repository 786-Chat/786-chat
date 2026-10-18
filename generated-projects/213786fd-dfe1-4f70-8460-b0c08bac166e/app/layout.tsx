import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nova Ledger - Login',
  description: 'Secure login for Nova Ledger financial platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="fixed top-0 left-0 right-0 z-50 glass">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <a href="/login" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">NL</span>
              </div>
              <span className="text-xl font-bold text-gradient">Nova Ledger</span>
            </a>
            <div className="flex items-center space-x-6">
              <a href="/login" className="text-gray-300 hover:text-cyan-400 transition-colors">Login</a>
              <a href="/forgot-password" className="text-gray-300 hover:text-cyan-400 transition-colors">Forgot Password</a>
            </div>
          </nav>
        </header>
        <main className="flex-1 pt-16">
          {children}
        </main>
      </body>
    </html>
  );
}