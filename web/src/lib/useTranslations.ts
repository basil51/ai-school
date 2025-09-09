"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getDictionary, Locale } from "./i18n";

export function useTranslations() {
  const params = useParams();
  const [dict, setDict] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDictionary = async () => {
      const locale = params.locale as Locale;
      
      // Validate locale - if it's not a valid locale, default to 'en'
      const validLocale = ['en', 'ar'].includes(locale) ? locale : 'en';
      
      if (validLocale) {
        try {
          const dictionary = await getDictionary(validLocale);
          setDict(dictionary);
          setLoading(false);
        } catch (error) {
          console.error('Error loading dictionary:', error);
          // Fallback to English if there's an error
          try {
            const fallbackDictionary = await getDictionary('en');
            setDict(fallbackDictionary);
            setLoading(false);
          } catch (fallbackError) {
            console.error('Error loading fallback dictionary:', fallbackError);
            setLoading(false);
          }
        }
      }
    };

    loadDictionary();
  }, [params.locale]);

  return { dict, loading, locale: params.locale as Locale };
}
