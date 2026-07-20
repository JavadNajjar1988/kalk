import React from 'react';
import { Alert } from '@mui/material';
import type { EquipmentPath, EquipmentFieldDefinition } from '@/hooks/useEquipmentHierarchy';

interface Props {
  value?: EquipmentPath[];
  onChange?: (path: EquipmentPath[], finalNodeId?: string) => void;
  onFieldsChange?: (fields: EquipmentFieldDefinition[]) => void;
}

const EquipmentHierarchicalSelector: React.FC<Props> = ({ value = [], onChange, onFieldsChange }) => {
  React.useEffect(() => {
    onChange?.(value);
    onFieldsChange?.([]);
  }, [value, onChange, onFieldsChange]);

  return <Alert severity="info">انتخابگر سلسله‌مراتب تجهیزات غیرفعال شده است.</Alert>;
};

export default EquipmentHierarchicalSelector;
