import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  alpha,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  Psychology as PsychologyIcon,
  TableChart as TableChartIcon,
} from '@mui/icons-material';
import { useAppDispatch } from '@/store';
import { useNavigate } from 'react-router-dom';
import { fetchScenarios } from '@/store/slices/scenariosSlice';
import {
  fetchTabItems,
  mergeImportedResources,
  PersonnelItem,
  EquipmentItem,
} from '@/store/slices/tabularResourcesSlice';
import { showSuccessNotification, showErrorNotification } from '@/store/slices/uiSlice';
import dataImportApiService, {
  ScenarioExcelPreviewData,
} from '@/services/api/dataImportApiService';
import { ApiClientError } from '@/services/api/baseApiClient';

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return (
    <div role="tabpanel" hidden={value !== index} style={{ marginTop: 16 }}>
      {value === index ? children : null}
    </div>
  );
}

const DataManagementPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);

  const [scenarioFile, setScenarioFile] = useState<File | null>(null);
  const [scenarioPreview, setScenarioPreview] = useState<ScenarioExcelPreviewData | null>(null);

  const [resourcesFile, setResourcesFile] = useState<File | null>(null);
  const [resourcesResult, setResourcesResult] = useState<string | null>(null);

  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const scenarioInputRef = useRef<HTMLInputElement>(null);
  const resourcesInputRef = useRef<HTMLInputElement>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dataImportApiService
      .getAiConfig()
      .then((c) => setAiEnabled(!!c.enabled))
      .catch(() => setAiEnabled(false));
  }, []);

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
      await dataImportApiService.importScenarioExcel(scenarioFile);
      await dispatch(fetchScenarios()).unwrap();
      dispatch(showSuccessNotification('سناریو از اکسل ایجاد شد'));
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
    <Box sx={{ p: 3, maxWidth: 960, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        مدیریت داده
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        ایمپورت سناریو و منابع از قالب اکسل استاندارد؛ پیش‌نمایش قبل از ذخیره؛ کمک اختیاری AI برای نگاشت
        ستون‌ها.
      </Typography>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable">
          <Tab icon={<CloudUploadIcon />} iconPosition="start" label="ایمپورت سناریو" />
          <Tab icon={<TableChartIcon />} iconPosition="start" label="ایمپورت منابع" />
          <Tab icon={<DownloadIcon />} iconPosition="start" label="دانلود قالب" />
          <Tab icon={<PsychologyIcon />} iconPosition="start" label="کمک AI" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          <TabPanel value={tab} index={0}>
            <input
              ref={scenarioInputRef}
              type="file"
              accept=".xlsx,.xlsm"
              hidden
              onChange={onScenarioFile}
            />
            <Button variant="outlined" onClick={() => scenarioInputRef.current?.click()}>
              انتخاب فایل اکسل
            </Button>
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
                      primary="تعداد رویداد / طرف‌ها / تجهیز / پرسنل"
                      secondary={`${scenarioPreview.preview?.eventsCount ?? 0} / ${scenarioPreview.preview?.sidesCount ?? 0} / ${scenarioPreview.preview?.equipmentCount ?? 0} / ${scenarioPreview.preview?.personnelCount ?? 0}`}
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
                  تأیید و ایجاد سناریو
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
            <Button variant="outlined" onClick={() => resourcesInputRef.current?.click()}>
              انتخاب فایل اکسل (شیت‌های تجهیزات و پرسنل)
            </Button>
            {resourcesFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {resourcesFile.name}
              </Typography>
            )}
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              disabled={!resourcesFile || loading}
              onClick={handleResourcesImport}
            >
              وارد کردن به مدیریت منابع
            </Button>
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
              قالب شامل شیت‌های: سناریو، حوادث، یگان‌ها، تجهیزات، پرسنل — با ردیف نمونه و هدر انگلیسی.
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
                  فایل اکسل کارفرما را بارگذاری کنید؛ سیستم سرآیند و چند ردیف نمونه را به مدل می‌فرستد و
                  پیشنهاد نگاشت JSON برمی‌گرداند. خروجی را بررسی کنید و سپس داده را در قالب استاندارد
                  اصلاح کنید.
                </Typography>
                <input
                  ref={aiInputRef}
                  type="file"
                  accept=".xlsx,.xlsm"
                  hidden
                  onChange={(e) => setAiFile(e.target.files?.[0] || null)}
                />
                <Button variant="outlined" onClick={() => aiInputRef.current?.click()}>
                  انتخاب فایل
                </Button>
                {aiFile && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {aiFile.name}
                  </Typography>
                )}
                <Button
                  variant="contained"
                  sx={{ mt: 2 }}
                  disabled={!aiFile || loading}
                  onClick={handleAiSuggest}
                >
                  دریافت پیشنهاد نگاشت
                </Button>
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
                    <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap' }}>{aiResult}</pre>
                  </Paper>
                )}
              </>
            )}
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
};

export default DataManagementPage;
