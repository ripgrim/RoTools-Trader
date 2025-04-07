import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { TokenProvider } from "@/providers/token-provider";
import { Header } from "@/components/header";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Luma',
  description: 'A powerful trading tool for Roblox limiteds',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <TokenProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
          >
            <div className="relative min-h-screen bg-background">
              <Header />
              {children}
              <Toaster />
            </div>
          </ThemeProvider>
        </TokenProvider>
      </body>
    </html>
  );
}