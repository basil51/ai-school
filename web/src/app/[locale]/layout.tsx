// app/[locale]/layout.tsx
import '../globals.css'
import { Inter } from 'next/font/google'
import Providers from '../providers'
import LayoutClient from './LayoutClient'
import { getCurrentUser } from '@/lib/auth'

const inter = Inter({ subsets: ['latin'] })

export default async function RootLayout({
  children,params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const user = await getCurrentUser()

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body className={`${inter.className} min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900`}>
        <Providers>
          <LayoutClient user={user} locale={locale}>
            {children}
          </LayoutClient>
        </Providers>
      </body>
    </html>
  )
}