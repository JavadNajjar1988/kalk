import React from 'react';
import { Alert } from '@mui/material';

interface HierarchicalSelectorProps {
  categoryType?: 'users' | 'resources' | string;
  onChange: (path: string[], finalNodeId?: string) => void;
  onFieldsChange: (fields: any[]) => void;
}

const HierarchicalSelector: React.FC<HierarchicalSelectorProps> = ({ onChange, onFieldsChange }) => {
  React.useEffect(() => {
    onChange([]);
    onFieldsChange([]);
  }, [onChange, onFieldsChange]);

  return <Alert severity="info">HierarchicalSelector به حالت سازگار تبدیل شده است.</Alert>;
};

export default HierarchicalSelector;
