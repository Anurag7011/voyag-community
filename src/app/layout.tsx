'use client';
import './globals.css';
import { AppShell } from '@/components/shared/AppShell';
import { Toaster } from "@/components/ui/toaster";
import { BucketListProvider } from '@/context/BucketListContext';
import { FirebaseClientProvider } from '@/firebase';
import { usePathname } from 'next/navigation';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=VT323&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <BucketListProvider>
            {isAdminPage ? (
              children
            ) : (
              <AppShell>
                {children}
              </AppShell>
            )}
          </BucketListProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
