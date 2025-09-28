import React from 'react';
import { Typography, TypographyProps } from '@mui/material';
import { convertToFarsiNumber } from '@/utils/numberUtils';

type FarsiTypographyProps = TypographyProps & {
  skipFarsiTransform?: boolean;
};

/**
 * کامپوننت Typography که به صورت خودکار اعداد را به فارسی تبدیل می‌کند
 */
const FarsiTypography: React.FC<FarsiTypographyProps> = ({ 
  children, 
  skipFarsiTransform = false,
  ...props 
}) => {
  // تبدیل اعداد به فارسی
  const transformContent = (content: React.ReactNode): React.ReactNode => {
    if (skipFarsiTransform) return content;
    
    if (typeof content === 'string') {
      return convertToFarsiNumber(content);
    }
    
    if (typeof content === 'number') {
      return convertToFarsiNumber(content.toString());
    }
    
    return content;
  };
  
  return (
    <Typography {...props}>
      {React.Children.map(children, child => transformContent(child))}
    </Typography>
  );
};

export default FarsiTypography; 