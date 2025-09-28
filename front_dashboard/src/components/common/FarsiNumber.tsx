import React from 'react';
import { Typography, TypographyProps } from '@mui/material';
import { convertToFarsiNumber } from '@/utils/numberUtils';

interface FarsiNumberProps extends Omit<TypographyProps, 'children'> {
  children: number | string;
}

/**
 * کامپوننت برای نمایش اعداد به صورت فارسی
 */
const FarsiNumber: React.FC<FarsiNumberProps> = ({ children, ...props }) => {
  const farsiText = React.useMemo(() => {
    return convertToFarsiNumber(children);
  }, [children]);

  return <Typography {...props}>{farsiText}</Typography>;
};

export default FarsiNumber; 