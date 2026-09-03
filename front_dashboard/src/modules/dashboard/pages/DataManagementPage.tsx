import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Stack,
  alpha,
  ThemeProvider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  FormControlLabel,
  Switch,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  Psychology as PsychologyIcon,
  TableChart as TableChartIcon,
  AutoFixHigh as AutoFixHighIcon,
  CheckCircle as CheckCircleIcon,
  Inventory2 as InventoryIcon,
  AccountTree as UnitsIcon,
  EventNote as EventsIcon,
  Place as FeaturesIcon,
  Description as FileIcon,
} from '@mui/icons-material';
import { createTheme } from '@mui/material/styles';
import { useAppDispatch, useAppSelector } from '@/store';
import { useNavigate } from 'react-router-dom';
import { fetchScenarios, selectScenarios } from '@/store/slices/scenariosSlice';
import {
  fetchTabItems,
  mergeImportedResources,
  PersonnelItem,
  EquipmentItem,
} from '@/store/slices/tabularResourcesSlice';
import {
  selectTheme,
  showSuccessNotification,
  showWarningNotification,
  showErrorNotification,
} from '@/store/slices/uiSlice';
import { createAppTheme } from '@/theme';
import dataImportApiService, {
  ScenarioExcelPreviewData,
  ScenarioExcelImportData,
  ResourcesImportData,
} from '@/services/api/dataImportApiService';
import { ApiClientError } from '@/services/api/baseApiClient';

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index ? <Box sx={{ p: 3 }}>{children}</Box> : null}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, '&:last-child': { pb: 2 } }}>
        <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
        <Box>
          <Typography variant="h6" fontWeight={800}>{value}</Typography>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

const impactLabels: Record<string, string> = {
  events: 'رویدادها',
  units: 'یگان‌ها',
  equipmentCatalog: 'فهرست تجهیزات سناریو',
  personnelCatalog: 'فهرست پرسنل سناریو',
  features: 'عوارض مکانی',
  storyboardScenes: 'صحنه‌های استوری‌برد',
};

const DataManagementPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const themeState = useAppSelector(selectTheme);
  const scenarios = useAppSelector(selectScenarios);
  const muiTheme = createAppTheme(
    themeState.mode,
    themeState.backgroundTheme,
    themeState.primaryColor,
    themeState.fontSize,
    themeState.highContrast
  );
  const unifiedAccent = muiTheme.palette.primary.main;
  const unifiedSurface = `linear-gradient(135deg, ${alpha(unifiedAccent, 0.07)}, ${alpha(unifiedAccent, 0.04)})`;
  const sectionTheme = useMemo(
    () =>
      createTheme(muiTheme, {
        components: {
          MuiDialog: {
            styleOverrides: {
              paper: {
                background: unifiedSurface,
                border: `1px solid ${alpha(unifiedAccent, 0.24)}`,
                borderRadius: 14,
              },
            },
          },
          MuiDialogTitle: {
            styleOverrides: {
              root: {
                borderBottom: `1px solid ${alpha(unifiedAccent, 0.18)}`,
              },
            },
          },
          MuiDialogActions: {
            styleOverrides: {
              root: {
                borderTop: `1px solid ${alpha(unifiedAccent, 0.18)}`,
              },
            },
          },
        },
      }),
    [muiTheme, unifiedSurface, unifiedAccent]
  );

  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);

  const [scenarioFile, setScenarioFile] = useState<File | null>(null);
  const [scenarioPreview, setScenarioPreview] = useState<ScenarioExcelPreviewData | null>(null);
  const [scenarioResult, setScenarioResult] = useState<ScenarioExcelImportData | null>(null);
  const [targetScenarioId, setTargetScenarioId] = useState('');
  const [mergeMode, setMergeMode] = useState<'merge' | 'replace'>('merge');
  const [importResourcesWithScenario, setImportResourcesWithScenario] = useState(true);

  const [resourcesFile, setResourcesFile] = useState<File | null>(null);
  const [resourcesPreview, setResourcesPreview] = useState<ResourcesImportData | null>(null);
  const [resourcesResult, setResourcesResult] = useState<string | null>(null);

  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const scenarioInputRef = useRef<HTMLInputElement>(null);
  const resourcesInputRef = useRef<HTMLInputElement>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dispatch(fetchScenarios());
    dataImportApiService
      .getAiConfig()
      .then((c) => setAiEnabled(!!c.enabled))
      .catch(() => setAiEnabled(false));
  }, [dispatch]);

  const handleDownloadTemplate = async () => {
    setLoading(true);
    try {
      const blob = await dataImportApiService.downloadExcelTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'scenario_import_template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      dispatch(showSuccessNotification('قالب اکسل دانلود شد'));
    } catch (e) {
      dispatch(showErrorNotification(e instanceof Error ? e.message : 'خطا در دانلود قالب'));
    } finally {
      setLoading(false);
    }
  };

  const runScenarioPreview = async (
    file: File,
    destination = targetScenarioId,
    mode = mergeMode,
  ) => {
    setLoading(true);
    setScenarioPreview(null);
    setScenarioResult(null);
    try {
      const data = await dataImportApiService.previewScenarioExcel(file, {
        targetScenarioId: destination || undefined,
        mergeMode: mode,
      });
      setScenarioPreview(data);
    } catch (e) {
      dispatch(showErrorNotification(e instanceof Error ? e.message : 'خطا در پیش‌نمایش'));
    } finally {
      setLoading(false);
    }
  };

  const handleScenarioImport = async () => {
    if (!scenarioFile) return;
    setLoading(true);
    try {
      const result = await dataImportApiService.importScenarioExcel(scenarioFile, {
        targetScenarioId: targetScenarioId || undefined,
        mergeMode,
        importResources: importResourcesWithScenario,
      });
      await dispatch(fetchScenarios()).unwrap();
      const resourceImport = result.resourceImport;
      if (resourceImport?.persisted && (resourceImport.personnelRows || resourceImport.equipmentRows)) {
        await Promise.all([
          dispatch(fetchTabItems({ tabType: 'personnel', filters: {} })),
          dispatch(fetchTabItems({ tabType: 'equipment', filters: {} })),
        ]);
      }
      const updated = result.importAction === 'updated';
      setScenarioResult(result);
      if (resourceImport?.errors?.length) {
        dispatch(
          showWarningNotification(
            `سناریو ذخیره شد، اما منابع با ${resourceImport.errors.length} هشدار پردازش شدند`,
          ),
        );
      } else {
        const resourceSummary = resourceImport?.persisted
          ? `؛ ${resourceImport.personnelRows} پرسنل، ${resourceImport.equipmentRows} ردیف تجهیز و ${resourceImport.unitRows ?? 0} یگان نیز ثبت شد`
          : '';
        dispatch(
          showSuccessNotification(
            `${updated ? 'سناریوی انتخاب‌شده از اکسل تکمیل شد' : 'سناریو از اکسل ایجاد شد'}${resourceSummary}`,
          ),
        );
      }
    } catch (e) {
      const msg =
        e instanceof ApiClientError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'خطا در ایجاد سناریو';
      dispatch(showErrorNotification(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleResourcesImport = async () => {
    if (!resourcesFile) return;
    setLoading(true);
    setResourcesResult(null);
    try {
      const data = resourcesPreview || await dataImportApiService.importResourcesExcel(resourcesFile);
      await dispatch(
        mergeImportedResources({
          personnel: data.personnel as unknown as PersonnelItem[],
          equipment: data.equipment as unknown as EquipmentItem[],
          units: data.units,
        })
      ).unwrap();
      await dispatch(fetchTabItems({ tabType: 'personnel', filters: {} }));
      await dispatch(fetchTabItems({ tabType: 'equipment', filters: {} }));
      const errPart =
        data.errors?.length > 0 ? ` (${data.errors.length} هشدار از سمت سرور)` : '';
      const equipmentQuantity = data.equipment.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0,
      );
      setResourcesResult(
        `${data.units.length} یگان، ${data.personnel.length} پرسنل و ${data.equipment.length} ردیف تجهیز با مجموع ${equipmentQuantity} به منابع اضافه شد.${errPart}`
      );
      dispatch(showSuccessNotification('منابع به‌روزرسانی شد'));
      setResourcesFile(null);
      setResourcesPreview(null);
      if (resourcesInputRef.current) resourcesInputRef.current.value = '';
    } catch (e) {
      dispatch(showErrorNotification(e instanceof Error ? e.message : 'خطا در ایمپورت منابع'));
    } finally {
      setLoading(false);
    }
  };

  const handleAiSuggest = async () => {
    if (!aiFile) return;
    setLoading(true);
    setAiResult(null);
    try {
      const res = await dataImportApiService.suggestMappingWithAi(aiFile);
      setAiResult(JSON.stringify(res, null, 2));
      dispatch(showSuccessNotification('پیشنهاد نگاشت دریافت شد'));
    } catch (e) {
      dispatch(showErrorNotification(e instanceof Error ? e.message : 'خطا در سرویس AI'));
    } finally {
      setLoading(false);
    }
  };

  const handleAiContinueUnified = async () => {
    if (!aiFile) return;
    setLoading(true);
    setAiResult(null);
    try {
      const blob = await dataImportApiService.downloadStandardizedExcel(aiFile);
      const standardizedFile = new File([blob], 'standardized_scenario.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      setScenarioFile(standardizedFile);
      setScenarioResult(null);
      setTab(0);
      await runScenarioPreview(standardizedFile, targetScenarioId, mergeMode);
      dispatch(showSuccessNotification('فایل استاندارد شد؛ پیش‌نمایش یکپارچه آماده بررسی است'));
    } catch (e) {
      const msg =
        e instanceof ApiClientError ? e.message : e instanceof Error ? e.message : 'خطا در استانداردسازی فایل';
      dispatch(showErrorNotification(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadStandardized = async () => {
    if (!aiFile) return;
    setLoading(true);
    try {
      const blob = await dataImportApiService.downloadStandardizedExcel(aiFile);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'standardized_scenario.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      dispatch(showSuccessNotification('فایل اکسل استاندارد دانلود شد'));
    } catch (e) {
      dispatch(showErrorNotification(e instanceof Error ? e.message : 'خطا در ساخت فایل استاندارد'));
    } finally {
      setLoading(false);
    }
  };

  const onScenarioFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      setScenarioFile(f || null);
      setScenarioPreview(null);
      setScenarioResult(null);
      if (f) runScenarioPreview(f);
    },
    [dispatch]
  );

  const resetUnifiedImport = () => {
    setScenarioFile(null);
    setScenarioPreview(null);
    setScenarioResult(null);
    setTargetScenarioId('');
    setMergeMode('merge');
    if (scenarioInputRef.current) scenarioInputRef.current.value = '';
  };

  const runResourcesPreview = async (file: File) => {
    setLoading(true);
    setResourcesPreview(null);
    try {
      const data = await dataImportApiService.importResourcesExcel(file);
      setResourcesPreview(data);
    } catch (e) {
      dispatch(showErrorNotification(e instanceof Error ? e.message : 'خطا در بررسی فایل منابع'));
    } finally {
      setLoading(false);
    }
  };

  const unifiedStep = scenarioResult ? 3 : scenarioPreview ? 2 : scenarioFile ? 1 : 0;

  return (
    <ThemeProvider theme={sectionTheme}>
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          p: 3,
          '& .MuiCard-root': {
            background: unifiedSurface,
            border: `1px solid ${alpha(unifiedAccent, 0.22)}`,
            boxShadow: 'none',
          },
          '& .MuiPaper-root': {
            borderColor: alpha(unifiedAccent, 0.22),
          },
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 700,
            background: `linear-gradient(135deg, ${alpha(unifiedAccent, 0.95)} 0%, ${alpha(
              unifiedAccent,
              0.7
            )} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 3,
          }}
        >
          مدیریت داده
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          سناریو، یگان‌ها، تجهیزات و پرسنل را با یک فایل اکسل بررسی و ثبت کنید. مسیر جداگانه نیز برای فایل‌های
          منابع یا فایل‌های ناهمگون در دسترس است.
        </Typography>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Paper
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            background: unifiedSurface,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(unifiedAccent, 0.24)}`,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              borderBottom: 1,
              borderColor: alpha(unifiedAccent, 0.2),
              background: alpha(unifiedAccent, 0.06),
            }}
          >
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                  backgroundColor: unifiedAccent,
                },
                '& .MuiTab-root': {
                  minHeight: 64,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                  '&.Mui-selected': {
                    fontWeight: 700,
                    color: unifiedAccent,
                  },
                },
              }}
            >
              <Tab
                icon={<CloudUploadIcon />}
                iconPosition="start"
                label="ورود یکپارچه"
                sx={{ '&:hover': { background: alpha(unifiedAccent, 0.08) } }}
              />
              <Tab
                icon={<TableChartIcon />}
                iconPosition="start"
                label="ورود مستقل منابع"
                sx={{ '&:hover': { background: alpha(unifiedAccent, 0.08) } }}
              />
              <Tab
                icon={<PsychologyIcon />}
                iconPosition="start"
                label="فایل ناهمگون"
                sx={{ '&:hover': { background: alpha(unifiedAccent, 0.08) } }}
              />
            </Tabs>
          </Box>

          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <TabPanel value={tab} index={0}>
              <Stack spacing={3}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ sm: 'center' }}
                  spacing={1.5}
                >
                  <Box>
                    <Typography variant="h6" fontWeight={800}>ورود یکپارچه سناریو و منابع</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      یک فایل استاندارد، سناریو، یگان‌ها، تجهیزات و پرسنل را در یک عملیات هماهنگ ثبت می‌کند.
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadTemplate}
                    disabled={loading}
                    sx={{ flexShrink: 0 }}
                  >
                    دانلود قالب استاندارد
                  </Button>
                </Stack>

                <Stepper activeStep={unifiedStep} alternativeLabel sx={{ px: { xs: 0, md: 4 } }}>
                  {['انتخاب فایل', 'بررسی محتوا', 'مقصد و تأیید', 'گزارش نتیجه'].map((label) => (
                    <Step key={label}><StepLabel>{label}</StepLabel></Step>
                  ))}
                </Stepper>

                <input
                  ref={scenarioInputRef}
                  type="file"
                  accept=".xlsx,.xlsm"
                  hidden
                  onChange={onScenarioFile}
                />

                {!scenarioResult && (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      borderStyle: 'dashed',
                      borderWidth: 2,
                      bgcolor: alpha(unifiedAccent, 0.035),
                    }}
                  >
                    <FileIcon color="primary" sx={{ fontSize: 42, mb: 1 }} />
                    <Typography fontWeight={700}>
                      {scenarioFile ? scenarioFile.name : 'فایل اکسل استاندارد را انتخاب کنید'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                      قالب‌های مجاز شامل فایل‌های اکسل معمولی و اکسل دارای ماکرو تا حجم ۲۵ مگابایت هستند.
                    </Typography>
                    <Button variant="outlined" startIcon={<CloudUploadIcon />} onClick={() => scenarioInputRef.current?.click()}>
                      {scenarioFile ? 'انتخاب فایل دیگر' : 'انتخاب فایل اکسل'}
                    </Button>
                  </Paper>
                )}

                {scenarioPreview && !scenarioResult && (
                  <>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>محتوای شناسایی‌شده</Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                        <SummaryCard label="رویداد" value={scenarioPreview.preview?.eventsCount ?? 0} icon={<EventsIcon />} />
                        <SummaryCard label="یگان مرجع" value={scenarioPreview.preview?.resourceUnitRowsCount ?? 0} icon={<UnitsIcon />} />
                        <SummaryCard label="ردیف تجهیز" value={scenarioPreview.preview?.resourceEquipmentRowsCount ?? 0} icon={<InventoryIcon />} />
                        <SummaryCard label="پرسنل" value={scenarioPreview.preview?.resourcePersonnelRowsCount ?? 0} icon={<TableChartIcon />} />
                        <SummaryCard label="عارضه مکانی" value={scenarioPreview.preview?.featuresCount ?? 0} icon={<FeaturesIcon />} />
                        <SummaryCard label="طرف عملیات" value={scenarioPreview.preview?.sidesCount ?? 0} icon={<UnitsIcon />} />
                        <SummaryCard label="صحنه استوری‌برد" value={scenarioPreview.preview?.storyboardScenesCount ?? 0} icon={<EventsIcon />} />
                        <SummaryCard label="مجموع تجهیزات" value={scenarioPreview.preview?.equipmentQuantityTotal ?? 0} icon={<InventoryIcon />} />
                      </Box>
                    </Box>

                    <Paper variant="outlined" sx={{ p: 2.5 }}>
                      <Typography variant="subtitle1" fontWeight={800}>مقصد و روش اعمال</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        سناریو و منابع در یک تراکنش ذخیره می‌شوند؛ در صورت شکست ذخیره‌سازی، هیچ‌کدام به‌تنهایی ثبت نخواهد شد.
                      </Typography>
                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <FormControl fullWidth>
                          <InputLabel id="target-scenario-label">سناریوی مقصد</InputLabel>
                          <Select
                            labelId="target-scenario-label"
                            value={targetScenarioId}
                            label="سناریوی مقصد"
                            onChange={(event) => {
                              const destination = event.target.value;
                              setTargetScenarioId(destination);
                              if (scenarioFile) runScenarioPreview(scenarioFile, destination, mergeMode);
                            }}
                          >
                            <MenuItem value="">ساخت سناریوی تازه</MenuItem>
                            {scenarios.map((scenario) => (
                              <MenuItem key={scenario.id} value={scenario.id}>{scenario.name}</MenuItem>
                            ))}
                          </Select>
                          <FormHelperText>برای تکمیل عملیات قبلی، سناریوی موجود را انتخاب کنید.</FormHelperText>
                        </FormControl>
                        <FormControl fullWidth disabled={!targetScenarioId}>
                          <InputLabel id="merge-mode-label">روش اعمال داده</InputLabel>
                          <Select
                            labelId="merge-mode-label"
                            value={mergeMode}
                            label="روش اعمال داده"
                            onChange={(event) => {
                              const mode = event.target.value as 'merge' | 'replace';
                              setMergeMode(mode);
                              if (scenarioFile) runScenarioPreview(scenarioFile, targetScenarioId, mode);
                            }}
                          >
                            <MenuItem value="merge">افزودن و به‌روزرسانی بدون حذف</MenuItem>
                            <MenuItem value="replace">جایگزینی کامل محتوای سناریو</MenuItem>
                          </Select>
                          <FormHelperText>
                            {mergeMode === 'replace' ? 'محتوای فعلی سناریوی مقصد جایگزین می‌شود.' : 'داده‌های غایب از فایل حفظ می‌شوند.'}
                          </FormHelperText>
                        </FormControl>
                      </Stack>
                      <FormControlLabel
                        sx={{ mt: 1.5 }}
                        control={<Switch checked={importResourcesWithScenario} onChange={(event) => setImportResourcesWithScenario(event.target.checked)} />}
                        label="یگان‌ها، تجهیزات و پرسنل هم‌زمان در مدیریت منابع ثبت شوند"
                      />
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 2.5 }}>
                      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={800}>اثر این ورود</Typography>
                          <Typography variant="body2" color="text.secondary">
                            محاسبه بر اساس شناسه‌های پایدار فایل و محتوای فعلی سناریوی مقصد انجام شده است.
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Chip color="success" label={`${scenarioPreview.impact.totals.added} مورد جدید`} />
                          <Chip color="primary" variant="outlined" label={`${scenarioPreview.impact.totals.updated} مورد به‌روزشونده`} />
                          {scenarioPreview.impact.totals.preserved > 0 && (
                            <Chip variant="outlined" label={`${scenarioPreview.impact.totals.preserved} مورد حفظ‌شونده`} />
                          )}
                          {scenarioPreview.impact.totals.removed > 0 && (
                            <Chip color="warning" label={`${scenarioPreview.impact.totals.removed} مورد حذف‌شونده`} />
                          )}
                        </Stack>
                      </Stack>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 1 }}>
                        {Object.entries(scenarioPreview.impact.collections).map(([key, item]) => (
                          <Box
                            key={key}
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: 'minmax(140px, 1fr) repeat(4, auto)',
                              alignItems: 'center',
                              gap: 1,
                              p: 1.25,
                              border: 1,
                              borderColor: 'divider',
                              borderRadius: 2,
                            }}
                          >
                            <Typography variant="body2" fontWeight={700}>{impactLabels[key] || key}</Typography>
                            <Typography variant="caption" color="success.main">جدید: {item.added}</Typography>
                            <Typography variant="caption" color="primary.main">تغییر: {item.updated}</Typography>
                            <Typography variant="caption" color={item.removed ? 'warning.main' : 'text.secondary'}>حذف: {item.removed}</Typography>
                            <Typography variant="caption" fontWeight={700}>نتیجه: {item.result}</Typography>
                          </Box>
                        ))}
                      </Box>
                      {importResourcesWithScenario && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          در مدیریت منابع، حدود {scenarioPreview.impact.resources.created} رکورد ایجاد و {scenarioPreview.impact.resources.updated} رکورد بر اساس نوع و کد پایدار به‌روزرسانی می‌شود.
                        </Alert>
                      )}
                    </Paper>

                    {scenarioPreview.errors?.length > 0 && (
                      <Alert severity="error">
                        <Typography variant="subtitle2">خطاهای سناریو</Typography>
                        <List dense disablePadding>
                          {scenarioPreview.errors.slice(0, 40).map((err, i) => (
                            <ListItem key={i} disableGutters><ListItemText primary={`${err.sheet}، ردیف ${err.row}`} secondary={err.message} /></ListItem>
                          ))}
                        </List>
                      </Alert>
                    )}
                    {scenarioPreview.resourceErrors?.length > 0 && (
                      <Alert severity="warning">
                        <Typography variant="subtitle2">هشدارهای منابع</Typography>
                        <List dense disablePadding>
                          {scenarioPreview.resourceErrors.slice(0, 40).map((err, i) => (
                            <ListItem key={i} disableGutters><ListItemText primary={`${err.sheet}، ردیف ${err.row}`} secondary={err.message} /></ListItem>
                          ))}
                        </List>
                      </Alert>
                    )}
                    {scenarioPreview.valid && !scenarioPreview.resourceErrors?.length && (
                      <Alert severity="success">سناریو و منابع فایل برای ذخیره آماده‌اند.</Alert>
                    )}
                    {targetScenarioId && mergeMode === 'replace' && (
                      <Alert severity="warning">با تأیید، محتوای سناریوی مقصد با محتوای این فایل جایگزین می‌شود.</Alert>
                    )}

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="flex-end">
                      <Button variant="text" onClick={resetUnifiedImport}>لغو و شروع دوباره</Button>
                      <Button
                        variant="contained"
                        size="large"
                        disabled={!scenarioPreview.valid || loading}
                        onClick={handleScenarioImport}
                      >
                        {importResourcesWithScenario
                          ? targetScenarioId
                            ? 'تأیید و تکمیل سناریو و منابع'
                            : 'تأیید و ایجاد سناریو و منابع'
                          : targetScenarioId
                            ? 'تأیید و تکمیل سناریو'
                            : 'تأیید و ایجاد سناریو'}
                      </Button>
                    </Stack>
                  </>
                )}

                {scenarioResult && (
                  <Paper variant="outlined" sx={{ p: 3 }}>
                    <Stack spacing={2} alignItems="center" textAlign="center">
                      <CheckCircleIcon color="success" sx={{ fontSize: 54 }} />
                      <Box>
                        <Typography variant="h6" fontWeight={800}>
                          {scenarioResult.resourceImport?.persisted
                            ? scenarioResult.importAction === 'updated'
                              ? 'سناریو و منابع به‌روزرسانی شدند'
                              : 'سناریو و منابع ایجاد شدند'
                            : scenarioResult.importAction === 'updated'
                              ? 'سناریو به‌روزرسانی شد'
                              : 'سناریو ایجاد شد'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">عملیات یکپارچه با موفقیت پایان یافت.</Typography>
                      </Box>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 1.5, width: '100%' }}>
                        <SummaryCard label="یگان" value={scenarioResult.resourceImport?.unitRows ?? 0} icon={<UnitsIcon />} />
                        <SummaryCard label="پرسنل" value={scenarioResult.resourceImport?.personnelRows ?? 0} icon={<TableChartIcon />} />
                        <SummaryCard label="ردیف تجهیز" value={scenarioResult.resourceImport?.equipmentRows ?? 0} icon={<InventoryIcon />} />
                        <SummaryCard label="ایجادشده" value={scenarioResult.resourceImport?.created ?? 0} icon={<CheckCircleIcon />} />
                        <SummaryCard label="به‌روزشده" value={scenarioResult.resourceImport?.updated ?? 0} icon={<AutoFixHighIcon />} />
                      </Box>
                      {(scenarioResult.resourceImport?.errors?.length ?? 0) > 0 && (
                        <Alert severity="warning" sx={{ width: '100%', textAlign: 'right' }}>
                          ورود با {scenarioResult.resourceImport?.errors.length} هشدار منابع پایان یافت.
                        </Alert>
                      )}
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                        <Button variant="contained" onClick={() => navigate('/dashboard/scenarios')}>مشاهده سناریوها</Button>
                        <Button variant="outlined" onClick={() => navigate('/dashboard/resources')}>مشاهده مدیریت منابع</Button>
                        <Button variant="text" onClick={resetUnifiedImport}>ورود فایل دیگر</Button>
                      </Stack>
                    </Stack>
                  </Paper>
                )}
              </Stack>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <Alert severity="info" sx={{ mb: 2 }}>
              این مسیر برای تکمیل کاتالوگ مرکزی، بدون ساخت یا تغییر سناریو است. یگان‌ها، تجهیزات و پرسنل ثبت‌شده بعداً از داخل کالک‌نگار قابل انتخاب و اتصال به عملیات‌ها هستند.
            </Alert>
            <input
              ref={resourcesInputRef}
              type="file"
              accept=".xlsx,.xlsm"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                setResourcesFile(f || null);
                setResourcesPreview(null);
                setResourcesResult(null);
                if (f) runResourcesPreview(f);
              }}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
              <Button variant="outlined" onClick={() => resourcesInputRef.current?.click()}>
                انتخاب فایل اکسل یگان‌ها، تجهیزات و پرسنل
              </Button>
            </Stack>
            {resourcesFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {resourcesFile.name}
              </Typography>
            )}
            {resourcesResult && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {resourcesResult}
              </Alert>
            )}
            {resourcesPreview && resourcesFile && (
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(5, 1fr)' }, gap: 1.5 }}>
                  <SummaryCard label="یگان فایل" value={resourcesPreview.units.length} icon={<UnitsIcon />} />
                  <SummaryCard label="پرسنل فایل" value={resourcesPreview.personnel.length} icon={<TableChartIcon />} />
                  <SummaryCard label="ردیف تجهیز" value={resourcesPreview.equipment.length} icon={<InventoryIcon />} />
                  <SummaryCard label="رکورد جدید" value={resourcesPreview.impact.created} icon={<CheckCircleIcon />} />
                  <SummaryCard label="رکورد به‌روزشونده" value={resourcesPreview.impact.updated} icon={<AutoFixHighIcon />} />
                </Box>
                {resourcesPreview.errors.length > 0 && (
                  <Alert severity="warning">
                    <Typography variant="subtitle2">هشدارهای فایل منابع</Typography>
                    <List dense disablePadding>
                      {resourcesPreview.errors.slice(0, 40).map((err, index) => (
                        <ListItem key={index} disableGutters>
                          <ListItemText primary={`${err.sheet}، ردیف ${err.row}`} secondary={err.message} />
                        </ListItem>
                      ))}
                    </List>
                  </Alert>
                )}
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" spacing={1.5}>
                  <Button
                    variant="text"
                    onClick={() => {
                      setResourcesFile(null);
                      setResourcesPreview(null);
                      if (resourcesInputRef.current) resourcesInputRef.current.value = '';
                    }}
                  >
                    لغو
                  </Button>
                  <Button variant="contained" disabled={loading} onClick={handleResourcesImport}>
                    تأیید و ثبت در مدیریت منابع
                  </Button>
                </Stack>
              </Stack>
            )}
            <Typography variant="caption" display="block" sx={{ mt: 2 }} color="text.secondary">
              داده‌ها پس از بررسی با شناسه پایدار در کاتالوگ مرکزی ثبت می‌شوند. این مسیر به‌تنهایی هیچ سناریویی را تغییر نمی‌دهد.
            </Typography>
          </TabPanel>

          <TabPanel value={tab} index={2}>
            {!aiEnabled ? (
              <Alert severity="info">
                سرویس هوش مصنوعی فعال نیست. متغیر محیطی <code>INTERNAL_LLM_BASE_URL</code> را در بخش سرور تنظیم کنید
                (API سازگار با OpenAI <code>/v1/chat/completions</code>).
              </Alert>
            ) : (
              <>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  فایل اکسل ناهمگون را بارگذاری کنید. هوش مصنوعی ستون‌ها و برگه‌ها را
                  شناسایی کرده، داده را استانداردسازی می‌کند و سناریو را در سیستم ذخیره می‌کند.
                </Typography>

                <input
                  ref={aiInputRef}
                  type="file"
                  accept=".xlsx,.xlsm"
                  hidden
                  onChange={(e) => {
                    setAiFile(e.target.files?.[0] || null);
                    setAiResult(null);
                  }}
                />
                <Button variant="outlined" startIcon={<CloudUploadIcon />} onClick={() => aiInputRef.current?.click()}>
                  انتخاب فایل اکسل ناهمگون
                </Button>
                {aiFile && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {aiFile.name}
                  </Typography>
                )}

                <Divider sx={{ my: 2 }} />

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button
                    variant="contained"
                    startIcon={<AutoFixHighIcon />}
                    disabled={!aiFile || loading}
                    onClick={handleAiContinueUnified}
                  >
                    استانداردسازی و ادامه در ورود یکپارچه
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    disabled={!aiFile || loading}
                    onClick={handleDownloadStandardized}
                  >
                    دانلود اکسل استاندارد‌شده
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    disabled={!aiFile || loading}
                    onClick={handleAiSuggest}
                  >
                    فقط پیشنهاد مپینگ (JSON)
                  </Button>
                </Stack>

                {/* نتیجه پیشنهاد مپینگ JSON */}
                {aiResult && (
                  <Paper
                    variant="outlined"
                    sx={{
                      mt: 2,
                      p: 2,
                      maxHeight: 360,
                      overflow: 'auto',
                      bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                      پیشنهاد نگاشت هوش مصنوعی:
                    </Typography>
                    <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap' }}>{aiResult}</pre>
                  </Paper>
                )}
              </>
            )}
          </TabPanel>
        </Box>
      </Paper>
      </Box>
    </ThemeProvider>
  );
};

export default DataManagementPage;
