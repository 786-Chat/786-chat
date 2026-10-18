import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PearlCare Dental Clinic - Premium Dental Care',
  description: 'Experience premium dental care at PearlCare. Our expert team provides comprehensive dental services in a warm, modern environment.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}