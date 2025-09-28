import React, { memo } from 'react';
import { Box, Typography, Paper, Grid, TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch, Slider } from '@mui/material';
import HelpTooltip from '../shared/HelpTooltip';
import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';

interface ValidationPropertiesProps {
  formData: ExtendedCustomFieldDefinition;
  onChange: (key: keyof ExtendedCustomFieldDefinition, value: any) => void;
}

const ValidationProperties: React.FC<ValidationPropertiesProps> = ({ formData, onChange }) => {
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
        ویژگی‌های اعتبارسنجی
      </Typography>
      
      <Grid container spacing={3}>
        {/* Length Validation */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="حداقل طول"
            type="number"
            value={formData.validationRules?.minLength || ''}
            onChange={(e) => {
              const currentRules = formData.validationRules || {};
              onChange('validationRules', { 
                ...currentRules, 
                minLength: e.target.value ? parseInt(e.target.value) : undefined 
              });
            }}
            inputProps={{ min: 0 }}
            sx={{
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
              },
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="حداکثر طول"
            type="number"
            value={formData.validationRules?.maxLength || ''}
            onChange={(e) => {
              const currentRules = formData.validationRules || {};
              onChange('validationRules', { 
                ...currentRules, 
                maxLength: e.target.value ? parseInt(e.target.value) : undefined 
              });
            }}
            inputProps={{ min: 0 }}
            sx={{
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
              },
            }}
          />
        </Grid>
        
        {/* Pattern Validation */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="الگوی regex سفارشی"
            value={formData.validationRules?.pattern || ''}
            onChange={(e) => {
              const currentRules = formData.validationRules || {};
              onChange('validationRules', { 
                ...currentRules, 
                pattern: e.target.value || undefined 
              });
            }}
            placeholder="^[a-zA-Z0-9]+$"
            sx={{
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
              },
            }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="پیام خطای الگو"
            value={formData.validationRules?.patternMessage || ''}
            onChange={(e) => {
              const currentRules = formData.validationRules || {};
              onChange('validationRules', { 
                ...currentRules, 
                patternMessage: e.target.value || undefined 
              });
            }}
            placeholder="مقدار وارد شده با الگوی مورد نظر مطابقت ندارد"
            sx={{
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
              },
            }}
          />
        </Grid>
        
        {/* Unique Value */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.validationRules?.unique || false}
                  onChange={(e) => {
                    const currentRules = formData.validationRules || {};
                    onChange('validationRules', { 
                      ...currentRules, 
                      unique: e.target.checked 
                    });
                  }}
                  size="small"
                />
              }
              label="مقدار منحصر به فرد"
            />
            <HelpTooltip
              title="مقدار منحصر به فرد"
              description="مقدار این فیلد باید در بین تمام رکوردها منحصر به فرد باشد"
              example="شناسه کاربری یا کد ملی"
            />
          </Box>
        </Grid>
        
        {/* Read Only Style */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>سبک نمایش فقط خواندنی</InputLabel>
            <Select
              value={formData.readOnlyStyle || 'normal'}
              onChange={(e) => onChange('readOnlyStyle', e.target.value as any)}
              label="سبک نمایش فقط خواندنی"
              sx={{
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <MenuItem value="normal">معمولی</MenuItem>
              <MenuItem value="disabled">غیرفعال</MenuItem>
              <MenuItem value="plain">ساده</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        {/* Validation Message Style */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>سبک نمایش پیام اعتبارسنجی</InputLabel>
            <Select
              value={formData.validationMessageStyle || 'bottom'}
              onChange={(e) => onChange('validationMessageStyle', e.target.value as any)}
              label="سبک نمایش پیام اعتبارسنجی"
              sx={{
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <MenuItem value="bottom">پایین فیلد</MenuItem>
              <MenuItem value="tooltip">راهنمای ابزار</MenuItem>
              <MenuItem value="inline">در خط</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default memo(ValidationProperties);