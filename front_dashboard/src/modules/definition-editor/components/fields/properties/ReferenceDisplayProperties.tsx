import React, { memo, useMemo } from 'react';
import { Box, Grid, TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch, FormHelperText } from '@mui/material';
import HelpTooltip from '../shared/HelpTooltip';
import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';

interface Props {
  formData: ExtendedCustomFieldDefinition;
  onChange: (key: keyof ExtendedCustomFieldDefinition, value: any) => void;
  updateRefConfig: (partial: any) => void;
  refCfg: NonNullable<ExtendedCustomFieldDefinition['referenceConfig']>;
}

const ReferenceDisplayProperties = memo<Props>(({ refCfg, updateRefConfig }) => {
  const displayType = refCfg.displayType || 'dropdown';
  const showCountDisabled = displayType === 'chips';
  const pinTopHelper = 'آیتم‌های پرکاربرد در بالای لیست نمایش داده شوند';
  const iconHelper = 'پیشنهاد: از نام آیکون مطابق کتابخانه مورد استفاده (مثال: mdi:...)';

  const displayTypeHelp = useMemo(() => {
    switch (displayType) {
      case 'dropdown':
        return 'لیست بازشونده استاندارد برای انتخاب تکی/چندتایی';
      case 'autocomplete':
        return 'فیلد با قابلیت جستجو و پیشنهاد حین تایپ';
      case 'dialog':
        return 'انتخاب در دیالوگ با فضای بیشتر و امکانات اضافه';
      case 'tree':
        return 'نمایش سلسله‌مراتبی برای دسته‌بندی‌ها';
      case 'chips':
        return 'نمایش انتخاب‌ها به‌صورت Chips (معمولاً چندانتخابی)';
      default:
        return '';
    }
  }, [displayType]);

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>نوع نمایش</InputLabel>
            <Select label="نوع نمایش" value={refCfg.displayType || ''} onChange={(e) => updateRefConfig({ displayType: e.target.value })}>
              <MenuItem value={'dropdown'}>Dropdown</MenuItem>
              <MenuItem value={'autocomplete'}>Autocomplete</MenuItem>
              <MenuItem value={'dialog'}>Dialog انتخاب</MenuItem>
              <MenuItem value={'tree'}>Tree View</MenuItem>
              <MenuItem value={'chips'}>Chips (چندانتخابی)</MenuItem>
            </Select>
            <FormHelperText>{displayTypeHelp}</FormHelperText>
            <HelpTooltip title="نوع نمایش" description="قالب نمایش لیست انتخاب." example="Autocomplete برای لیست‌های طولانی" />
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>اندازه</InputLabel>
            <Select label="اندازه" value={refCfg.size || 'medium'} onChange={(e) => updateRefConfig({ size: e.target.value })}>
              <MenuItem value={'small'}>کوچک</MenuItem>
              <MenuItem value={'medium'}>متوسط</MenuItem>
              <MenuItem value={'large'}>بزرگ</MenuItem>
              <MenuItem value={'full'}>تمام‌عرض</MenuItem>
            </Select>
            <HelpTooltip title="اندازه نمایش" description="تعیین اندازه کنترل در فرم." example="full برای فرم‌های تمام‌عرض" />
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel control={<Switch checked={!!refCfg.showSelectedCount} onChange={(e) => updateRefConfig({ showSelectedCount: e.target.checked })} />} label="نمایش شمارنده" disabled={showCountDisabled} />
            <HelpTooltip title="نمایش شمارنده" description="نمایش تعداد آیتم‌های انتخاب‌شده/یافته‌شده." example="(3 مورد انتخاب شده)" />
          </Box>
          {showCountDisabled && <FormHelperText>در حالت Chips معمولاً شمارنده نمایش داده نمی‌شود</FormHelperText>}
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel control={<Switch checked={!!refCfg.pinFrequentOnTop} onChange={(e) => updateRefConfig({ pinFrequentOnTop: e.target.checked })} />} label="پین کردن آیتم‌های پرکاربرد" />
            <HelpTooltip title="پین آیتم‌ها" description={pinTopHelper} example="نمایش دسته‌های پرتکرار در بالا" />
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField fullWidth label="آیکون پیشوند" value={(refCfg.iconPrefix || '').trim()} onChange={(e) => updateRefConfig({ iconPrefix: e.target.value.trim() })} placeholder="mdi:city" helperText={iconHelper} />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField fullWidth label="آیکون پسوند" value={(refCfg.iconSuffix || '').trim()} onChange={(e) => updateRefConfig({ iconSuffix: e.target.value.trim() })} placeholder="mdi:arrow-right" helperText={iconHelper} />
        </Grid>
      </Grid>
    </Box>
  );
});

ReferenceDisplayProperties.displayName = 'ReferenceDisplayProperties';
export default ReferenceDisplayProperties;


