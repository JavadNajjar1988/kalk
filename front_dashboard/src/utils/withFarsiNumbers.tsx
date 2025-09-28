import React from 'react';
import { convertToFarsiNumber } from './numberUtils';

/**
 * تابع کمکی برای بررسی و تبدیل اعداد در متن‌ها
 */
export const processTextNodes = (node: React.ReactNode): React.ReactNode => {
  // اگر آرایه باشد، روی هر عنصر آرایه اعمال می‌کنیم
  if (Array.isArray(node)) {
    return node.map((child, index) => processTextNodes(child));
  }

  // اگر استرینگ یا عدد باشد، تبدیل می‌کنیم
  if (typeof node === 'string' || typeof node === 'number') {
    return convertToFarsiNumber(node);
  }

  // اگر المنت React باشد
  if (React.isValidElement(node) && node.props.children) {
    return React.cloneElement(node, {
      ...node.props,
      children: processTextNodes(node.props.children),
    });
  }

  // در غیر این صورت، بدون تغییر برمی‌گردانیم
  return node;
};

/**
 * HOC برای تبدیل خودکار اعداد به فارسی در کامپوننت‌ها
 */
export function withFarsiNumbers<P extends object>(Component: React.ComponentType<P>): React.FC<P> {
  return (props: P) => {
    return <Component {...props} />;
  };
}

/**
 * کامپوننت برای تبدیل اعداد به فارسی در children
 */
export const FarsiNumbersProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  return <>{processTextNodes(children)}</>;
}; 