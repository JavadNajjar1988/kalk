import { useAppSelector } from '@/store';
import { translations, SupportedLanguage } from '@/locales/translations';
import { useCallback } from 'react';

export const useTranslation = () => {
  const language = useAppSelector(state => state.ui.language);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations[language as SupportedLanguage];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key} for language: ${language}`);
        return key;
      }
    }
    
    let result = typeof value === 'string' ? value : key;

    if (params) {
      Object.keys(params).forEach(paramKey => {
        result = result.replace(`{${paramKey}}`, String(params[paramKey]));
      });
    }

    return result;
  }, [language]);

  return { t, language };
}; 