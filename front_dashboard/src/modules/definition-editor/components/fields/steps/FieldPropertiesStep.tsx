import React, { memo, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { FieldPropertiesStepProps } from '../types/FieldEditTypes';
import HelpTooltip from '../shared/HelpTooltip';
import ContentControlProperties from '../properties/ContentControlProperties';
import AssistiveProperties from '../properties/AssistiveProperties';
import BehaviorLogicProperties from '../properties/BehaviorLogicProperties';
import SecurityStorageProperties from '../properties/SecurityStorageProperties';
import DisplayProperties from '../properties/DisplayProperties';
// import SelectOptionsProperties from '../properties/SelectOptionsProperties';
import SelectFieldProperties from '../properties/SelectFieldProperties';
import VariantProperties from '../properties/VariantProperties';
import MaskProperties from '../properties/MaskProperties';
// import { NumberBasicProperties } from '../properties/NumberBasicProperties';
import { NumberContentProperties } from '../properties/NumberContentProperties';
import { NumberHelperProperties } from '../properties/NumberHelperProperties';
import { NumberBehaviorProperties } from '../properties/NumberBehaviorProperties';
import { NumberSecurityProperties } from '../properties/NumberSecurityProperties';
import { NumberDisplayProperties } from '../properties/NumberDisplayProperties';
import ReferenceFieldProperties from '../properties/ReferenceFieldProperties';

const FieldPropertiesStep: React.FC<FieldPropertiesStepProps> = ({ formData, onChange }) => {
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>('basic');
  const theme = useTheme();

  const handleAccordionChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

  // Determine which properties component to show based on field type
  const getFieldSpecificProperties = () => {
    const isTextBased = formData.type === 'text' || formData.type === 'email' || formData.type === 'password' || formData.type === 'textarea';
    const isSelectBased = formData.type === 'select' || formData.type === 'multiselect';
    const isNumber = formData.type === 'number';
    const isBoolean = formData.type === 'boolean';

    return {
      isTextBased,
      isSelectBased,
      isNumber,
      isBoolean,
      hasContentControl: isTextBased,
      hasAssistive: isTextBased,
      hasBehavior: true,
      hasSecurity: isTextBased || isNumber,
      hasDisplay: true,
      hasVariant: isTextBased,
      hasMask: isTextBased,
      hasSelectOptions: isSelectBased
    };
  };

  const fieldProps = getFieldSpecificProperties();

  // Show only reference properties when type is reference
  if (formData.type === 'reference') {
    return (
      <Box role="region" aria-label="مرحله ویژگی‌های فیلد مرجع">
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
            ویژگی‌های فیلد مرجع
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', opacity: 0.8, mb: 4 }}>
            مشخصات و تنظیمات فیلد را تعریف کنید
          </Typography>
        </Box>

        {/* Render reference accordions directly */}
        <ReferenceFieldProperties formData={formData} onChange={onChange} />
      </Box>
    );
  }

  return (
    <Box role="region" aria-label="مرحله ویژگی‌های فیلد">
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography 
          variant="h5" 
          gutterBottom
          sx={{
            fontWeight: 700,
            color: theme.palette.primary.main,
          }}
        >
          {(() => {
            const t = formData.type as any;
            if (t === 'reference') return 'ویژگی‌های فیلد مرجع';
            if (t === 'select' || t === 'multiselect') return 'ویژگی‌های فیلد انتخابی';
            if (t === 'number') return 'ویژگی‌های فیلد عددی';
            return 'ویژگی‌های فیلد متنی';
          })()}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', opacity: 0.8, mb: 4 }}>
          مشخصات و تنظیمات فیلد را تعریف کنید
        </Typography>
      </Box>

      {/* Navigation Guide */}
      <Box sx={{ mb: 3, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: theme.palette.primary.main }}>
          راهنمای تنظیمات فیلد
        </Typography>
        <Typography variant="body2" color="text.secondary">
          برای تنظیم فیلد، ابتدا ویژگی‌های پایه را تکمیل کنید، سپس سایر بخش‌ها را بر اساس نیاز تنظیم کنید.
        </Typography>
      </Box>

      {/* Basic Properties - Always First */}
      <Accordion 
        expanded={expandedAccordion === 'basic'} 
        onChange={handleAccordionChange('basic')}
        sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' } }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
            📝 ویژگی‌های پایه (اجباری)
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
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
                    '&:hover': { boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}` },
                    '&.Mui-focused': { boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}` },
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
                    '&:hover': { boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}` },
                    '&.Mui-focused': { boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}` },
                  },
                }}
                aria-label="کلید یکتا فیلد"
                aria-required="true"
              />
            </Grid>
            
            {(formData.type !== 'number' && (formData.type as any) !== 'reference') && (
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
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Optional Properties */}
      <Accordion 
        expanded={expandedAccordion === 'optional'} 
        onChange={handleAccordionChange('optional')}
        sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' } }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
            💡 ویژگی‌های اختیاری
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            {/* Placeholder always available */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ mr: 1 }}>راهنما</Typography>
                <HelpTooltip
                  title="راهنما"
                  description="کمک می‌کند کاربر بفهمد چه چیزی بنویسد؛ با تایپ محو می‌شود."
                  example="«مثلاً: توضیح کوتاه…»"
                />
              </Box>
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
            </Grid>

            {/* Help Text always available */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ mr: 1 }}>توضیح کوتاه زیر فیلد</Typography>
                <HelpTooltip
                  title="توضیح کوتاه زیر فیلد"
                  description="راهنمای ثابت زیر فیلد برای قوانین/نکات."
                  example="«حداکثر ۱۴۰ کاراکتر.»"
                />
              </Box>
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
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      

      {/* Content Control Properties - Text Fields Only */}
      {fieldProps.hasContentControl && (
        <Accordion 
          expanded={expandedAccordion === 'content'} 
          onChange={handleAccordionChange('content')}
          sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
              🔒 کنترل محتوا
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <ContentControlProperties formData={formData} onChange={onChange as any} />
          </AccordionDetails>
        </Accordion>
      )}

      {/* Assistive Properties - Text Fields Only */}
      {fieldProps.hasAssistive && (
        <Accordion 
          expanded={expandedAccordion === 'assistive'} 
          onChange={handleAccordionChange('assistive')}
          sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
              🎯 ویژگی‌های کمکی
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <AssistiveProperties formData={formData} onChange={onChange as any} />
          </AccordionDetails>
        </Accordion>
      )}

      {/* Number Content Properties - Number Fields Only */}
      {formData.type === 'number' && (
        <Accordion 
          expanded={expandedAccordion === 'number-content'} 
          onChange={handleAccordionChange('number-content')}
          sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
              🔢 ویژگی‌های محتوایی عددی
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <NumberContentProperties formData={formData} onChange={onChange as any} />
          </AccordionDetails>
        </Accordion>
      )}

      {/* Number Helper Properties - Number Fields Only */}
      {formData.type === 'number' && (
        <Accordion 
          expanded={expandedAccordion === 'number-helper'} 
          onChange={handleAccordionChange('number-helper')}
          sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
              🛠️ ویژگی‌های کمکی عددی
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <NumberHelperProperties formData={formData} onChange={onChange as any} />
          </AccordionDetails>
        </Accordion>
      )}

      {/* Display Properties - All Fields */}
      <Accordion 
        expanded={expandedAccordion === 'display'} 
        onChange={handleAccordionChange('display')}
        sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' } }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
            🎨 ویژگی‌های نمایشی
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {formData.type === 'number' ? (
            <NumberDisplayProperties formData={formData} onChange={onChange as any} />
          ) : (
            <DisplayProperties formData={formData} onChange={onChange as any} />
          )}
        </AccordionDetails>
      </Accordion>

      {/* Variant Properties - Text Fields Only */}
      {fieldProps.hasVariant && (
        <Accordion 
          expanded={expandedAccordion === 'variant'} 
          onChange={handleAccordionChange('variant')}
          sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
              🔧 ویژگی‌های تخصصی نوع نمایش
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <VariantProperties formData={formData} onChange={onChange as any} />
          </AccordionDetails>
        </Accordion>
      )}

      {/* Mask Properties - Text Fields Only */}
      {fieldProps.hasMask && (
        <Accordion 
          expanded={expandedAccordion === 'mask'} 
          onChange={handleAccordionChange('mask')}
          sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
              🎭 ویژگی‌های ماسک‌گذاری
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <MaskProperties formData={formData} onChange={onChange as any} />
          </AccordionDetails>
        </Accordion>
      )}

      {/* Behavior and Logic Properties - All Fields */}
      <Accordion 
        expanded={expandedAccordion === 'behavior'} 
        onChange={handleAccordionChange('behavior')}
        sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' } }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
            ⚙️ رفتار و منطق
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {formData.type === 'number' ? (
            <NumberBehaviorProperties formData={formData} onChange={onChange as any} />
          ) : (
            <BehaviorLogicProperties formData={formData} onChange={onChange as any} />
          )}
        </AccordionDetails>
      </Accordion>

      {/* Security and Storage Properties - Text and Number Fields */}
      {fieldProps.hasSecurity && (
        <Accordion 
          expanded={expandedAccordion === 'security'} 
          onChange={handleAccordionChange('security')}
          sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
              🔐 امنیت و ذخیره‌سازی
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {formData.type === 'number' ? (
              <NumberSecurityProperties formData={formData} onChange={onChange as any} />
            ) : (
              <SecurityStorageProperties formData={formData} onChange={onChange as any} />
            )}
          </AccordionDetails>
        </Accordion>
      )}

      {/* Select Field Properties - Select Fields Only */}
      {fieldProps.isSelectBased && (
        <Accordion 
          expanded={expandedAccordion === 'select'} 
          onChange={handleAccordionChange('select')}
          sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
              📋 ویژگی‌های فیلد انتخابی
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <SelectFieldProperties formData={formData} onChange={onChange as any} />
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
};

export default memo(FieldPropertiesStep);