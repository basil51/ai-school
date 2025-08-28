export const locales = ['en', 'ar'] as const;
export type Locale = (typeof locales)[number];

export async function getDictionary(locale: Locale) {
  return (await import(`../messages/${locale}.json`)).default;
}
