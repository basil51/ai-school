# Internationalization (i18n) Guide

This project uses Next.js App Router i18n with Arabic RTL support following the official Next.js guide.

## Features

- ✅ English and Arabic support
- ✅ Automatic locale detection from `Accept-Language` header
- ✅ RTL support for Arabic using `tailwindcss-rtl`
- ✅ Language switcher in the topbar
- ✅ Dynamic route structure: `/[locale]/...`
- ✅ Server-side dictionary loading
- ✅ Client-side translation hook

## File Structure

```
src/
├── app/
│   ├── [locale]/           # Locale-aware routes
│   │   ├── layout.tsx      # Locale layout with RTL support
│   │   ├── page.tsx        # Home page
│   │   ├── dashboard/      # Dashboard routes
│   │   ├── admin/          # Admin routes
│   │   └── ...
│   ├── layout.tsx          # Root layout (minimal)
│   └── page.tsx            # Root page (redirected)
├── lib/
│   ├── i18n.ts            # Locale configuration
│   └── useTranslations.ts # Client-side translation hook
├── messages/
│   ├── en.json            # English translations
│   └── ar.json            # Arabic translations
└── components/
    └── Topbar.tsx         # Language switcher
```

## Usage

### Server Components

```tsx
import { getDictionary } from "@/lib/i18n";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: 'en' | 'ar' }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  
  return <h1>{dict.dashboard.title}</h1>;
}
```

### Client Components

```tsx
"use client";
import { useTranslations } from "@/lib/useTranslations";

export default function MyComponent() {
  const { dict, loading, locale } = useTranslations();
  
  if (loading) return <div>Loading...</div>;
  
  return <button>{dict.common.save}</button>;
}
```

### Adding New Translations

1. Add keys to `src/messages/en.json`:
```json
{
  "newSection": {
    "title": "New Title",
    "description": "New description"
  }
}
```

2. Add translations to `src/messages/ar.json`:
```json
{
  "newSection": {
    "title": "عنوان جديد",
    "description": "وصف جديد"
  }
}
```

3. Use in components:
```tsx
const dict = await getDictionary(locale);
return <h1>{dict.newSection.title}</h1>;
```

## RTL Support

The project uses `tailwindcss-rtl` plugin which automatically:

- Flips margins, padding, and positioning
- Reverses flexbox order
- Handles text alignment
- Manages spacing utilities

The `dir` attribute is automatically set based on locale:
- `dir="ltr"` for English
- `dir="rtl"` for Arabic

## Middleware

The middleware automatically:
- Detects user's preferred language from `Accept-Language` header
- Redirects `/` → `/en` or `/ar`
- Handles locale-aware routing
- Preserves authentication and tenant middleware

## Language Switcher

The topbar includes a language switcher that:
- Shows current language (English/العربية)
- Allows switching between languages
- Preserves current page/route when switching

## Adding New Locales

1. Add locale to `src/lib/i18n.ts`:
```ts
export const locales = ['en', 'ar', 'fr'] as const;
```

2. Create translation file `src/messages/fr.json`

3. Update middleware locale detection if needed

## Best Practices

- Use nested objects for translations (e.g., `dict.section.subsection.key`)
- Keep translation keys descriptive and organized
- Test both LTR and RTL layouts
- Use the `useTranslations` hook for client components
- Use `getDictionary` for server components
