import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface TranslatedTextProps {
  translationKey: string;
  className?: string;
  component?: React.ElementType;
  [key: string]: any;
}

/**
 * کامپوننت نمایش متن‌های ترجمه شده
 * این کامپوننت متن را با استفاده از کلید ترجمه نمایش می‌دهد
 */
const TranslatedText: React.FC<TranslatedTextProps> = ({
  translationKey,
  className = '',
  component: Component = 'span',
  ...rest
}) => {
  const { t } = useTranslation();
  
  return (
    <Component className={className} {...rest}>
      {t(translationKey)}
    </Component>
  );
};

export default TranslatedText; 