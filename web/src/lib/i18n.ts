export const locales = ['en', 'ar'] as const;
export type Locale = (typeof locales)[number];

export async function getDictionary(locale: Locale) {
  try {
    // Validate locale first
    if (!locales.includes(locale)) {
      console.warn(`Invalid locale: ${locale}, falling back to 'en'`);
      locale = 'en';
    }
    
    const dictionary = await import(`../messages/${locale}.json`);
    return dictionary.default;
  } catch (error) {
    console.error(`Error loading dictionary for locale ${locale}:`, error);
    
    // Fallback to English if the requested locale fails
    if (locale !== 'en') {
      try {
        const fallbackDictionary = await import(`../messages/en.json`);
        return fallbackDictionary.default;
      } catch (fallbackError) {
        console.error('Error loading fallback dictionary:', fallbackError);
        throw new Error(`Failed to load dictionary for locale ${locale} and fallback 'en'`);
      }
    }
    
    throw error;
  }
}
