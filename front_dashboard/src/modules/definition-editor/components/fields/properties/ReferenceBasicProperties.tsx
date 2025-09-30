import React, { memo, useMemo } from 'react';
import { Box, Grid, TextField } from '@mui/material';
import HelpTooltip from '../shared/HelpTooltip';
import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';

interface Props {
  formData: ExtendedCustomFieldDefinition;
  onChange: (key: keyof ExtendedCustomFieldDefinition, value: any) => void;
}

const MAX_LEN = 64;

function normalizeKey(raw: string): string {
  const trimmed = (raw || '').trim();
  const ascii = trimmed
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
  // prevent starting with digit
  return ascii.replace(/^[0-9]+/, (m) => (m ? '' : ''));
}

const ReferenceBasicProperties = memo<Props>(({ formData, onChange }) => {
  const name = formData.name || '';
  const englishName = formData.englishName || '';

  const nameError = useMemo(() => {
    const trimmed = name.trim();
    if (!trimmed) return 'عنوان الزامی است';
    if (trimmed.length > MAX_LEN) return `حداکثر ${MAX_LEN} کاراکتر مجاز است`;
    return '';
  }, [name]);

  const keyChecks = useMemo(() => {
    const trimmed = englishName.trim();
    if (!trimmed) return { error: 'کلید یکتا الزامی است', helper: `حداکثر ${MAX_LEN} کاراکتر، فقط a-z 0-9 _` };
    if (trimmed.length > MAX_LEN) return { error: `حداکثر ${MAX_LEN} کاراکتر مجاز است`, helper: '' };
    if (!/^[a-z0-9_]+$/.test(trimmed)) return { error: 'فقط حروف انگلیسی کوچک، عدد و _ مجاز است', helper: '' };
    if (/^[0-9]/.test(trimmed)) return { error: 'شروع کلید با عدد مجاز نیست', helper: '' };
    return { error: '', helper: 'از حروف کوچک و _ استفاده کنید' };
  }, [englishName]);

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              fullWidth
              label="عنوان *"
              value={name}
              onChange={(e) => onChange('name', e.target.value.slice(0, MAX_LEN))}
              placeholder="نام فیلد"
              required
              error={!!nameError}
              helperText={nameError || `${name.length}/${MAX_LEN}`}
              inputProps={{ 'aria-invalid': !!nameError }}
            />
            <HelpTooltip title="عنوان فیلد" description="نام نمایشی فیلد که کاربر می‌بیند." example="مثلاً: انتخاب شهر" />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              fullWidth
              label="کلید یکتا *"
              value={englishName}
              onChange={(e) => {
                const normalized = normalizeKey(e.target.value).slice(0, MAX_LEN);
                onChange('englishName', normalized);
              }}
              onBlur={() => {
                if (!englishName.trim() && name.trim()) {
                  onChange('englishName', normalizeKey(name).slice(0, MAX_LEN));
                }
              }}
              placeholder="field_key"
              required
              error={!!keyChecks.error}
              helperText={keyChecks.error || keyChecks.helper || `${englishName.length}/${MAX_LEN}`}
              inputProps={{ 'aria-invalid': !!keyChecks.error }}
            />
            <HelpTooltip title="کلید یکتا" description="شناسه یکتای فیلد برای استفاده در کد." example="city_id" />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
});

ReferenceBasicProperties.displayName = 'ReferenceBasicProperties';
export default ReferenceBasicProperties;


