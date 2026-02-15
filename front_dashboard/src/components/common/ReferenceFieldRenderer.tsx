import React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useReferenceFieldOptions, type FieldDefinition } from '@/hooks/useDefinitionData';

interface ReferenceFieldRendererProps {
  field: FieldDefinition;
  value: any;
  onChange: (fieldId: string, value: any) => void;
}

const ReferenceFieldRenderer: React.FC<ReferenceFieldRendererProps> = ({ field, value, onChange }) => {
  const { options } = useReferenceFieldOptions();

  return (
    <FormControl fullWidth>
      <InputLabel>{field.name}</InputLabel>
      <Select value={value || ''} label={field.name} onChange={(e) => onChange(field.id, e.target.value)}>
        <MenuItem value="">
          <em>انتخاب نشده</em>
        </MenuItem>
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default ReferenceFieldRenderer;
