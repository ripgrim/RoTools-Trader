import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { TokenProvider } from "@/providers/token-provider";
import { Header } from "@/components/header";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RoTools Trader',
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
            disableTransitionOnChange
          >
            <div className="relative min-h-screen bg-zinc-950">
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