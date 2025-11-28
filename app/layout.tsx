import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { Outfit } from 'next/font/google'
import './globals.css'

import { AnalyticsTracker } from '@/components/AnalyticsTracker'
import Footer from '@/components/Footer'

const title = 'Product Huntr - Use Product Hunt Data to Find Ideas and Opportunities'
const description = 'Discover your next big opportunity with Product Huntr. Analyze 12K+ Product Hunt launches to find validated ideas, market gaps, and untapped opportunities. AI-powered insights for builders and makers.'
const image = 'https://rafddhfuidgiamkxdqyg.supabase.co/storage/v1/object/public/avatars/5e59793f-d2b0-47bc-8321-bc69fdf5aa2f/socialshare1.png'

const font = Outfit({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://producthuntr.com'),
  title: {
    default: title,
    template: '%s | Product Huntr',
  },
  description,
  keywords: ['growth hacking', 'product hunt analytics', 'product hunt launch strategy', 'growth hacker marketing', 'best product hunt tools', 'product hunting', 'viral launch strategies', 'sean ellis growth hacking', 'product hunt trends'],
  authors: [{ name: 'Product Huntr' }],
  creator: 'Product Huntr',
  publisher: 'Product Huntr',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/Favicon.png',
    shortcut: '/Favicon.png',
    apple: '/Favicon.png',
  },
  openGraph: {
    title,
    description,
    url: '/',
    siteName: 'Product Huntr',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: image,
        width: 1200,
        height: 630,
        alt: 'Product Huntr Dashboard',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [image],
    creator: '@producthuntr',
  },
  appleWebApp: {
    capable: true,
    title: 'Product Huntr',
    statusBarStyle: 'black-translucent',
  },
  other: {
    'og:image:secure_url': image,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={font.className}>
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/20 rounded-full blur-[100px]" />
        </div>
        <div className="flex flex-col min-h-screen">
          {children}
          <Footer />
        </div>
      </body>
    </html>
  )
}
