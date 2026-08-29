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
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  Psychology as PsychologyIcon,
  TableChart as TableChartIcon,
  AutoFixHigh as AutoFixHighIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
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
import { selectTheme, showSuccessNotification, showErrorNotification } from '@/store/slices/uiSlice';
import { createAppTheme } from '@/theme';
import dataImportApiService, {
  ScenarioExcelPreviewData,
  AiAutoImportResult,
} from '@/services/api/dataImportApiService';
import { ApiClientError } from '@/services/api/baseApiClient';

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index ? <Box sx={{ p: 3 }}>{children}</Box> : null}
    </div>
  );
}

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
  const [targetScenarioId, setTargetScenarioId] = useState('');
  const [mergeMode, setMergeMode] = useState<'merge' | 'replace'>('merge');

  const [resourcesFile, setResourcesFile] = useState<File | null>(null);
  const [resourcesResult, setResourcesResult] = useState<string | null>(null);

  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiAutoResult, setAiAutoResult] = useState<AiAutoImportResult | null>(null);

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

  const runScenarioPreview = async (file: File) => {
    setLoading(true);
    setScenarioPreview(null);
    try {
      const data = await dataImportApiService.previewScenarioExcel(file);
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
      });
      await dispatch(fetchScenarios()).unwrap();
      const updated = result.importAction === 'updated';
      dispatch(showSuccessNotification(updated ? 'سناریوی انتخاب‌شده از اکسل تکمیل شد' : 'سناریو از اکسل ایجاد شد'));
      setScenarioFile(null);
      setScenarioPreview(null);
      if (scenarioInputRef.current) scenarioInputRef.current.value = '';
      navigate('/dashboard/scenarios');
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
      const data = await dataImportApiService.importResourcesExcel(resourcesFile);
      await dispatch(
        mergeImportedResources({
          personnel: data.personnel as unknown as PersonnelItem[],
          equipment: data.equipment as unknown as EquipmentItem[],
        })
      ).unwrap();
      await dispatch(fetchTabItems({ tabType: 'personnel', filters: {} }));
      await dispatch(fetchTabItems({ tabType: 'equipment', filters: {} }));
      const errPart =
        data.errors?.length > 0 ? ` (${data.errors.length} هشدار از سمت سرور)` : '';
      setResourcesResult(
        `${data.personnel.length} پرسنل و ${data.equipment.length} تجهیز به منابع اضافه شد.${errPart}`
      );
      dispatch(showSuccessNotification('منابع به‌روزرسانی شد'));
      setResourcesFile(null);
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

  const handleAiAutoImport = async () => {
    if (!aiFile) return;
    setLoading(true);
    setAiAutoResult(null);
    setAiResult(null);
    try {
      const res = await dataImportApiService.autoImportWithAi(aiFile);
      setAiAutoResult(res);
      await dispatch(fetchScenarios()).unwrap();
      dispatch(showSuccessNotification(`سناریو «${res.name}» با موفقیت ایجاد شد`));
    } catch (e) {
      const msg =
        e instanceof ApiClientError ? e.message : e instanceof Error ? e.message : 'خطا در ایمپورت خودکار AI';
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
      if (f) runScenarioPreview(f);
    },
    [dispatch]
  );

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
          ایمپورت سناریو و منابع از اکسل؛ پیش‌نمایش قبل از ذخیره؛ یا بارگذاری هر اکسل ناهمگون و استانداردسازی خودکار
          با کمک AI.
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
                label="ایمپورت سناریو"
                sx={{ '&:hover': { background: alpha(unifiedAccent, 0.08) } }}
              />
              <Tab
                icon={<TableChartIcon />}
                iconPosition="start"
                label="ایمپورت منابع"
                sx={{ '&:hover': { background: alpha(unifiedAccent, 0.08) } }}
              />
              <Tab
                icon={<DownloadIcon />}
                iconPosition="start"
                label="دانلود قالب"
                sx={{ '&:hover': { background: alpha(unifiedAccent, 0.08) } }}
              />
              <Tab
                icon={<PsychologyIcon />}
                iconPosition="start"
                label="کمک AI"
                sx={{ '&:hover': { background: alpha(unifiedAccent, 0.08) } }}
              />
            </Tabs>
          </Box>

          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <TabPanel value={tab} index={0}>
            <input
              ref={scenarioInputRef}
              type="file"
              accept=".xlsx,.xlsm"
              hidden
              onChange={onScenarioFile}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
              <Button variant="outlined" onClick={() => scenarioInputRef.current?.click()}>
                انتخاب فایل اکسل
              </Button>
            </Stack>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2, maxWidth: 900 }}>
              <FormControl fullWidth>
                <InputLabel id="target-scenario-label">سناریوی مقصد</InputLabel>
                <Select
                  labelId="target-scenario-label"
                  value={targetScenarioId}
                  label="سناریوی مقصد"
                  onChange={(event) => setTargetScenarioId(event.target.value)}
                >
                  <MenuItem value="">ساخت سناریوی تازه</MenuItem>
                  {scenarios.map((scenario) => (
                    <MenuItem key={scenario.id} value={scenario.id}>
                      {scenario.name}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>برای تکمیل یک سناریوی موجود، آن را از این فهرست انتخاب کنید.</FormHelperText>
              </FormControl>
              <FormControl fullWidth disabled={!targetScenarioId}>
                <InputLabel id="merge-mode-label">روش اعمال داده</InputLabel>
                <Select
                  labelId="merge-mode-label"
                  value={mergeMode}
                  label="روش اعمال داده"
                  onChange={(event) => setMergeMode(event.target.value as 'merge' | 'replace')}
                >
                  <MenuItem value="merge">افزودن و به‌روزرسانی بدون حذف</MenuItem>
                  <MenuItem value="replace">جایگزینی کامل محتوای سناریو</MenuItem>
                </Select>
                <FormHelperText>روش پیش‌فرض، داده‌های غایب از فایل را نگه می‌دارد.</FormHelperText>
              </FormControl>
            </Stack>
            {scenarioFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                فایل: {scenarioFile.name}
              </Typography>
            )}
            {scenarioPreview && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" fontWeight={600}>
                  پیش‌نمایش
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="نام" secondary={scenarioPreview.preview?.name || '—'} />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="تعداد رویداد / طرف‌ها / تجهیز / پرسنل / عارضه"
                      secondary={`${scenarioPreview.preview?.eventsCount ?? 0} / ${scenarioPreview.preview?.sidesCount ?? 0} / ${scenarioPreview.preview?.equipmentCount ?? 0} / ${scenarioPreview.preview?.personnelCount ?? 0} / ${scenarioPreview.preview?.featuresCount ?? 0}`}
                    />
                  </ListItem>
                </List>
                {scenarioPreview.errors?.length > 0 && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    <Typography variant="subtitle2">خطاها و هشدارها</Typography>
                    <List dense>
                      {scenarioPreview.errors.slice(0, 40).map((err, i) => (
                        <ListItem key={i}>
                          <ListItemText
                            primary={`${err.sheet} — ردیف ${err.row}`}
                            secondary={err.message}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Alert>
                )}
                {scenarioPreview.valid && (
                  <Alert severity="success" sx={{ mt: 1 }}>
                    فایل برای ذخیره معتبر است.
                  </Alert>
                )}
                <Button
                  variant="contained"
                  sx={{ mt: 2 }}
                  disabled={!scenarioPreview.valid || loading}
                  onClick={handleScenarioImport}
                >
                  {targetScenarioId ? 'تأیید و تکمیل سناریوی انتخاب‌شده' : 'تأیید و ایجاد سناریو'}
                </Button>
              </>
            )}
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <input
              ref={resourcesInputRef}
              type="file"
              accept=".xlsx,.xlsm"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                setResourcesFile(f || null);
                setResourcesResult(null);
              }}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
              <Button variant="outlined" onClick={() => resourcesInputRef.current?.click()}>
                انتخاب فایل اکسل (شیت‌های تجهیزات و پرسنل)
              </Button>
              <Button variant="contained" disabled={!resourcesFile || loading} onClick={handleResourcesImport}>
                وارد کردن به مدیریت منابع
              </Button>
            </Stack>
            {resourcesFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {resourcesFile.name}
              </Typography>
            )}
            {resourcesResult && (
              <Alert severity="info" sx={{ mt: 2 }}>
                {resourcesResult}
              </Alert>
            )}
            <Typography variant="caption" display="block" sx={{ mt: 2 }} color="text.secondary">
              داده‌ها در حافظهٔ محلی مرورگر (همان منبع تب‌های پرسنل و تجهیزات) ادغام می‌شوند.
            </Typography>
          </TabPanel>

          <TabPanel value={tab} index={2}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              قالب شامل شیت‌های سناریو، حوادث، یگان‌ها، تجهیزات، پرسنل و عوارض است و برای هر بخش یک ردیف نمونه دارد.
              جزئیات ستون‌ها در فایل{' '}
              <code>docs/EXCEL_IMPORT.md</code> در ریپو.
            </Typography>
            <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleDownloadTemplate} disabled={loading}>
              دانلود قالب اکسل
            </Button>
          </TabPanel>

          <TabPanel value={tab} index={3}>
            {!aiEnabled ? (
              <Alert severity="info">
                سرویس AI فعال نیست. متغیر محیطی <code>INTERNAL_LLM_BASE_URL</code> را در بک‌اند تنظیم کنید
                (API سازگار با OpenAI <code>/v1/chat/completions</code>).
              </Alert>
            ) : (
              <>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  فایل اکسل ناهمگون (غیراستاندارد) را بارگذاری کنید — AI به‌صورت خودکار ستون‌ها و شیت‌ها را
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
                    setAiAutoResult(null);
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
                    onClick={handleAiAutoImport}
                  >
                    ایمپورت خودکار (ذخیره در سیستم)
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

                {/* نتیجه ایمپورت خودکار */}
                {aiAutoResult && (
                  <Box sx={{ mt: 3 }}>
                    <Alert
                      severity="success"
                      icon={<CheckCircleIcon />}
                      action={
                        <Button size="small" onClick={() => navigate('/dashboard/scenarios')}>
                          رفتن به سناریوها
                        </Button>
                      }
                    >
                      سناریو «{aiAutoResult.name}» ایجاد شد (ID: {aiAutoResult.id})
                    </Alert>

                    {aiAutoResult.aiImportMeta?.warnings?.length > 0 && (
                      <Alert severity="warning" icon={<WarningIcon />} sx={{ mt: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          هشدارهای مپینگ:
                        </Typography>
                        <List dense disablePadding>
                          {aiAutoResult.aiImportMeta.warnings.map((w, i) => (
                            <ListItem key={i} disableGutters>
                              <ListItemText primary={w} />
                            </ListItem>
                          ))}
                        </List>
                      </Alert>
                    )}

                    <Box sx={{ mt: 1.5 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                        شیت‌های شناسایی‌شده:
                      </Typography>
                      <Stack direction="row" flexWrap="wrap" gap={0.75}>
                        {aiAutoResult.aiImportMeta?.sheetMappings?.map((sm, i) => (
                          <Chip
                            key={i}
                            size="small"
                            label={`${sm.sourceSheet} → ${sm.targetSheet} (${Math.round(sm.confidence * 100)}%)`}
                            color={sm.confidence >= 0.7 ? 'success' : sm.confidence >= 0.5 ? 'warning' : 'error'}
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    </Box>

                    {aiAutoResult.aiImportMeta?.parseErrors?.length > 0 && (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        <Typography variant="subtitle2">خطاهای parse ({aiAutoResult.aiImportMeta.parseErrors.length}):</Typography>
                        <List dense>
                          {aiAutoResult.aiImportMeta.parseErrors.slice(0, 10).map((e, i) => (
                            <ListItem key={i}>
                              <ListItemText primary={`${e.sheet} ردیف ${e.row}`} secondary={e.message} />
                            </ListItem>
                          ))}
                        </List>
                      </Alert>
                    )}
                  </Box>
                )}

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
                      پیشنهاد مپینگ AI (JSON خام):
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
