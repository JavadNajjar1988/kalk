import React, { memo } from 'react';
import { Box, Grid, TextField, Typography } from '@mui/material';
import HelpTooltip from '../shared/HelpTooltip';
import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';

interface Props {
  formData: ExtendedCustomFieldDefinition;
  onChange: (key: keyof ExtendedCustomFieldDefinition, value: any) => void;
}

const MAX_PLACEHOLDER = 50;
const MAX_HELPTEXT = 100;

function sanitizeSingleLine(input: string, maxLen: number): string {
  return (input || '')
    .replace(/\r?\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .slice(0, maxLen);
}

const ReferenceOptionalProperties = memo<Props>(({ formData, onChange }) => {
  const placeholder = formData.placeholder || '';
  const helpText = formData.helpText || '';

  const onPlaceholderChange = (val: string) => {
    onChange('placeholder', sanitizeSingleLine(val, MAX_PLACEHOLDER));
  };

  const onHelpTextChange = (val: string) => {
    onChange('helpText', sanitizeSingleLine(val, MAX_HELPTEXT));
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ mr: 1 }}>راهنما</Typography>
            <HelpTooltip title="راهنما" description="کمک می‌کند کاربر بفهمد چه چیزی بنویسد؛ با تایپ محو می‌شود." example="برای جستجو تایپ کنید" />
          </Box>
          <TextField
            fullWidth
            label="متن راهنما"
            value={placeholder}
            onChange={(e) => onPlaceholderChange(e.target.value)}
            onBlur={() => onPlaceholderChange(placeholder.trim())}
            placeholder="برای جستجو تایپ کنید"
            helperText={`${placeholder.length}/${MAX_PLACEHOLDER}`}
            inputProps={{ 'aria-invalid': false }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ mr: 1 }}>توضیح کوتاه زیر فیلد</Typography>
            <HelpTooltip title="توضیح کوتاه زیر فیلد" description="راهنمای ثابت زیر فیلد برای قوانین/نکات." example="ابتدا استان را انتخاب کنید سپس شهر را جستجو کنید" />
          </Box>
          <TextField
            fullWidth
            label="متن راهنما"
            value={helpText}
            onChange={(e) => onHelpTextChange(e.target.value)}
            onBlur={() => onHelpTextChange(helpText.trim())}
            placeholder="راهنمای استفاده"
            helperText={`${helpText.length}/${MAX_HELPTEXT}`}
            inputProps={{ 'aria-invalid': false }}
          />
        </Grid>
      </Grid>
    </Box>
  );
});

ReferenceOptionalProperties.displayName = 'ReferenceOptionalProperties';
export default ReferenceOptionalProperties;


