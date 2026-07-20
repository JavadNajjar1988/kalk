import React, { useCallback } from 'react';
import { convertToFarsiNumber } from '@/utils/numberUtils';

interface TransformFarsiNumbersProps {
  children: React.ReactNode;
  skipTransform?: boolean;
}

/**
 * کامپوننت مبدل اعداد به فارسی
 * این کامپوننت تمام اعداد موجود در متن را به فارسی تبدیل می‌کند
 */
const TransformFarsiNumbers: React.FC<TransformFarsiNumbersProps> = ({ 
  children, 
  skipTransform = false 
}) => {
  // تابع بازگشتی برای پردازش متن‌ها و تبدیل اعداد
  const transformText = useCallback((text: string): string => {
    return skipTransform ? text : convertToFarsiNumber(text);
  }, [skipTransform]);

  // تابع بازگشتی برای پردازش المنت‌ها
  const processChildren = useCallback((children: React.ReactNode): React.ReactNode => {
    if (children === null || children === undefined) {
      return children;
    }

    // اگر رشته یا عدد باشد
    if (typeof children === 'string') {
      return transformText(children);
    }
    
    if (typeof children === 'number') {
      return transformText(children.toString());
    }

    // اگر آرایه باشد
    if (Array.isArray(children)) {
      return React.Children.map(children, child => processChildren(child));
    }

    // اگر المنت React باشد
    if (React.isValidElement(children)) {
      // اگر المنت دارای خاصیت skipFarsiTransform باشد، تبدیل را انجام نمی‌دهیم
      if ((children.props as any).skipFarsiTransform === true) {
        return children;
      }

      // پردازش فرزندان المنت
      return React.cloneElement(
        children,
        children.props,
        processChildren(children.props.children)
      );
    }

    // سایر موارد را بدون تغییر برمی‌گردانیم
    return children;
  }, [transformText]);

  return <>{processChildren(children)}</>;
};

export default TransformFarsiNumbers; 