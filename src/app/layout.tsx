import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'HimClimX - Himalayas Climate Explorer',
  description: 'Advanced climate analytics platform for the Himalayan region with AI-powered insights and comprehensive trend analysis',
  keywords: ['climate', 'himalayas', 'analytics', 'dashboard', 'weather', 'temperature', 'precipitation'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
