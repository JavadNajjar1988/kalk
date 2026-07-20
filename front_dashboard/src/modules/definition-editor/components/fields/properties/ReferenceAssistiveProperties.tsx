import React, { memo, useMemo, useState } from 'react';
import { Box, Grid, FormControlLabel, Switch, Chip, TextField, Button, FormHelperText, IconButton } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import HelpTooltip from '../shared/HelpTooltip';
import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';

interface Props {
  formData: ExtendedCustomFieldDefinition;
  onChange: (key: keyof ExtendedCustomFieldDefinition, value: any) => void;
  updateRefConfig: (partial: any) => void;
  refCfg: NonNullable<ExtendedCustomFieldDefinition['referenceConfig']>;
}

const ReferenceAssistiveProperties = memo<Props>(({ refCfg, updateRefConfig }) => {
  const isStatic = refCfg.dataSource?.type === 'static';
  const isApi = refCfg.dataSource?.type === 'api';
  const displayType = refCfg.displayType || 'dropdown';

  const enableSearchId = 'assistive-enable-search-helper';
  const userFilterId = 'assistive-user-filter-helper';
  const resultCountId = 'assistive-result-count-helper';

  const enableSearchDisabled = isStatic;
  const enableSearchHelper = useMemo(() => {
    if (isStatic) return 'برای منبع Static، جستجو حین تایپ کاربردی ندارد';
    if (isApi && !refCfg.dataSource?.api?.queryParam?.trim()) return "برای جستجوی مؤثر، پارامتر جستجو (مثلاً 'q') را تعیین کنید";
    return 'پیشنهاد می‌شود سمت سرویس debounce اعمال شود';
  }, [isStatic, isApi, refCfg.dataSource]);

  const userFilterHelper = 'به کاربر اجازه می‌دهد نتایج را با فیلترهای ازپیش‌تعریف‌شده محدود کند';

  const resultCountDisabled = displayType === 'chips';
  const resultCountHelper = useMemo(() => {
    if (displayType === 'chips') return 'در حالت Chips (چندانتخابی) شمارنده نتایج معمولاً نمایش داده نمی‌شود';
    return 'نمایش تعداد نتایج پیدا شده هنگام جستجو';
  }, [displayType]);

  // pinned items editor state
  const [pinValue, setPinValue] = useState('');
  const [pinLabel, setPinLabel] = useState('');
  const canAddPin = pinValue.trim().length > 0 && pinLabel.trim().length > 0;

  const handleAddPin = () => {
    if (!canAddPin) return;
    const next = [...(refCfg.pinnedItems || [])];
    if (!next.some(p => p.value === pinValue.trim())) {
      next.push({ value: pinValue.trim(), label: pinLabel.trim() });
      updateRefConfig({ pinnedItems: next });
      setPinValue('');
      setPinLabel('');
    }
  };

  const handleRemovePin = (value: string) => {
    const next = (refCfg.pinnedItems || []).filter(p => p.value !== value);
    updateRefConfig({ pinnedItems: next });
  };

  const handleMovePin = (value: string, direction: 'up' | 'down') => {
    const items = [...(refCfg.pinnedItems || [])];
    const index = items.findIndex(p => p.value === value);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;

    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    updateRefConfig({ pinnedItems: items });
  };

  // Check for conflicts between pinned items and mandatory filters
  const pinnedConflictWarning = useMemo(() => {
    const pinnedValues = (refCfg.pinnedItems || []).map(p => p.value);
    const mandatoryFilters = refCfg.mandatoryFilters || [];
    
    if (pinnedValues.length === 0 || mandatoryFilters.length === 0) return '';

    // Check if any pinned item might be filtered out by mandatory filters
    const hasConflict = mandatoryFilters.some((filter: any) => {
      if (filter.op === 'eq' && pinnedValues.includes(filter.value)) return true;
      if (filter.op === 'in' && Array.isArray(filter.value) && filter.value.some((v: any) => pinnedValues.includes(v))) return true;
      return false;
    });

    if (hasConflict) {
      return 'هشدار: برخی از آیتم‌های پین‌شده ممکن است توسط فیلترهای اجباری حذف شوند.';
    }
    return '';
  }, [refCfg.pinnedItems, refCfg.mandatoryFilters]);

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel control={<Switch checked={!!refCfg.enableSearch} onChange={(e) => updateRefConfig({ enableSearch: e.target.checked })} disabled={enableSearchDisabled} />} label="جستجو حین تایپ" />
            <HelpTooltip title="جستجو حین تایپ" description="ارسال کوئری به منبع هنگام تایپ کاربر." example="فعال برای API با queryParam: q" />
          </Box>
          <FormHelperText id={enableSearchId}>{enableSearchHelper}</FormHelperText>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel control={<Switch checked={!!refCfg.userFilterEnabled} onChange={(e) => updateRefConfig({ userFilterEnabled: e.target.checked })} />} label="قابلیت فیلتر توسط کاربر" />
            <HelpTooltip title="فیلتر توسط کاربر" description="نمایش کنترل‌های فیلتر در UI برای محدودسازی نتایج." example="فیلتر بر اساس دسته/وضعیت" />
          </Box>
          <FormHelperText id={userFilterId}>{userFilterHelper}</FormHelperText>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel control={<Switch checked={!!refCfg.showResultCount} onChange={(e) => updateRefConfig({ showResultCount: e.target.checked })} />} label="نمایش تعداد نتایج" disabled={resultCountDisabled} />
            <HelpTooltip title="شمارش نتایج" description="تعداد آیتم‌های یافته‌شده نمایش داده می‌شود." example="نمایش (12 نتیجه) کنار لیست" />
          </Box>
          <FormHelperText id={resultCountId}>{resultCountHelper}</FormHelperText>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <TextField size="small" label="Value" value={pinValue} onChange={(e) => setPinValue(e.target.value)} sx={{ width: 220 }} />
            <TextField size="small" label="Label" value={pinLabel} onChange={(e) => setPinLabel(e.target.value)} sx={{ width: 260 }} />
            <Button variant="outlined" onClick={handleAddPin} disabled={!canAddPin}>افزودن آیتم پین</Button>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {(refCfg.pinnedItems || []).map((p, index) => (
              <Box key={p.value} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton 
                  size="small" 
                  onClick={() => handleMovePin(p.value, 'up')} 
                  disabled={index === 0}
                  title="جابجایی به بالا"
                >
                  <KeyboardArrowUpIcon fontSize="small" />
                </IconButton>
                <IconButton 
                  size="small" 
                  onClick={() => handleMovePin(p.value, 'down')} 
                  disabled={index === (refCfg.pinnedItems || []).length - 1}
                  title="جابجایی به پایین"
                >
                  <KeyboardArrowDownIcon fontSize="small" />
                </IconButton>
                <Chip 
                  label={p.label} 
                  color="primary" 
                  variant="outlined" 
                  onDelete={() => handleRemovePin(p.value)} 
                  deleteIcon={<DeleteOutlineIcon fontSize="small" />} 
                />
              </Box>
            ))}
          </Box>
          {pinnedConflictWarning && (
            <FormHelperText sx={{ color: 'warning.main', fontWeight: 'bold', mt: 1 }}>
              {pinnedConflictWarning}
            </FormHelperText>
          )}
        </Grid>
      </Grid>
    </Box>
  );
});

ReferenceAssistiveProperties.displayName = 'ReferenceAssistiveProperties';
export default ReferenceAssistiveProperties;


