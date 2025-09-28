import React, { memo } from 'react';
import { Box, Typography, Paper, Grid, TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch } from '@mui/material';
import HelpTooltip from '../shared/HelpTooltip';
import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';

interface AssistivePropertiesProps {
  formData: ExtendedCustomFieldDefinition;
  onChange: (key: keyof ExtendedCustomFieldDefinition, value: any) => void;
}

const AssistiveProperties: React.FC<AssistivePropertiesProps> = ({ formData, onChange }) => {
  return (
    <Paper
      sx={{
        p: 3,
        mb: 3,
        borderRadius: '12px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(135, 206, 250, 0.2)',
        boxShadow: '0 4px 16px rgba(135, 206, 250, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
      }}
    >
      <Typography variant="h6" sx={{ mb: 3, color: '#4A90E2', fontWeight: 600 }}>
        ویژگی‌های کمکی
      </Typography>
      
      <Grid container spacing={3}>
        {/* Suggestions List */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.suggestions && formData.suggestions.length > 0}
                  onChange={(e) => onChange('suggestions', e.target.checked ? [''] : [])}
                  size="small"
                />
              }
              label="لیست پیشنهاد"
            />
            <HelpTooltip
              title="لیست پیشنهاد"
              description="نمایش لیست پیشنهادات در حین تایپ"
              example="پیشنهاد ۱، پیشنهاد ۲، پیشنهاد ۳"
            />
          </Box>
          {formData.suggestions && formData.suggestions.length > 0 && (
            <TextField
              fullWidth
              label="پیشنهادات (هر خط یک مورد)"
              value={Array.isArray(formData.suggestions) ? formData.suggestions.join('\n') : formData.suggestions || ''}
              onChange={(e) => onChange('suggestions', e.target.value.split('\n'))}
              multiline
              rows={4}
              placeholder="پیشنهاد ۱&#10;پیشنهاد ۲&#10;پیشنهاد ۳"
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                },
              }}
            />
          )}
        </Grid>

        {/* Auto Complete */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.enableAutoComplete || false}
                  onChange={(e) => onChange('enableAutoComplete', e.target.checked)}
                  size="small"
                />
              }
              label="تکمیل خودکار"
            />
            <HelpTooltip
              title="تکمیل خودکار"
              description="تکمیل خودکار متن بر اساس ورودی‌های قبلی"
              example="تایپ 'س' → پیشنهاد 'سلام'"
            />
          </Box>
        </Grid>

        {/* Multiple Values */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.enableMultipleValues || false}
                  onChange={(e) => onChange('enableMultipleValues', e.target.checked)}
                  size="small"
                />
              }
              label="مقدار چندگانه"
            />
            <HelpTooltip
              title="مقدار چندگانه"
              description="امکان ورود چندین مقدار با جداکننده"
              example="'مقدار۱، مقدار۲، مقدار۳'"
            />
          </Box>
          {formData.enableMultipleValues && (
            <FormControl fullWidth>
              <InputLabel>جداکننده</InputLabel>
              <Select
                value={formData.multiValueSeparator || 'comma'}
                onChange={(e) => onChange('multiValueSeparator', e.target.value)}
                label="جداکننده"
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <MenuItem value="comma">کاما (,)</MenuItem>
                <MenuItem value="enter">اینتر</MenuItem>
                <MenuItem value="space">فاصله</MenuItem>
                <MenuItem value="semicolon">نقطه‌ویرگول (;)</MenuItem>
              </Select>
            </FormControl>
          )}
        </Grid>

        {/* Spell Check */}
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>غلط‌یاب</InputLabel>
            <Select
              value={formData.spellcheck || 'off'}
              onChange={(e) => onChange('spellcheck', e.target.value)}
              label="غلط‌یاب"
              sx={{
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <MenuItem value="off">خاموش</MenuItem>
              <MenuItem value="fa">فارسی</MenuItem>
              <MenuItem value="en">انگلیسی</MenuItem>
              <MenuItem value="custom">سفارشی</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Custom Dictionary */}
        {formData.spellcheck === 'custom' && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="واژه‌نامه سفارشی (با کاما جدا کنید)"
              value={formData.customDictionary || ''}
              onChange={(e) => onChange('customDictionary', e.target.value)}
              placeholder="واژه ۱, واژه ۲, واژه ۳"
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                },
              }}
            />
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default memo(AssistiveProperties);