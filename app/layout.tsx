import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PassPhoto Studio — Mobile se Passport Size Photo Kaise Banaye | Free Online Maker',
  description:
    'Create professional passport photos in seconds. Mobile se passport size photo kaise banaye? Upload a photo, remove background, and generate a print-ready A4 sheet for free.',
  keywords: [
    'passport photo',
    'photo editor',
    'face detection',
    'background removal',
    'A4 print',
    'passport photo kaise banaye',
    'online passport size photo maker',
    'free passport photo maker',
    'mobile se passport size photo',
  ],
  openGraph: {
    title: 'PassPhoto Studio — Professional Passport Photos in Your Browser',
    description: '100% private, AI-powered passport photo generator. No server uploads.',
    url: 'https://passphoto-studio.com', // Placeholder URL
    siteName: 'PassPhoto Studio',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PassPhoto Studio — Professional Passport Photos',
    description: 'Create print-ready passport photos in seconds for free.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link rel="preconnect" href="https://storage.googleapis.com" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'light';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })()
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "PassPhoto Studio",
              "url": "https://passphoto-studio.com",
              "description": "Professional passport photo maker online. Mobile se passport size photo kaise banaye? Use our free AI tool.",
              "applicationCategory": "MultimediaApplication",
              "operatingSystem": "Windows, macOS, Android, iOS",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            })
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <header className="site-header">
          <div className="header-inner">
            <Link href="/" className="logo">
              <span className="logo-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
              </span>
              <span className="logo-text">PassPhoto<span className="logo-accent">Studio</span></span>
            </Link>
            <nav className="site-nav">
              <Link href="/" className="nav-link">Home</Link>
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
