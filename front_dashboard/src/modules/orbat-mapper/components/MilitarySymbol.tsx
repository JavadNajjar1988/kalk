import React from 'react';
import { Box, SxProps, Theme } from '@mui/material';
import MilSymbol from 'milsymbol';

interface MilitarySymbolProps {
  sidc: string;
  size?: number;
  sx?: SxProps<Theme>;
  options?: Record<string, any>;
  onClick?: () => void;
  className?: string;
}

const MilitarySymbol: React.FC<MilitarySymbolProps> = ({
  sidc,
  size = 30,
  sx,
  options = {},
  onClick,
  className,
}) => {
  const [symbolSvg, setSymbolSvg] = React.useState<string>('');

  React.useEffect(() => {
    try {
      const symbol = new MilSymbol.Symbol(sidc, {
        size: size,
        fill: options.fillColor || options.fill || '#000000',
        ...options,
      });
      
      setSymbolSvg(symbol.asSVG());
    } catch (error) {
      console.warn('Error creating military symbol:', error);
      console.warn('SIDC:', sidc);
      console.warn('Options:', options);
      setSymbolSvg('');
    }
  }, [sidc, size, options]);

  if (!symbolSvg) {
    return (
      <Box
        sx={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 1,
          borderColor: 'grey.400',
          borderRadius: 1,
          fontSize: '0.7rem',
          color: 'text.secondary',
          cursor: onClick ? 'pointer' : 'default',
          ...sx,
        }}
        onClick={onClick}
        className={className}
      >
        نماد
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default',
        ...sx,
      }}
      onClick={onClick}
      className={className}
      dangerouslySetInnerHTML={{ __html: symbolSvg }}
    />
  );
};

export default MilitarySymbol;
