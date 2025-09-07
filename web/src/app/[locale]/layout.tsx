// app/[locale]/layout.tsx
import '../globals.css'
import Providers from '../providers'
import LayoutClient from './LayoutClient'
import { getCurrentUser } from '@/lib/auth'

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
      <body className="antialiased">
        <Providers>
          <LayoutClient user={user} locale={locale}>
            {children}
          </LayoutClient>
        </Providers>
      </body>
    </html>
  )
}