import React, { memo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { FieldPropertiesStepProps } from '../types/FieldEditTypes';
import HelpTooltip from '../shared/HelpTooltip';
import ContentControlProperties from '../properties/ContentControlProperties';
import AssistiveProperties from '../properties/AssistiveProperties';
import BehaviorLogicProperties from '../properties/BehaviorLogicProperties';
import SecurityStorageProperties from '../properties/SecurityStorageProperties';
import DisplayProperties from '../properties/DisplayProperties';
import SelectOptionsProperties from '../properties/SelectOptionsProperties';
import SelectFieldProperties from '../properties/SelectFieldProperties';
import VariantProperties from '../properties/VariantProperties';
import MaskProperties from '../properties/MaskProperties';

const FieldPropertiesStep: React.FC<FieldPropertiesStepProps> = ({ formData, onChange }) => {
  // Determine which properties component to show based on field type
  const renderFieldSpecificProperties = () => {
    if (formData.type === 'select' || formData.type === 'multiselect') {
      return <SelectFieldProperties formData={formData} onChange={onChange} />;
    }
    
    // For text-based fields, show relevant properties
    if (formData.type === 'text' || formData.type === 'email' || formData.type === 'password' || formData.type === 'textarea') {
      return (
        <>
          <ContentControlProperties formData={formData} onChange={onChange} />
          <AssistiveProperties formData={formData} onChange={onChange} />
          <BehaviorLogicProperties formData={formData} onChange={onChange} />
          <SecurityStorageProperties formData={formData} onChange={onChange} />
          <DisplayProperties formData={formData} onChange={onChange} />
          <VariantProperties formData={formData} onChange={onChange} />
          <MaskProperties formData={formData} onChange={onChange} />
        </>
      );
    }
    
    // For number fields, show only relevant properties
    if (formData.type === 'number') {
      return (
        <>
          <BehaviorLogicProperties formData={formData} onChange={onChange} />
          <SecurityStorageProperties formData={formData} onChange={onChange} />
          <DisplayProperties formData={formData} onChange={onChange} />
        </>
      );
    }
    
    // For boolean fields, show minimal properties
    if (formData.type === 'boolean') {
      return (
        <>
          <BehaviorLogicProperties formData={formData} onChange={onChange} />
          <DisplayProperties formData={formData} onChange={onChange} />
        </>
      );
    }
    
    // For other field types, show basic properties
    return (
      <>
        <BehaviorLogicProperties formData={formData} onChange={onChange} />
        <SecurityStorageProperties formData={formData} onChange={onChange} />
        <DisplayProperties formData={formData} onChange={onChange} />
      </>
    );
  };

  return (
    <Box role="region" aria-label="مرحله ویژگی‌های فیلد">
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography 
          variant="h5" 
          gutterBottom
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(45deg, #4A90E2 30%, #7BB3F0 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          ویژگی‌های فیلد {formData.type === 'select' || formData.type === 'multiselect' ? 'انتخابی' : 'متنی'}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', opacity: 0.8, mb: 4 }}>
          مشخصات و تنظیمات فیلد را تعریف کنید
        </Typography>
      </Box>
      
      {/* ویژگی‌های عمومی - اجباری */}
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
        role="region"
        aria-label="ویژگی‌های عمومی"
      >
        <Typography variant="h6" sx={{ mb: 3, color: '#4A90E2', fontWeight: 600 }}>
          ویژگی‌های عمومی
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="عنوان *"
              value={formData.name}
              onChange={(e) => onChange('name', e.target.value)}
              required
              error={!formData.name}
              helperText={!formData.name ? 'عنوان فیلد اجباری است' : ''}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': { boxShadow: '0 4px 12px rgba(74, 144, 226, 0.15)' },
                  '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(74, 144, 226, 0.1)' },
                },
              }}
              aria-label="عنوان فیلد"
              aria-required="true"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="کلید یکتا *"
              value={formData.englishName}
              onChange={(e) => onChange('englishName', e.target.value)}
              required
              error={!formData.englishName}
              helperText={!formData.englishName ? 'کلید یکتا اجباری است' : 'فقط حروف انگلیسی، اعداد و _ مجاز است'}
              placeholder="field_name"
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': { boxShadow: '0 4px 12px rgba(74, 144, 226, 0.15)' },
                  '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(74, 144, 226, 0.1)' },
                },
              }}
              aria-label="کلید یکتا فیلد"
              aria-required="true"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>جهت متن</InputLabel>
              <Select
                value={formData.direction || 'auto'}
                onChange={(e) => onChange('direction', e.target.value as any)}
                label="جهت متن"
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                }}
                aria-label="جهت متن"
              >
                <MenuItem value="auto">خودکار</MenuItem>
                <MenuItem value="rtl">راست‌به‌چپ</MenuItem>
                <MenuItem value="ltr">چپ‌به‌راست</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      
      {/* ویژگی‌های اختیاری */}
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
        role="region"
        aria-label="ویژگی‌های اختیاری"
      >
        <Typography variant="h6" sx={{ mb: 3, color: '#4A90E2', fontWeight: 600 }}>
          ویژگی‌های اختیاری
        </Typography>
        
        <Grid container spacing={3}>
          {/* Placeholder */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enablePlaceholder || false}
                    onChange={(e) => onChange('enablePlaceholder', e.target.checked)}
                    size="small"
                    aria-label="فعال کردن راهنما"
                  />
                }
                label="راهنما"
                sx={{ mb: 1 }}
              />
              <HelpTooltip
                title="راهنما"
                description="کمک می‌کند کاربر بفهمد چه چیزی بنویسد؛ با تایپ محو می‌شود."
                example="«مثلاً: توضیح کوتاه…»"
              />
            </Box>
            {formData.enablePlaceholder && (
              <TextField
                fullWidth
                label="متن راهنما"
                value={formData.placeholder || ''}
                onChange={(e) => onChange('placeholder', e.target.value)}
                placeholder="مثال: نام خود را وارد کنید"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                  },
                }}
                aria-label="متن راهنما"
              />
            )}
          </Grid>
          
          {/* Help Text */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enableHelpText || false}
                    onChange={(e) => onChange('enableHelpText', e.target.checked)}
                    size="small"
                    aria-label="فعال کردن توضیح کوتاه زیر فیلد"
                  />
                }
                label="توضیح کوتاه زیر فیلد"
                sx={{ mb: 1 }}
              />
              <HelpTooltip
                title="توضیح کوتاه زیر فیلد"
                description="راهنمای ثابت زیر فیلد برای قوانین/نکات."
                example="«حداکثر ۱۴۰ کاراکتر.»"
              />
            </Box>
            {formData.enableHelpText && (
              <TextField
                fullWidth
                label="متن راهنما"
                value={formData.helpText || ''}
                onChange={(e) => onChange('helpText', e.target.value)}
                multiline
                rows={2}
                placeholder="توضیح کوتاه که زیر فیلد نمایش داده می‌شود"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                  },
                }}
                aria-label="توضیح کوتاه زیر فیلد"
              />
            )}
          </Grid>
        </Grid>
      </Paper>
      
      {/* Field Specific Properties */}
      {renderFieldSpecificProperties()}
    </Box>
  );
};

export default memo(FieldPropertiesStep);