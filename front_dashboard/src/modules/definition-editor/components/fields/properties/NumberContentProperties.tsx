// Number Content Properties Component
// کامپوننت ویژگی‌های محتوایی فیلد عددی

import React, { memo } from 'react';
import {
  Box,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';
import HelpTooltip from '../shared/HelpTooltip';

interface NumberContentPropertiesProps {
  formData: ExtendedCustomFieldDefinition;
  onChange: (key: keyof ExtendedCustomFieldDefinition, value: any) => void;
}

export const NumberContentProperties = memo<NumberContentPropertiesProps>(({
  formData,
  onChange: handleChange,
}) => {
  const numberField = formData.numberField || {};

  const handleNumberFieldChange = (key: string, value: any) => {
    const newNumberField = { ...numberField, [key]: value };
    
    // Auto-reset dependent properties when numberType changes
    if (key === 'numberType' && value === 'integer') {
      // Reset decimalPrecision for integer type
      newNumberField.decimalPrecision = undefined;
      
      // Adjust step if it's decimal
      if (newNumberField.step && newNumberField.step < 1) {
        newNumberField.step = 1;
      }
    }
    
    handleChange('numberField', newNumberField);
  };

  const handleDisplayFormatChange = (key: string, value: any) => {
    const displayFormat = numberField.displayFormat || {};
    handleNumberFieldChange('displayFormat', { ...displayFormat, [key]: value });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <h4 style={{ margin: 0, color: '#4A90E2', fontWeight: 600 }}>
          ویژگی‌های محتوایی
        </h4>
      </Box>
      
      <Grid container spacing={2}>
        {/* نوع عدد */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControl fullWidth>
              <InputLabel>نوع عدد</InputLabel>
              <Select
                value={numberField.numberType || 'integer'}
                onChange={(e) => handleNumberFieldChange('numberType', e.target.value)}
                label="نوع عدد"
                sx={{ background: 'rgba(255, 255, 255, 0.8)' }}
              >
                <MenuItem value="integer">صحیح</MenuItem>
                <MenuItem value="decimal">اعشاری</MenuItem>
              </Select>
            </FormControl>
            <HelpTooltip
              title="نوع عدد"
              description="نوع عدد: صحیح (بدون اعشار) یا اعشاری (با اعشار)."
              example="صحیح: 100، اعشاری: 100.50"
            />
          </Box>
        </Grid>
        
        {/* حداقل مقدار */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              fullWidth
              type="number"
              label="حداقل مقدار (min)"
              value={numberField.minValue || ''}
              onChange={(e) => {
                const minValue = parseFloat(e.target.value) || undefined;
                
                // For integer type, ensure minValue is an integer
                const adjustedMinValue = numberField.numberType === 'integer' && minValue 
                  ? Math.floor(minValue) 
                  : minValue;
                
                handleNumberFieldChange('minValue', adjustedMinValue);
              }}
              placeholder="0"
              error={numberField.minValue !== undefined && numberField.maxValue !== undefined && numberField.minValue > numberField.maxValue}
              helperText={
                numberField.minValue !== undefined && numberField.maxValue !== undefined && numberField.minValue > numberField.maxValue
                  ? 'حداقل مقدار نمی‌تواند بیشتر از حداکثر مقدار باشد'
                  : ''
              }
              sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
            />
            <HelpTooltip
              title="حداقل مقدار"
              description="کمترین مقدار مجاز برای ورودی."
              example="0 برای قیمت، 1 برای تعداد"
            />
          </Box>
        </Grid>
        
        {/* حداکثر مقدار */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              fullWidth
              type="number"
              label="حداکثر مقدار (max)"
              value={numberField.maxValue || ''}
              onChange={(e) => {
                const maxValue = parseFloat(e.target.value) || undefined;
                
                // For integer type, ensure maxValue is an integer
                const adjustedMaxValue = numberField.numberType === 'integer' && maxValue 
                  ? Math.floor(maxValue) 
                  : maxValue;
                
                handleNumberFieldChange('maxValue', adjustedMaxValue);
              }}
              placeholder="1000000"
              error={numberField.minValue !== undefined && numberField.maxValue !== undefined && numberField.minValue > numberField.maxValue}
              helperText={
                numberField.minValue !== undefined && numberField.maxValue !== undefined && numberField.minValue > numberField.maxValue
                  ? 'حداکثر مقدار نمی‌تواند کمتر از حداقل مقدار باشد'
                  : ''
              }
              sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
            />
            <HelpTooltip
              title="حداکثر مقدار"
              description="بیشترین مقدار مجاز برای ورودی."
              example="1000000 برای قیمت، 100 برای درصد"
            />
          </Box>
        </Grid>
        
        {/* گام */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              fullWidth
              type="number"
              label="گام (step)"
              value={numberField.step || ''}
              onChange={(e) => {
                const stepValue = parseFloat(e.target.value) || undefined;
                
                if (stepValue !== undefined && stepValue <= 0) {
                  // Don't allow negative or zero step
                  return;
                }
                
                // For integer type, ensure step is at least 1
                let adjustedStepValue = numberField.numberType === 'integer' && stepValue && stepValue < 1 
                  ? 1 
                  : stepValue;
                
                // Ensure step is compatible with decimalPrecision
                if (adjustedStepValue && numberField.decimalPrecision !== undefined) {
                  const minStep = Math.pow(10, -numberField.decimalPrecision);
                  if (adjustedStepValue < minStep) {
                    adjustedStepValue = minStep;
                  }
                }
                
                handleNumberFieldChange('step', adjustedStepValue);
              }}
              placeholder="1"
              error={numberField.step !== undefined && numberField.step <= 0}
              helperText={
                numberField.step !== undefined && numberField.step <= 0
                  ? 'گام باید بزرگتر از صفر باشد'
                  : (numberField.numberType === 'integer' && numberField.step && numberField.step < 1 
                      ? 'برای اعداد صحیح، گام حداقل ۱ است' 
                      : (numberField.decimalPrecision !== undefined && numberField.step && 
                         numberField.step < Math.pow(10, -numberField.decimalPrecision)
                        ? `گام باید حداقل ${Math.pow(10, -numberField.decimalPrecision)} باشد`
                        : ''))
              }
              sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
            />
            <HelpTooltip
              title="گام"
              description="مقدار افزایش/کاهش در هر مرحله."
              example="1 برای اعداد صحیح، 0.01 برای اعشار"
            />
          </Box>
        </Grid>
        
        {/* تعداد اعشار مجاز */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              fullWidth
              type="number"
              label="تعداد اعشار مجاز"
              value={numberField.decimalPrecision || ''}
              onChange={(e) => {
                const precision = parseInt(e.target.value);
                
                // Don't allow decimal precision for integer type
                if (numberField.numberType === 'integer' && precision > 0) {
                  return;
                }
                
                handleNumberFieldChange('decimalPrecision', precision || undefined);
              }}
              placeholder="2"
              disabled={numberField.numberType === 'integer'}
              error={
                (numberField.numberType === 'integer' && numberField.decimalPrecision !== undefined && numberField.decimalPrecision > 0) ||
                (numberField.decimalPrecision !== undefined && numberField.decimalPrecision > 10) ||
                ((numberField.displayFormat?.autoFormat === 'currency' || numberField.displayFormat?.autoFormat === 'percentage') && 
                 numberField.decimalPrecision !== undefined && numberField.decimalPrecision > 2)
              }
              helperText={
                numberField.numberType === 'integer' 
                  ? 'برای اعداد صحیح، دقت اعشار اعمال نمی‌شود'
                  : (numberField.displayFormat?.autoFormat === 'currency' || numberField.displayFormat?.autoFormat === 'percentage') && 
                    numberField.decimalPrecision !== undefined && numberField.decimalPrecision > 2
                    ? `برای فرمت ${numberField.displayFormat.autoFormat}، حداکثر ۲ رقم اعشار مجاز است`
                    : (numberField.decimalPrecision !== undefined && numberField.decimalPrecision > 10
                        ? 'حداکثر 10 رقم اعشار مجاز است'
                        : `${numberField.decimalPrecision || 0}/10`)
              }
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  background: 'rgba(255, 255, 255, 0.8)',
                  '&.Mui-disabled': { opacity: 0.7 }
                }
              }}
            />
            <HelpTooltip
              title="تعداد اعشار مجاز"
              description="حداکثر تعداد رقم اعشار قابل نمایش."
              example="2 برای پول، 4 برای دقت بالا"
            />
          </Box>
        </Grid>
        
        {/* مقدار پیش‌فرض */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              fullWidth
              type="number"
              label="مقدار پیش‌فرض"
              value={numberField.defaultValue || ''}
              onChange={(e) => {
                const defaultValue = parseFloat(e.target.value) || undefined;
                
                // Adjust defaultValue based on numberType
                const adjustedDefaultValue = numberField.numberType === 'integer' && defaultValue 
                  ? Math.floor(defaultValue) 
                  : defaultValue;
                
                handleNumberFieldChange('defaultValue', adjustedDefaultValue);
              }}
              placeholder="0"
              error={
                (numberField.defaultValue !== undefined && 
                 numberField.minValue !== undefined && 
                 numberField.defaultValue < numberField.minValue) ||
                (numberField.defaultValue !== undefined && 
                 numberField.maxValue !== undefined && 
                 numberField.defaultValue > numberField.maxValue)
              }
              helperText={
                numberField.defaultValue !== undefined && 
                numberField.minValue !== undefined && 
                numberField.defaultValue < numberField.minValue
                  ? `مقدار پیش‌فرض نباید کمتر از ${numberField.minValue} باشد`
                  : (numberField.defaultValue !== undefined && 
                     numberField.maxValue !== undefined && 
                     numberField.defaultValue > numberField.maxValue)
                    ? `مقدار پیش‌فرض نباید بیشتر از ${numberField.maxValue} باشد`
                    : ''
              }
              sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
            />
            <HelpTooltip
              title="مقدار پیش‌فرض"
              description="مقداری که از قبل در فیلد نمایش داده می‌شود."
              example="0 برای مبلغ، 1 برای تعداد"
            />
          </Box>
        </Grid>
        
        {/* گروه‌بندی سه‌رقمی */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={numberField.displayFormat?.thousandSeparator || false}
                  onChange={(e) => handleDisplayFormatChange('thousandSeparator', e.target.checked)}
                  size="small"
                />
              }
              label="گروه‌بندی سه‌رقمی"
            />
            <HelpTooltip
              title="گروه‌بندی سه‌رقمی"
              description="نمایش کاما برای جدا کردن هزارگان."
              example="1,000,000 به جای 1000000"
            />
          </Box>
        </Grid>
        
        {/* نماد هزارگان */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              fullWidth
              label="نماد هزارگان"
              value={numberField.displayFormat?.thousandSymbol || ''}
              onChange={(e) => handleDisplayFormatChange('thousandSymbol', e.target.value)}
              placeholder=","
              disabled={!numberField.displayFormat?.thousandSeparator}
              error={
                numberField.displayFormat?.thousandSymbol === numberField.displayFormat?.decimalSeparator &&
                numberField.displayFormat?.thousandSymbol !== ''
              }
              helperText={
                numberField.displayFormat?.thousandSymbol === numberField.displayFormat?.decimalSeparator &&
                numberField.displayFormat?.thousandSymbol !== ''
                  ? 'نماد هزارگان نمی‌تواند با جداکننده اعشار یکسان باشد'
                  : !numberField.displayFormat?.thousandSeparator 
                    ? 'ابتدا گروه\u200cبندی سه\u200cرقمی را فعال کنید'
                    : ''
              }
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  background: 'rgba(255, 255, 255, 0.8)',
                  '&.Mui-disabled': { opacity: 0.7 }
                }
              }}
            />
            <HelpTooltip
              title="نماد هزارگان"
              description="نماد جداکننده هزارگان."
              example=", یا . یا فاصله"
            />
          </Box>
        </Grid>
        
        {/* جداکننده اعشار */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControl fullWidth>
              <InputLabel>جداکننده اعشار</InputLabel>
              <Select
                value={numberField.displayFormat?.decimalSeparator || 'dot'}
                onChange={(e) => handleDisplayFormatChange('decimalSeparator', e.target.value)}
                label="جداکننده اعشار"
                sx={{ background: 'rgba(255, 255, 255, 0.8)' }}
              >
                <MenuItem value="dot">نقطه (.)</MenuItem>
                <MenuItem value="comma">کاما (،)</MenuItem>
              </Select>
            </FormControl>
            <HelpTooltip
              title="جداکننده اعشار"
              description="نماد جداکننده قسمت اعشار."
              example="نقطه: 100.50، کاما: 100,50"
            />
          </Box>
        </Grid>
        
        {/* فرمت نمایش خودکار */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControl fullWidth>
              <InputLabel>فرمت نمایش خودکار</InputLabel>
              <Select
                value={numberField.displayFormat?.autoFormat || 'none'}
                onChange={(e) => {
                  const autoFormatValue = e.target.value;
                  
                  // Adjust decimalPrecision based on autoFormat
                  const newDisplayFormat = { 
                    ...numberField.displayFormat, 
                    autoFormat: autoFormatValue 
                  };
                  
                  if (autoFormatValue === 'currency' || autoFormatValue === 'percentage') {
                    // Limit decimalPrecision to 2 for currency/percentage
                    if (numberField.decimalPrecision && numberField.decimalPrecision > 2) {
                      newDisplayFormat.decimalPrecisionLimit = 'Auto-limited to 2 for ' + autoFormatValue;
                    }
                  }
                  
                  handleNumberFieldChange('displayFormat', newDisplayFormat);
                }}
                label="فرمت نمایش خودکار"
                sx={{ background: 'rgba(255, 255, 255, 0.8)' }}
              >
                <MenuItem value="none">هیچ</MenuItem>
                <MenuItem value="currency">پولی (حداکثر ۲ رقم اعشار)</MenuItem>
                <MenuItem value="percentage">درصد (حداکثر ۲ رقم اعشار)</MenuItem>
              </Select>
            </FormControl>
            <HelpTooltip
              title="فرمت نمایش خودکار"
              description="فرمت خودکار برای نمایش مقدار."
              example="پولی: 1,000,000 ریال، درصد: 50%"
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
});

NumberContentProperties.displayName = 'NumberContentProperties';
