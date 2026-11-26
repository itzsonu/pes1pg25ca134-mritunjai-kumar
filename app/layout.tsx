import type { Metadata } from 'next';
import { IBM_Plex_Mono, Plus_Jakarta_Sans, Public_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import { SiteHeader } from '@/components/SiteHeader';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
});

const publicSans = Public_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600'],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'Library Management System',
  description:
    'Manage a library catalogue, registered members, and book issue and return circulation.',
  openGraph: {
    title: 'Library Management System',
    description:
      'Manage a library catalogue, registered members, and book issue and return circulation.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${publicSans.variable} ${ibmPlexMono.variable}`}
    >
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
