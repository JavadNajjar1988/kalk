import React, { memo } from 'react';
import { Box, Typography, Paper, Grid, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch } from '@mui/material';
import HelpTooltip from '../shared/HelpTooltip';

interface ContentControlPropertiesProps {
  formData: any;
  onChange: (key: string, value: any) => void;
}

const ContentControlProperties: React.FC<ContentControlPropertiesProps> = ({ formData, onChange }) => {
  // Helper function to validate regex
  const isValidRegex = (regex: string): boolean => {
    try {
      new RegExp(regex);
      return true;
    } catch {
      return false;
    }
  };

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
      role="region"
      aria-label="ویژگی‌های محتوایی"
    >
      <Typography variant="h6" sx={{ mb: 3, color: '#4A90E2', fontWeight: 600 }}>
        ویژگی‌های محتوایی
      </Typography>
      
      <Grid container spacing={3}>
        {/* Character Control */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControl fullWidth>
              <InputLabel>کنترل نوع کاراکترها</InputLabel>
              <Select
                value={formData.characterControl || 'all'}
                onChange={(e) => onChange('characterControl', e.target.value as any)}
                label="کنترل نوع کاراکترها"
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                }}
                aria-label="کنترل نوع کاراکترها"
              >
                <MenuItem value="letters">فقط حروف</MenuItem>
                <MenuItem value="alphanumeric">حروف + اعداد</MenuItem>
                <MenuItem value="all">همه کاراکترها</MenuItem>
                <MenuItem value="custom">سفارشی</MenuItem>
              </Select>
            </FormControl>
            <HelpTooltip
              title="کنترل نوع کاراکترها"
              description="محدود کردن نوع کاراکترهای مجاز در فیلد"
              example="letters: فقط حروف فارسی و انگلیسی"
            />
          </Box>
        </Grid>

        {/* Case Transform */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControl fullWidth>
              <InputLabel>تبدیل حروف</InputLabel>
              <Select
                value={formData.caseTransform || 'none'}
                onChange={(e) => onChange('caseTransform', e.target.value as any)}
                label="تبدیل حروف"
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                }}
                aria-label="تبدیل حروف"
              >
                <MenuItem value="none">بدون تغییر</MenuItem>
                <MenuItem value="lowercase">همه کوچک</MenuItem>
                <MenuItem value="uppercase">همه بزرگ</MenuItem>
                <MenuItem value="capitalize">حرف اول بزرگ</MenuItem>
              </Select>
            </FormControl>
            <HelpTooltip
              title="تبدیل حروف"
              description="نوع تبدیل حروف برای متن ورودی"
              example="lowercase: 'HELLO' → 'hello'"
            />
          </Box>
        </Grid>

        {/* Custom Regex for Character Control */}
        {formData.characterControl === 'custom' && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                label="الگوی regex سفارشی"
                value={formData.customRegex || ''}
                onChange={(e) => onChange('customRegex', e.target.value)}
                placeholder="^[a-zA-Z0-9]+$"
                helperText="الگوی regex برای محدود کردن کاراکترهای مجاز"
                error={!!(formData.customRegex && !isValidRegex(formData.customRegex))}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                  },
                }}
              />
              <HelpTooltip
                title="الگوی regex سفارشی"
                description="الگوی regex برای محدود کردن کاراکترهای مجاز"
                example="^[a-zA-Z0-9]+$ برای حروف و اعداد"
              />
            </Box>
          </Grid>
        )}

        {/* Content Processing Options */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.trimExtraSpaces || false}
                    onChange={(e) => onChange('trimExtraSpaces', e.target.checked)}
                    size="small"
                    aria-label="حذف فاصله‌های اضافی"
                  />
                }
                label="حذف فاصله‌های اضافی"
              />
              <HelpTooltip
                title="حذف فاصله‌های اضافی"
                description="حذف خودکار فاصله‌های اضافی از ابتدا، انتها و وسط متن"
                example="'  سلام   دنیا  ' → 'سلام دنیا'"
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.convertNumbers || false}
                    onChange={(e) => onChange('convertNumbers', e.target.checked)}
                    size="small"
                    aria-label="تبدیل اعداد فارسی/انگلیسی"
                  />
                }
                label="تبدیل اعداد فارسی/انگلیسی"
              />
              <HelpTooltip
                title="تبدیل اعداد"
                description="تبدیل خودکار اعداد فارسی به انگلیسی یا برعکس"
                example="'۱۲۳۴' → '1234' یا برعکس"
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.fixHalfSpace || false}
                    onChange={(e) => onChange('fixHalfSpace', e.target.checked)}
                    size="small"
                    aria-label="اصلاح نیم‌فاصله"
                  />
                }
                label="اصلاح نیم‌فاصله"
              />
              <HelpTooltip
                title="اصلاح نیم‌فاصله"
                description="تبدیل خودکار فاصله‌های عادی به نیم‌فاصله در مواضع مناسب"
                example="'می رود' → 'می‌رود'"
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.allowEmoji || false}
                    onChange={(e) => onChange('allowEmoji', e.target.checked)}
                    size="small"
                    aria-label="اجازه ایموجی"
                  />
                }
                label="اجازه ایموجی"
              />
              <HelpTooltip
                title="اجازه ایموجی"
                description="امکان استفاده از ایموجی در متن"
                example="'سلام 😊 خوش آمدید'"
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.allowMarkdown || false}
                    onChange={(e) => onChange('allowMarkdown', e.target.checked)}
                    size="small"
                    aria-label="اجازه Markdown"
                  />
                }
                label="اجازه Markdown"
              />
              <HelpTooltip
                title="اجازه Markdown"
                description="امکان استفاده از نشانه‌گذاری Markdown در متن"
                example="'**متن ضخیم** و *متن کج*'"
              />
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default memo(ContentControlProperties);