import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "./ClientLayout";

export const metadata: Metadata = {
  title: "PearlCare Dental Clinic",
  description: "Premium dental care with a gentle touch. Book your appointment today.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#faf9f6] text-[#1a2e2a] antialiased">
        <ClientLayout>{children}</ClientLayout>
        <script src="/786-visual-editor.js" defer></script>
      </body>
    </html>
  );
}
