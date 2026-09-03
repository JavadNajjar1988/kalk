import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { ResourceDto } from '@/services/api/resourceApiService';
import PrimaryImageField from '../components/PrimaryImageField';
import type { PrimaryImageChanges } from '../components/primaryImageHelpers';
import {
  buildResourcesFormDialogSx,
  getResourcesDialogAccent,
  resourcesDialogActionsSx,
  resourcesDialogContentDividersSx,
  resourcesDialogTitleSx,
  resourcesOutlinedCancelButtonSx,
} from '../resourcesDialogStyles';

export const UNIT_ECHELONS = [
  'ارتش',
  'سپاه',
  'لشکر',
  'تیپ',
  'هنگ / گروه',
  'گردان / اسکادران',
  'گروهان / آتشبار',
  'دسته / جزء مستقل',
  'نامشخص',
] as const;

export const UNIT_TYPES = [
  'پیاده‌نظام',
  'پیاده‌نظام مکانیزه',
  'زرهی',
  'شناسایی',
  'توپخانه',
  'پدافند هوایی',
  'مهندسی رزمی',
  'مخابرات',
  'هوابرد',
  'تکاور / نیروی ویژه',
  'پشتیبانی خدمات رزمی',
  'دریایی',
] as const;

const UNIT_CAPABILITIES = [
  'زرهی',
  'مکانیزه',
  'توپخانه کششی',
  'توپخانه خودکششی',
  'راکت‌انداز',
  'موشکی',
  'ضدزره',
  'ضدهوایی',
  'مهندسی رزمی',
  'جنگ الکترونیک',
  'شناسایی و اطلاعات',
  'پهپاد',
  'تحرک بالا',
] as const;

export interface UnitFormValue {
  name: string;
  code: string;
  shortName: string;
  echelon: string;
  unitType: string;
  parentResourceId: string;
  parentCode: string;
  parentName: string;
  organizationalAffiliation: string;
  side: string;
  status: string;
  formedOn: string;
  deactivatedOn: string;
  sidc: string;
  province: string;
  garrisonCity: string;
  baseName: string;
  latitude: string;
  longitude: string;
  areaOfOps: string;
  capabilities: string[];
  nominalPersonnelStrength: string;
  defaultReadiness: string;
  notableEquipment: string;
  commanderName: string;
  contact: string;
  description: string;
}

const EMPTY_FORM: UnitFormValue = {
  name: '',
  code: '',
  shortName: '',
  echelon: 'تیپ',
  unitType: 'زرهی',
  parentResourceId: '',
  parentCode: '',
  parentName: '',
  organizationalAffiliation: '',
  side: 'خودی',
  status: 'active',
  formedOn: '',
  deactivatedOn: '',
  sidc: '',
  province: '',
  garrisonCity: '',
  baseName: '',
  latitude: '',
  longitude: '',
  areaOfOps: '',
  capabilities: [],
  nominalPersonnelStrength: '',
  defaultReadiness: '',
  notableEquipment: '',
  commanderName: '',
  contact: '',
  description: '',
};

function text(value: unknown): string {
  return value == null ? '' : String(value);
}

function formFromResource(resource?: ResourceDto | null): UnitFormValue {
  if (!resource) return { ...EMPTY_FORM, capabilities: [] };
  const metadata = resource.metadata || {};
  const homeLocation = (metadata.homeLocation || {}) as Record<string, unknown>;
  return {
    name: resource.name || '',
    code: resource.code || '',
    shortName: text(metadata.shortName),
    echelon: text(metadata.echelon) || 'تیپ',
    unitType: text(metadata.unitType || metadata.branch) || 'زرهی',
    parentResourceId: text(metadata.parentResourceId),
    parentCode: text(metadata.parentCode),
    parentName: text(metadata.parentName),
    organizationalAffiliation: text(metadata.organizationalAffiliation || metadata.affiliation),
    side: text(metadata.side) || 'خودی',
    status: resource.status || 'active',
    formedOn: text(metadata.formedOn),
    deactivatedOn: text(metadata.deactivatedOn),
    sidc: text(metadata.sidc),
    province: text(metadata.province),
    garrisonCity: text(metadata.garrisonCity),
    baseName: text(metadata.baseName),
    latitude: text(homeLocation.latitude ?? metadata.latitude),
    longitude: text(homeLocation.longitude ?? metadata.longitude),
    areaOfOps: text(metadata.areaOfOps),
    capabilities: Array.isArray(metadata.capabilities)
      ? metadata.capabilities.map(item => String(item))
      : [],
    nominalPersonnelStrength: text(metadata.nominalPersonnelStrength),
    defaultReadiness: text(metadata.defaultReadiness),
    notableEquipment: text(metadata.notableEquipment),
    commanderName: text(metadata.commanderName),
    contact: text(metadata.contact),
    description: resource.description || '',
  };
}

interface UnitModalProps {
  open: boolean;
  unit?: ResourceDto | null;
  units: ResourceDto[];
  saving?: boolean;
  onClose: () => void;
  onSave: (value: UnitFormValue, imageChanges: PrimaryImageChanges) => void | Promise<void>;
}

const UnitModal: React.FC<UnitModalProps> = ({ open, unit, units, saving, onClose, onSave }) => {
  const theme = useTheme();
  const accent = getResourcesDialogAccent(theme);
  const [form, setForm] = useState<UnitFormValue>(EMPTY_FORM);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [clearExisting, setClearExisting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const initial = formFromResource(unit);
    if (!initial.parentResourceId && unit?.metadata?.parentCode) {
      initial.parentResourceId = units.find(item => item.code === unit.metadata?.parentCode)?.id || '';
    }
    setForm(initial);
    setSelectedFile(null);
    setClearExisting(false);
  }, [open, unit, units]);

  const parentOptions = useMemo(
    () => units.filter(item => item.id !== unit?.id),
    [unit?.id, units],
  );
  const valid = form.name.trim().length > 0 && form.code.trim().length > 0
    && form.echelon.trim().length > 0 && form.unitType.trim().length > 0;
  const sectionSx = {
    p: { xs: 2, sm: 2.5 },
    borderRadius: 3,
    backgroundColor: theme.palette.mode === 'dark'
      ? alpha(theme.palette.background.paper, 0.78)
      : alpha(theme.palette.common.white, 0.94),
    border: `1px solid ${alpha(accent, 0.16)}`,
    boxShadow: `0 8px 24px ${alpha(accent, 0.07)}`,
  };
  const sectionTitleSx = {
    mb: 2,
    color: accent,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    '&::before': {
      content: '""',
      width: 4,
      height: 22,
      borderRadius: 2,
      backgroundColor: accent,
    },
  };

  function setField<K extends keyof UnitFormValue>(key: K, value: UnitFormValue[K]) {
    setForm(previous => ({ ...previous, [key]: value }));
  }

  function toggleCapability(capability: string) {
    setForm(previous => ({
      ...previous,
      capabilities: previous.capabilities.includes(capability)
        ? previous.capabilities.filter(item => item !== capability)
        : [...previous.capabilities, capability],
    }));
  }

  function fillExample() {
    setForm({
      ...EMPTY_FORM,
      name: 'تیپ ۲۱ امام‌رضا',
      code: 'UNIT-21-ARMORED',
      shortName: 'تیپ ۲۱',
      echelon: 'تیپ',
      unitType: 'زرهی',
      parentName: 'لشکر نمونه شمال‌شرق',
      parentCode: 'DIV-NORTHEAST',
      organizationalAffiliation: 'نیروی زمینی',
      side: 'خودی',
      status: 'active',
      formedOn: '1981-09-22',
      province: 'خراسان رضوی',
      garrisonCity: 'نیشابور',
      baseName: 'پادگان امام‌رضا',
      latitude: '36.214',
      longitude: '58.796',
      areaOfOps: 'استان‌های خراسان',
      capabilities: ['زرهی', 'توپخانه خودکششی', 'راکت‌انداز', 'ضدزره'],
      nominalPersonnelStrength: 'حدود ۳۵۰۰ نفر',
      defaultReadiness: 'بالا',
      notableEquipment: 'تانک اصلی نبرد، هویتزر خودکششی و نفربر مکانیزه',
      commanderName: 'فرمانده نمونه',
      contact: 'دفتر فرماندهی داخلی',
      description: 'نمونهٔ قابل ویرایش برای تکمیل شناسنامه یگان',
    });
  }

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="md"
      sx={buildResourcesFormDialogSx(theme)}
    >
      <DialogTitle sx={resourcesDialogTitleSx(theme)}>
        {unit ? 'ویرایش شناسنامه یگان' : 'افزودن یگان مرجع'}
      </DialogTitle>
      <DialogContent dividers sx={resourcesDialogContentDividersSx(theme)}>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <Paper variant="outlined" sx={sectionSx}>
            <PrimaryImageField
              primaryMediaId={text(unit?.metadata?.primaryMediaId) || undefined}
              selectedFile={selectedFile}
              clearExisting={clearExisting}
              disabled={saving}
              onChange={next => {
                setSelectedFile(next.selectedFile);
                setClearExisting(next.clearExisting);
              }}
            />
          </Paper>

          <Paper variant="outlined" sx={sectionSx}>
            <Typography variant="h6" sx={sectionTitleSx}>هویت و ساختار سازمانی</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth required label="نام یگان" value={form.name} onChange={event => setField('name', event.target.value)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth required label="کد مرجع پایدار" value={form.code} onChange={event => setField('code', event.target.value)} helperText="این کد در عملیات‌های مختلف ثابت می‌ماند." />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="عنوان کوتاه" value={form.shortName} onChange={event => setField('shortName', event.target.value)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>رده سازمانی</InputLabel>
                  <Select label="رده سازمانی" value={form.echelon} onChange={event => setField('echelon', String(event.target.value))}>
                    {UNIT_ECHELONS.map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>رسته یا نوع یگان</InputLabel>
                  <Select label="رسته یا نوع یگان" value={form.unitType} onChange={event => setField('unitType', String(event.target.value))}>
                    {UNIT_TYPES.map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>یگان بالادست</InputLabel>
                  <Select label="یگان بالادست" value={form.parentResourceId} onChange={event => setField('parentResourceId', String(event.target.value))}>
                    <MenuItem value="">بدون یگان بالادست</MenuItem>
                    {parentOptions.map(item => <MenuItem key={item.id} value={item.id}>{item.name} — {item.code}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              {!form.parentResourceId && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="نام یگان بالادست ثبت‌نشده"
                      value={form.parentName}
                      onChange={event => setField('parentName', event.target.value)}
                      helperText="اگر یگان بالادست هنوز در کاتالوگ نیست، نام آن را موقتاً وارد کنید."
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="کد مرجع یگان بالادست ثبت‌نشده"
                      value={form.parentCode}
                      onChange={event => setField('parentCode', event.target.value)}
                    />
                  </Grid>
                </>
              )}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="وابستگی سازمانی"
                  value={form.organizationalAffiliation}
                  onChange={event => setField('organizationalAffiliation', event.target.value)}
                  placeholder="برای نمونه: نیروی زمینی"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>طرف پیش‌فرض</InputLabel>
                  <Select label="طرف پیش‌فرض" value={form.side} onChange={event => setField('side', String(event.target.value))}>
                    {['خودی', 'دشمن', 'خنثی', 'نامشخص'].map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>وضعیت شناسنامه</InputLabel>
                  <Select label="وضعیت شناسنامه" value={form.status} onChange={event => setField('status', String(event.target.value))}>
                    <MenuItem value="active">فعال</MenuItem>
                    <MenuItem value="inactive">غیرفعال</MenuItem>
                    <MenuItem value="historical">تاریخی</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="تاریخ تشکیل"
                  value={form.formedOn}
                  onChange={event => setField('formedOn', event.target.value)}
                  InputLabelProps={{ shrink: true }}
                  helperText="تاریخ استاندارد برای نگهداری در سامانه"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="تاریخ پایان فعالیت"
                  value={form.deactivatedOn}
                  onChange={event => setField('deactivatedOn', event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="کد نماد پیشرفته" value={form.sidc} onChange={event => setField('sidc', event.target.value)} helperText="در صورت خالی بودن، نماد از طرف، رده و نوع یگان ساخته می‌شود." />
              </Grid>
            </Grid>
          </Paper>

          <Paper variant="outlined" sx={sectionSx}>
            <Typography variant="h6" sx={sectionTitleSx}>استقرار و محدوده مسئولیت</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}><TextField fullWidth label="استان" value={form.province} onChange={event => setField('province', event.target.value)} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="شهر استقرار" value={form.garrisonCity} onChange={event => setField('garrisonCity', event.target.value)} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="پادگان یا قرارگاه" value={form.baseName} onChange={event => setField('baseName', event.target.value)} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="عرض جغرافیایی محل اصلی" value={form.latitude} onChange={event => setField('latitude', event.target.value)} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="طول جغرافیایی محل اصلی" value={form.longitude} onChange={event => setField('longitude', event.target.value)} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="محدوده مسئولیت" value={form.areaOfOps} onChange={event => setField('areaOfOps', event.target.value)} /></Grid>
            </Grid>
          </Paper>

          <Paper variant="outlined" sx={sectionSx}>
            <Typography variant="h6" sx={sectionTitleSx}>توانمندی و وضعیت پایه</Typography>
            <Grid
              container
              spacing={1}
              sx={{
                mb: 2.5,
                p: 1.25,
                borderRadius: 2,
                backgroundColor: alpha(accent, 0.045),
                border: `1px dashed ${alpha(accent, 0.2)}`,
              }}
            >
              {UNIT_CAPABILITIES.map(item => (
                <Grid item xs={12} sm={6} md={4} key={item}>
                  <FormControlLabel control={<Checkbox checked={form.capabilities.includes(item)} onChange={() => toggleCapability(item)} />} label={item} />
                </Grid>
              ))}
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}><TextField fullWidth label="استعداد اسمی" value={form.nominalPersonnelStrength} onChange={event => setField('nominalPersonnelStrength', event.target.value)} /></Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>آمادگی پایه</InputLabel>
                  <Select label="آمادگی پایه" value={form.defaultReadiness} onChange={event => setField('defaultReadiness', String(event.target.value))}>
                    <MenuItem value="">ثبت نشده</MenuItem>
                    {['خیلی بالا', 'بالا', 'متوسط', 'پایین'].map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}><TextField fullWidth multiline minRows={2} label="توضیح تجهیزات شاخص" value={form.notableEquipment} onChange={event => setField('notableEquipment', event.target.value)} helperText="برای اتصال واقعی تجهیزات به یگان از بخش تجهیزات استفاده شود." /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="فرمانده فعلی یا پیش‌فرض" value={form.commanderName} onChange={event => setField('commanderName', event.target.value)} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="اطلاعات تماس داخلی" value={form.contact} onChange={event => setField('contact', event.target.value)} /></Grid>
              <Grid item xs={12}><TextField fullWidth multiline minRows={3} label="توضیحات" value={form.description} onChange={event => setField('description', event.target.value)} /></Grid>
            </Grid>
          </Paper>
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{
          ...resourcesDialogActionsSx(theme),
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {!unit && (
            <Button
              variant="outlined"
              onClick={fillExample}
              disabled={saving}
              sx={{ ...resourcesOutlinedCancelButtonSx(theme), minWidth: 130 }}
            >
              پرکردن نمونه
            </Button>
          )}
          <Button
            variant="outlined"
            color="inherit"
            onClick={onClose}
            disabled={saving}
            sx={resourcesOutlinedCancelButtonSx(theme)}
          >
            انصراف
          </Button>
        </Box>
        <Button
          variant="contained"
          disabled={!valid || saving}
          onClick={() => onSave(form, { selectedFile, clearExisting })}
          sx={{ borderRadius: 2, minWidth: 170, px: 3 }}
        >
          ذخیره شناسنامه یگان
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UnitModal;
