import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Changed font for broader character support
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster

const inter = Inter({ subsets: ['latin'] }); // Use Inter font

export const metadata: Metadata = {
  title: 'Cook AI', // Updated App Name
  description: 'Generate recipes from ingredients you already have!', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}
        <Toaster /> {/* Add Toaster component */}
      </body>
    </html>
  );
}
