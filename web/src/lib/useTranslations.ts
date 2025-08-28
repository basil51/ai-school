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
      if (locale) {
        const dictionary = await getDictionary(locale);
        setDict(dictionary);
        setLoading(false);
      }
    };

    loadDictionary();
  }, [params.locale]);

  return { dict, loading, locale: params.locale as Locale };
}
