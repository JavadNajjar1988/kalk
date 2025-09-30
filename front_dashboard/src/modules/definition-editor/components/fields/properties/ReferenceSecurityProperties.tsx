import React, { memo, useMemo, useState } from 'react';
import { Box, Grid, TextField, FormControlLabel, Switch, FormHelperText } from '@mui/material';
import HelpTooltip from '../shared/HelpTooltip';
import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';

interface Props {
  formData: ExtendedCustomFieldDefinition;
  onChange: (key: keyof ExtendedCustomFieldDefinition, value: any) => void;
  updateRefConfig: (partial: any) => void;
  refCfg: NonNullable<ExtendedCustomFieldDefinition['referenceConfig']>;
}

const ReferenceSecurityProperties = memo<Props>(({ refCfg, updateRefConfig }) => {
  const [jsonError, setJsonError] = useState('');
  const whitelist = (refCfg.displayColumnsWhitelist || []).join(',');
  const whitelistSanitized = useMemo(() => {
    const items = whitelist.split(',').map(s => s.trim()).filter(Boolean);
    const unique = items.filter((v, i, a) => a.indexOf(v) === i);
    return unique.join(',');
  }, [whitelist]);

  // Policy warning for displayFields vs displayColumnsWhitelist
  const policyWarning = useMemo(() => {
    const isTable = refCfg.dataSource?.type === 'table';
    const isApi = refCfg.dataSource?.type === 'api';
    if (!isTable && !isApi) return '';

    const displayFields = isTable 
      ? (refCfg.dataSource?.table?.displayFields || [])
      : (refCfg.dataSource?.api?.displayFields || []);
    const whitelist = refCfg.displayColumnsWhitelist || [];

    if (displayFields.length > 0 && whitelist.length > 0) {
      const hasOverlap = displayFields.some(field => whitelist.includes(field));
      if (hasOverlap) {
        return 'هشدار: هم‌پوشانی بین displayFields و displayColumnsWhitelist وجود دارد. displayColumnsWhitelist اولویت دارد.';
      }
    }
    return '';
  }, [refCfg.dataSource, refCfg.displayColumnsWhitelist]);

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField fullWidth label="محدودسازی ستون‌های قابل نمایش (با کاما)" value={whitelistSanitized} onChange={(e) => updateRefConfig({ displayColumnsWhitelist: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="name,code" />
            <HelpTooltip title="لیست ستون‌های مجاز" description="ستون‌هایی که به کاربر نشان داده می‌شوند را محدود می‌کند. در صورت تعریف، اولویت بالاتری نسبت به displayFields دارد." example="name,code,status" />
          </Box>
          <FormHelperText>ستون‌های تکراری حذف می‌شوند</FormHelperText>
          {policyWarning && (
            <FormHelperText sx={{ color: 'warning.main', fontWeight: 'bold' }}>
              {policyWarning}
            </FormHelperText>
          )}
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              fullWidth
              label="فیلترهای اجباری (JSON)"
              placeholder='[{"field":"org","op":"eq","value":"X"}]'
              value={JSON.stringify(refCfg.mandatoryFilters || [], null, 0)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value || '[]');
                  setJsonError('');
                  updateRefConfig({ mandatoryFilters: parsed });
                } catch (err) {
                  setJsonError('JSON نامعتبر است');
                }
              }}
              error={!!jsonError}
              helperText={jsonError || ''}
              inputProps={{ 'aria-invalid': !!jsonError }}
            />
            <HelpTooltip title="فیلتر اجباری" description="فیلترهایی که همیشه روی داده مرجع اعمال می‌شوند." example='[{"field":"org","op":"eq","value":"X"}]' />
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControlLabel control={<Switch checked={!!refCfg.indexing?.searchable} onChange={(e) => updateRefConfig({ indexing: { ...(refCfg.indexing || {}), searchable: e.target.checked } })} />} label="نمایه‌سازی: جستجوپذیر" />
          <FormHelperText>فعال‌سازی نمایه‌سازی برای جستجو؛ هزینه ذخیره‌سازی/ساخت شاخص را درنظر بگیرید</FormHelperText>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControlLabel control={<Switch checked={!!refCfg.indexing?.filterable} onChange={(e) => updateRefConfig({ indexing: { ...(refCfg.indexing || {}), filterable: e.target.checked } })} />} label="نمایه‌سازی: فیلترپذیر" />
          <FormHelperText>برای فیلترهای پرتکرار فعال کنید تا کارایی بهتر شود</FormHelperText>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControlLabel control={<Switch checked={!!refCfg.storeRawAndDisplay} onChange={(e) => updateRefConfig({ storeRawAndDisplay: e.target.checked })} />} label="ذخیره نسخه خام (id) و نمایشی (label)" />
          <FormHelperText>ذخیره همزمان id و label برای گزارش‌گیری/مرور سریع</FormHelperText>
        </Grid>
      </Grid>
    </Box>
  );
});

ReferenceSecurityProperties.displayName = 'ReferenceSecurityProperties';
export default ReferenceSecurityProperties;


