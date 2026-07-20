import React from 'react';
import { Alert } from '@mui/material';
import type { LogisticsPath, LogisticsFieldDefinition } from '@/hooks/useLogisticsHierarchy';

interface Props {
  value?: LogisticsPath[];
  onChange?: (path: LogisticsPath[], finalNodeId?: string) => void;
  onFieldsChange?: (fields: LogisticsFieldDefinition[]) => void;
}

const LogisticsHierarchicalSelector: React.FC<Props> = ({ value = [], onChange, onFieldsChange }) => {
  React.useEffect(() => {
    onChange?.(value);
    onFieldsChange?.([]);
  }, [value, onChange, onFieldsChange]);

  return <Alert severity="info">انتخابگر سلسله‌مراتب لجستیک غیرفعال شده است.</Alert>;
};

export default LogisticsHierarchicalSelector;
