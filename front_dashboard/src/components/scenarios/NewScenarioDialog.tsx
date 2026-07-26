import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  ButtonBase,
  TextField,
  Grid,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  IconButton,
  Avatar,
  Switch,
  FormControlLabel,
  Paper,
  Chip,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  RadioGroup,
  Radio,
  alpha,
  useTheme,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Close,
  ArrowForward,
  ArrowBack,
  ExpandMore,
  Delete,
  Add,
} from '@mui/icons-material';
import type { Scenario, ScenarioStatus } from '@/types';
import MilitarySymbolPreview from '@/modules/scenario-management/components/MilitarySymbolPreview';
import MilitarySymbolPicker from '@/modules/scenario-management/components/MilitarySymbolPicker';
import {
  buildResourcesFormDialogSx,
  resourcesDialogTitleSx,
  resourcesDialogContentDividersSx,
  resourcesDialogActionsSx,
  resourcesOutlinedCancelButtonSx,
} from '@/modules/dashboard/pages/resources/resourcesDialogStyles';
import {
  LAND_UNIT_ICONS,
  SCENARIO_ECHELON_OPTIONS,
  COMBAT_SIDE_STANDARD_IDENTITY_OPTIONS,
} from '@/modules/scenario-management/constants/militarySymbols';
import {
  buildScenarioDialogPayload,
  type ScenarioDialogPayload,
} from './scenarioDialogAutosave';
import { isValidTimeZone, scenarioDateTimeToIso } from './scenarioDateTime';
import { useAppSelector } from '@/store';
import { selectUser } from '@/store/slices/authSlice';

interface NewScenarioDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (scenario: Partial<Scenario>) => void | Promise<void>;
  onAutosave?: (scenario: Partial<Scenario>) => void;
  scenario?: Scenario; // در حالت ویرایش، سناریوی موجود را می‌گیریم
}

interface SideData {
  name: string;
  standardIdentity: string;
  symbolOptions: {
    fillColor?: string;
  };
  units: Array<{
    rootUnitName: string;
    rootUnitEchelon: string;
    rootUnitIcon: string;
  }>;
}

const steps = ['اطلاعات پایه', 'زمان و محدوده', 'آرایش نبرد', 'مرور نهایی'];

function generateScenarioCode(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SCN-${y}${m}${d}-${rand}`;
}

const NewScenarioDialog: React.FC<NewScenarioDialogProps> = ({
  open,
  onClose,
  onSave,
  onAutosave,
  scenario,
}) => {
  const theme = useTheme();
  const currentUser = useAppSelector(selectUser);
  const [activeStep, setActiveStep] = useState(0);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const lastAutosaveSnapshotRef = useRef('');
  const [validationMessage, setValidationMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    name: 'سناریوی جدید',
    description: '',
    scenarioCode: generateScenarioCode(),
    authorName: '',
    createdDate: '',
    purpose: '',
    bboxText: '',
    symbologyStandard: 'app6' as 'app6' | '2525',
    timeZone: 'UTC',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
    hour: 0,
    minute: 0,
    endTime: '',
    status: 'draft' as ScenarioStatus,
    objectives: [] as string[],
    tags: [] as string[],
  });

  const [noInitialOrbat, setNoInitialOrbat] = useState(true);
  /** رقم هویت در SIDC (مثلاً ۳=دوست، ۶=دشمن) — مطابق MIL-STD-2525D */
  const [selectedStandardIdentity, setSelectedStandardIdentity] = useState('3');
  const [sides, setSides] = useState<SideData[]>([]);
  const [symbolPickerTarget, setSymbolPickerTarget] = useState<{
    sideIndex: number;
    unitIndex: number;
  } | null>(null);

  // مقداردهی فرم هنگام باز شدن دیالوگ (ایجاد یا ویرایش)
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setValidationMessage('');
      setSubmitError('');
      setIsSubmitting(false);
      setSymbolPickerTarget(null);

      if (scenario) {
        const meta = (scenario.metadata || {}) as any;

        // استخراج زمان شروع برای پر کردن فیلدهای تاریخ/ساعت
        let year = new Date().getFullYear();
        let month = new Date().getMonth() + 1;
        let day = new Date().getDate();
        let hour = 0;
        let minute = 0;
        if (scenario.startTime) {
          const d = new Date(scenario.startTime);
          if (!isNaN(d.getTime())) {
            year = d.getFullYear();
            month = d.getMonth() + 1;
            day = d.getDate();
            hour = d.getHours();
            minute = d.getMinutes();
          }
        }

        setFormData({
          name: scenario.name || 'سناریو',
          description: scenario.description || '',
          scenarioCode: meta.scenarioCode || generateScenarioCode(),
          authorName: meta.authorName || '',
          createdDate: meta.createdDate || '',
          purpose: meta.purpose || '',
          bboxText: '', // فعلاً از متادیتا برنمی‌گردانیم
          symbologyStandard:
            meta.symbologyStandard === '2525' ? '2525' : 'app6',
          timeZone: meta.timeZone || 'UTC',
          year,
          month,
          day,
          hour,
          minute,
          endTime: scenario.endTime || '',
          status: scenario.status || ('draft' as ScenarioStatus),
          objectives: scenario.objectives || [],
          tags: Array.isArray(meta.tags) ? meta.tags : [],
        });

        setNoInitialOrbat(
          Array.isArray(meta.sides) ? meta.sides.length === 0 : true
        );
        setSides(Array.isArray(meta.sides) ? meta.sides : []);

        // پیش‌نمایش تصویر
        if (meta.image && typeof meta.image === 'string') {
          setPreviewImageUrl(meta.image);
        } else {
          setPreviewImageUrl(null);
        }
      } else {
        // حالت ایجاد سناریوی جدید
        setFormData({
          name: 'سناریوی جدید',
          description: '',
          scenarioCode: generateScenarioCode(),
          authorName: currentUser?.name || currentUser?.username || '',
          createdDate: new Date().toISOString(),
          purpose: '',
          bboxText: '',
          symbologyStandard: 'app6',
          timeZone: 'UTC',
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          day: new Date().getDate(),
          hour: 0,
          minute: 0,
          endTime: '',
          status: 'draft' as ScenarioStatus,
          objectives: [],
          tags: [],
        });
        setNoInitialOrbat(true);
        setSides([]);
        setPreviewImageUrl(null);
      }
    }
  }, [open, scenario, currentUser]);

  useEffect(() => {
    if (!open) {
      lastAutosaveSnapshotRef.current = '';
      return;
    }

    if (!scenario?.id || !onAutosave) {
      return;
    }

    const imageUrl =
      previewImageUrl && !previewImageUrl.startsWith('data:')
        ? previewImageUrl
        : undefined;
    const payload = buildScenarioDialogPayload({
      scenarioId: scenario.id,
      formData,
      noInitialOrbat,
      sides,
      imageUrl,
    });
    const snapshot = JSON.stringify(payload);

    if (!lastAutosaveSnapshotRef.current) {
      lastAutosaveSnapshotRef.current = snapshot;
      return;
    }

    if (snapshot === lastAutosaveSnapshotRef.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      lastAutosaveSnapshotRef.current = snapshot;
      onAutosave(payload);
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [
    open,
    scenario?.id,
    onAutosave,
    formData,
    noInitialOrbat,
    sides,
    previewImageUrl,
  ]);

  const validateStep = (step: number): string => {
    if (step === 0 && !formData.name.trim()) {
      return 'نام سناریو الزامی است.';
    }

    if (step === 1) {
      try {
        scenarioDateTimeToIso(
          formData.year,
          formData.month,
          formData.day,
          formData.hour,
          formData.minute,
          formData.timeZone.trim()
        );
      } catch (error) {
        return error instanceof Error ? error.message : 'زمان شروع معتبر نیست.';
      }
    }

    if (step === 2 && !noInitialOrbat) {
      if (sides.length === 0) {
        return 'برای آرایش نبرد اولیه حداقل یک طرف اضافه کنید.';
      }
      for (const side of sides) {
        if (!side.name.trim()) {
          return 'نام همه طرف‌های درگیری باید مشخص شود.';
        }
        if (side.units.length === 0) {
          return `برای طرف «${side.name}» حداقل یک واحد ریشه اضافه کنید.`;
        }
        if (side.units.some(unit => !unit.rootUnitName.trim())) {
          return 'نام همه واحدهای ریشه باید مشخص شود.';
        }
      }
    }

    return '';
  };

  const handleNext = () => {
    const message = validateStep(activeStep);
    setValidationMessage(message);
    if (!message) {
      setActiveStep(prevActiveStep => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setValidationMessage('');
    setActiveStep(prevActiveStep => prevActiveStep - 1);
  };

  const handleAddSide = () => {
    const identity = COMBAT_SIDE_STANDARD_IDENTITY_OPTIONS.find(
      option => option.value === selectedStandardIdentity
    );
    setSides(prev => [
      ...prev,
      {
        name: `طرف ${identity?.label || ''}`.trim(),
        standardIdentity: selectedStandardIdentity,
        symbolOptions: {},
        units: [
          {
            rootUnitName: 'ستاد',
            rootUnitEchelon: '18',
            rootUnitIcon: '121000',
          },
        ],
      },
    ]);
  };

  const handleRemoveSide = (index: number) => {
    setSymbolPickerTarget(null);
    setSides(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddRootUnit = (sideIndex: number) => {
    setSides(prev =>
      prev.map((side, i) =>
        i === sideIndex
          ? {
              ...side,
              units: [
                ...side.units,
                {
                  rootUnitName: 'ستاد',
                  rootUnitEchelon: '18',
                  rootUnitIcon: '121000',
                },
              ],
            }
          : side
      )
    );
  };

  const handleRemoveUnit = (sideIndex: number, unitIndex: number) => {
    setSymbolPickerTarget(null);
    setSides(prev =>
      prev.map((side, i) =>
        i === sideIndex
          ? { ...side, units: side.units.filter((_, j) => j !== unitIndex) }
          : side
      )
    );
  };

  const handleSubmit = async () => {
    for (let step = 0; step < steps.length - 1; step += 1) {
      const message = validateStep(step);
      if (message) {
        setValidationMessage(message);
        setActiveStep(step);
        return;
      }
    }

    setValidationMessage('');
    setSubmitError('');
    setIsSubmitting(true);

    const startTime = scenarioDateTimeToIso(
      formData.year,
      formData.month,
      formData.day,
      formData.hour,
      formData.minute,
      formData.timeZone.trim()
    );

    const boundingBox = (scenario?.metadata as any)?.boundingBox as
      | number[]
      | undefined;

    const imageUrl =
      previewImageUrl && !previewImageUrl.startsWith('data:')
        ? previewImageUrl
        : undefined;

    const scenarioData: ScenarioDialogPayload = {
      name: formData.name,
      description: formData.description,
      status: formData.status,
      startTime,
      endTime: formData.endTime
        ? new Date(formData.endTime).toISOString()
        : undefined,
      objectives: formData.objectives.filter(obj => obj.trim()),
      // اضافه کردن تصویر در سطح اصلی سناریو (فقط URL، نه base64)
      image: imageUrl,
      // Add comprehensive metadata matching kalknegar structure
      metadata: {
        scenarioCode: formData.scenarioCode,
        authorName: formData.authorName || undefined,
        purpose: formData.purpose || undefined,
        createdDate: formData.createdDate || new Date().toISOString(),
        symbologyStandard: formData.symbologyStandard,
        timeZone: formData.timeZone,
        tags: formData.tags.filter(tag => tag.trim()),
        sides: noInitialOrbat ? [] : sides,
        boundingBox,
        // حفظ تصویر در metadata هم برای سازگاری (فقط URL)
        image: imageUrl,
      } as any,
    };

    // اگر در حالت ویرایش هستیم، شناسه سناریو را هم اضافه کن
    if (scenario && scenario.id) {
      (scenarioData as any).id = scenario.id;
    }

    try {
      await onSave(scenarioData);
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'ثبت سناریو انجام نشد. اطلاعات فرم حفظ شده است.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                <Typography variant="h6">1</Typography>
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  اطلاعات پایه سناریو
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  لطفا اطلاعات سناریو را کامل وارد نمایید.
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="نام"
                  value={formData.name}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                  }
                  required
                  error={!formData.name.trim()}
                  helperText={
                    !formData.name.trim() ? 'نام سناریو الزامی است.' : ''
                  }
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>هدف سناریو</InputLabel>
                  <Select
                    value={formData.purpose}
                    label="هدف سناریو"
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        purpose: e.target.value,
                      }))
                    }
                  >
                    <MenuItem value="">- انتخاب کنید -</MenuItem>
                    <MenuItem value="operational">عملیاتی</MenuItem>
                    <MenuItem value="educational">آموزشی</MenuItem>
                    <MenuItem value="training">تمرینی</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>نمادشناسی</Divider>
                <FormControl component="fieldset">
                  <RadioGroup
                    row
                    value={formData.symbologyStandard}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        symbologyStandard: e.target.value as 'app6' | '2525',
                      }))
                    }
                  >
                    <Paper
                      sx={{
                        p: 2,
                        mr: 2,
                        border: formData.symbologyStandard === 'app6' ? 2 : 1,
                        borderColor:
                          formData.symbologyStandard === 'app6'
                            ? 'primary.main'
                            : 'divider',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={() =>
                        setFormData(prev => ({
                          ...prev,
                          symbologyStandard: 'app6',
                        }))
                      }
                    >
                      <FormControlLabel
                        value="app6"
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography variant="body1" fontWeight="bold">
                              APP-6
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              نسخه ناتو
                            </Typography>
                          </Box>
                        }
                      />
                    </Paper>
                    <Paper
                      sx={{
                        p: 2,
                        border: formData.symbologyStandard === '2525' ? 2 : 1,
                        borderColor:
                          formData.symbologyStandard === '2525'
                            ? 'primary.main'
                            : 'divider',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={() =>
                        setFormData(prev => ({
                          ...prev,
                          symbologyStandard: '2525',
                        }))
                      }
                    >
                      <FormControlLabel
                        value="2525"
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography variant="body1" fontWeight="bold">
                              MIL-STD-2525D
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              نسخه آمریکایی
                            </Typography>
                          </Box>
                        }
                      />
                    </Paper>
                  </RadioGroup>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="توضیحات"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  helperText="از نحو مارک‌داون برای قالب‌بندی استفاده کنید"
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                <Typography variant="h6">3</Typography>
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  آرایش نبرد اولیه
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  طرف‌ها و واحدهای ریشه.
                </Typography>
              </Box>
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={noInitialOrbat}
                  onChange={e => setNoInitialOrbat(e.target.checked)}
                />
              }
              label="طرف‌ها و واحدهای ریشه را بعداً اضافه کن"
              sx={{ mb: 2 }}
            />

            {!noInitialOrbat && (
              <Box>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    mb: 3,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.025),
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    هویت طرف جدید
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    قاب و رنگ استاندارد طرف را انتخاب کنید.
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: 'repeat(2, minmax(0, 1fr))',
                        md: 'repeat(4, minmax(0, 1fr))',
                      },
                      gap: 1.5,
                    }}
                  >
                    {COMBAT_SIDE_STANDARD_IDENTITY_OPTIONS.map(option => {
                      const selected =
                        selectedStandardIdentity === option.value;
                      return (
                        <Button
                          key={option.value}
                          variant={selected ? 'contained' : 'outlined'}
                          color={selected ? 'primary' : 'inherit'}
                          onClick={() =>
                            setSelectedStandardIdentity(option.value)
                          }
                          aria-label={`انتخاب هویت ${option.label}`}
                          sx={{
                            minHeight: 92,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.5,
                            borderWidth: selected ? 2 : 1,
                          }}
                        >
                          <MilitarySymbolPreview
                            standardIdentity={option.value}
                            echelon="18"
                            icon="121000"
                            size={46}
                            compact
                            symbologyStandard={formData.symbologyStandard}
                          />
                          <Typography
                            variant="body2"
                            fontWeight={selected ? 700 : 500}
                            color="inherit"
                          >
                            {option.label}
                          </Typography>
                        </Button>
                      );
                    })}
                  </Box>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}
                  >
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={handleAddSide}
                    >
                      افزودن طرف{' '}
                      {
                        COMBAT_SIDE_STANDARD_IDENTITY_OPTIONS.find(
                          option => option.value === selectedStandardIdentity
                        )?.label
                      }
                    </Button>
                  </Box>
                </Paper>

                {sides.map((side, sideIndex) => (
                  <Accordion
                    key={sideIndex}
                    defaultExpanded={sideIndex === 0}
                    sx={{
                      mb: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: '12px !important',
                      overflow: 'hidden',
                      '&::before': { display: 'none' },
                    }}
                  >
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1.5}
                        sx={{ flex: 1 }}
                      >
                        <MilitarySymbolPreview
                          standardIdentity={side.standardIdentity}
                          echelon={side.units[0]?.rootUnitEchelon || '18'}
                          icon={side.units[0]?.rootUnitIcon || '121000'}
                          fillColor={side.symbolOptions?.fillColor}
                          size={42}
                          compact
                          symbologyStandard={formData.symbologyStandard}
                        />
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {side.name || `طرف ${sideIndex + 1}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {
                              COMBAT_SIDE_STANDARD_IDENTITY_OPTIONS.find(
                                option => option.value === side.standardIdentity
                              )?.label
                            }{' '}
                            · {side.units.length} واحد ریشه
                          </Typography>
                        </Box>
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} md={7}>
                          <TextField
                            fullWidth
                            label="نام طرف"
                            value={side.name}
                            onChange={e => {
                              const newSides = [...sides];
                              newSides[sideIndex].name = e.target.value;
                              setSides(newSides);
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} md={5}>
                          <FormControl fullWidth>
                            <InputLabel>هویت طرف</InputLabel>
                            <Select
                              value={side.standardIdentity}
                              label="هویت طرف"
                              onChange={e => {
                                const standardIdentity = e.target.value;
                                setSides(prev =>
                                  prev.map((item, index) =>
                                    index === sideIndex
                                      ? {
                                          ...item,
                                          standardIdentity,
                                          symbolOptions: {},
                                        }
                                      : item
                                  )
                                );
                              }}
                            >
                              {COMBAT_SIDE_STANDARD_IDENTITY_OPTIONS.map(
                                option => (
                                  <MenuItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    <Stack
                                      direction="row"
                                      alignItems="center"
                                      spacing={1}
                                    >
                                      <MilitarySymbolPreview
                                        standardIdentity={option.value}
                                        echelon="18"
                                        icon="121000"
                                        size={32}
                                        compact
                                        symbologyStandard={
                                          formData.symbologyStandard
                                        }
                                      />
                                      <Typography variant="body2">
                                        {option.label}
                                      </Typography>
                                    </Stack>
                                  </MenuItem>
                                )
                              )}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>

                      <Accordion
                        disableGutters
                        elevation={0}
                        sx={{
                          mb: 2,
                          border: '1px dashed',
                          borderColor: 'divider',
                          borderRadius: '8px !important',
                          '&::before': { display: 'none' },
                        }}
                      >
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography variant="body2" fontWeight={600}>
                            تنظیمات پیشرفته نماد
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={1.5}
                            alignItems={{ sm: 'center' }}
                          >
                            <TextField
                              fullWidth
                              label="رنگ سفارشی"
                              type="color"
                              value={
                                side.symbolOptions?.fillColor ||
                                COMBAT_SIDE_STANDARD_IDENTITY_OPTIONS.find(
                                  option =>
                                    option.value === side.standardIdentity
                                )?.color ||
                                '#ffff00'
                              }
                              onChange={e => {
                                const fillColor = e.target.value;
                                setSides(prev =>
                                  prev.map((item, index) =>
                                    index === sideIndex
                                      ? {
                                          ...item,
                                          symbolOptions: {
                                            ...item.symbolOptions,
                                            fillColor,
                                          },
                                        }
                                      : item
                                  )
                                );
                              }}
                              InputLabelProps={{ shrink: true }}
                              helperText="در حالت عادی رنگ استاندارد هویت استفاده می‌شود."
                            />
                            <Button
                              variant="outlined"
                              color="inherit"
                              disabled={!side.symbolOptions?.fillColor}
                              onClick={() =>
                                setSides(prev =>
                                  prev.map((item, index) =>
                                    index === sideIndex
                                      ? { ...item, symbolOptions: {} }
                                      : item
                                  )
                                )
                              }
                              sx={{ whiteSpace: 'nowrap' }}
                            >
                              رنگ استاندارد
                            </Button>
                          </Stack>
                        </AccordionDetails>
                      </Accordion>

                      <Divider sx={{ my: 2 }}>
                        واحدهای ریشه ({side.units.length})
                      </Divider>
                      {side.units.map((unit, unitIndex) => (
                        <Box
                          key={unitIndex}
                          sx={{
                            position: 'relative',
                            mb: 2,
                            p: 2,
                            bgcolor: alpha(theme.palette.primary.main, 0.025),
                            borderRadius: 2,
                            border: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={7}>
                              <TextField
                                fullWidth
                                label="نام واحد ریشه"
                                value={unit.rootUnitName}
                                onChange={e => {
                                  const newSides = [...sides];
                                  newSides[sideIndex].units[
                                    unitIndex
                                  ].rootUnitName = e.target.value;
                                  setSides(newSides);
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} md={5}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: 1,
                                  justifyContent: 'center',
                                  minHeight: 128,
                                  p: 1.5,
                                  bgcolor: 'background.paper',
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  borderRadius: 2,
                                }}
                              >
                                <MilitarySymbolPreview
                                  standardIdentity={side.standardIdentity}
                                  echelon={unit.rootUnitEchelon || '18'}
                                  icon={unit.rootUnitIcon || '121000'}
                                  fillColor={side.symbolOptions?.fillColor}
                                  size={82}
                                  compact
                                  symbologyStandard={formData.symbologyStandard}
                                  symbolOptions={side.symbolOptions || {}}
                                />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  پیش‌نمایش زنده
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>

                          <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} md={6}>
                              <Button
                                fullWidth
                                variant="outlined"
                                onClick={() =>
                                  setSymbolPickerTarget({
                                    sideIndex,
                                    unitIndex,
                                  })
                                }
                                sx={{
                                  minHeight: 56,
                                  justifyContent: 'space-between',
                                  px: 2,
                                }}
                              >
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  spacing={1}
                                >
                                  <MilitarySymbolPreview
                                    standardIdentity={side.standardIdentity}
                                    echelon={unit.rootUnitEchelon || '18'}
                                    icon={unit.rootUnitIcon || '121000'}
                                    fillColor={side.symbolOptions?.fillColor}
                                    size={36}
                                    compact
                                    symbologyStandard={
                                      formData.symbologyStandard
                                    }
                                  />
                                  <Box sx={{ textAlign: 'right' }}>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      نوع یگان
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      fontWeight={600}
                                    >
                                      {LAND_UNIT_ICONS.find(
                                        icon => icon.value === unit.rootUnitIcon
                                      )?.label || 'انتخاب نماد'}
                                    </Typography>
                                  </Box>
                                </Stack>
                                <Typography variant="caption">تغییر</Typography>
                              </Button>
                            </Grid>
                            <Grid item xs={12}>
                              <Box
                                role="group"
                                aria-label="رده سازمانی"
                                sx={{
                                  p: 1.5,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  borderRadius: 2,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  display="block"
                                  sx={{ mb: 1 }}
                                >
                                  رده سازمانی اصلی
                                </Typography>
                                <Box
                                  sx={{
                                    display: 'grid',
                                    gridTemplateColumns: {
                                      xs: 'repeat(2, minmax(0, 1fr))',
                                      sm: 'repeat(4, minmax(0, 1fr))',
                                      md: 'repeat(8, minmax(0, 1fr))',
                                    },
                                    gap: 0.75,
                                  }}
                                >
                                  {SCENARIO_ECHELON_OPTIONS.map(echelon => {
                                    const selected =
                                      (unit.rootUnitEchelon || '18') ===
                                      echelon.value;
                                    return (
                                      <ButtonBase
                                        key={echelon.value}
                                        aria-label={`انتخاب رده ${echelon.label}`}
                                        aria-pressed={selected}
                                        onClick={() => {
                                          const rootUnitEchelon = echelon.value;
                                          setSides(prev =>
                                            prev.map((item, index) =>
                                              index === sideIndex
                                                ? {
                                                    ...item,
                                                    units: item.units.map(
                                                      (rootUnit, rootIndex) =>
                                                        rootIndex === unitIndex
                                                          ? {
                                                              ...rootUnit,
                                                              rootUnitEchelon,
                                                            }
                                                          : rootUnit
                                                    ),
                                                  }
                                                : item
                                            )
                                          );
                                        }}
                                        sx={{
                                          minHeight: 40,
                                          px: 1,
                                          borderRadius: 1.5,
                                          border: '1px solid',
                                          borderColor: selected
                                            ? 'primary.main'
                                            : 'divider',
                                          bgcolor: selected
                                            ? alpha(
                                                theme.palette.primary.main,
                                                0.12
                                              )
                                            : 'background.paper',
                                          color: selected
                                            ? 'primary.main'
                                            : 'text.primary',
                                          fontWeight: selected ? 700 : 500,
                                          '&:hover': {
                                            borderColor: 'primary.main',
                                            bgcolor: alpha(
                                              theme.palette.primary.main,
                                              0.07
                                            ),
                                          },
                                        }}
                                      >
                                        {echelon.label}
                                      </ButtonBase>
                                    );
                                  })}
                                </Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  display="block"
                                  sx={{ mt: 1 }}
                                >
                                  جزئیات ساختار در کالک‌نگار تکمیل می‌شود.
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>

                          <Button
                            size="small"
                            color="error"
                            startIcon={<Delete />}
                            onClick={() =>
                              handleRemoveUnit(sideIndex, unitIndex)
                            }
                            sx={{ mt: 1 }}
                          >
                            حذف این واحد
                          </Button>
                          {unitIndex < side.units.length - 1 && (
                            <Divider sx={{ mt: 2 }} />
                          )}
                        </Box>
                      ))}
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 1,
                          mt: 2,
                        }}
                      >
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Add />}
                          onClick={() => handleAddRootUnit(sideIndex)}
                        >
                          افزودن واحد ریشه
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<Delete />}
                          onClick={() => handleRemoveSide(sideIndex)}
                        >
                          حذف طرف
                        </Button>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))}

                {sides.length === 0 && (
                  <Alert severity="info">
                    هنوز طرفی اضافه نشده است. هویت را از کارت‌های بالا انتخاب
                    کنید و سپس «افزودن طرف» را بزنید.
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                <Typography variant="h6">2</Typography>
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  زمان شروع سناریو
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  زمان شروع و منطقه زمانی را انتخاب کنید.
                </Typography>
              </Box>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              محدوده جغرافیایی روی نقشه و شرایط جوی و وضعیت متغیر زمین روی
              تایم‌لاین سناریو تنظیم می‌شوند.
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="منطقه زمانی"
                  value={formData.timeZone}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, timeZone: e.target.value }))
                  }
                  placeholder="UTC"
                  error={!isValidTimeZone(formData.timeZone.trim())}
                  helperText="نمونه: UTC یا Asia/Tehran"
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="سال"
                  type="number"
                  value={formData.year}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      year: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="ماه"
                  type="number"
                  value={formData.month}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      month: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="روز"
                  type="number"
                  value={formData.day}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      day: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="ساعت"
                  type="number"
                  value={formData.hour}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      hour: parseInt(e.target.value) || 0,
                    }))
                  }
                  inputProps={{ min: 0, max: 23 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="دقیقه"
                  type="number"
                  value={formData.minute}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      minute: parseInt(e.target.value) || 0,
                    }))
                  }
                  inputProps={{ min: 0, max: 59 }}
                />
              </Grid>
              <Grid item xs={12}>
                <Paper
                  sx={{
                    p: 3,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="body1"
                    align="center"
                    fontWeight="bold"
                    color="primary.main"
                  >
                    {new Date(
                      formData.year,
                      formData.month - 1,
                      formData.day,
                      formData.hour,
                      formData.minute
                    ).toLocaleString('fa-IR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                <Typography variant="h6">4</Typography>
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  مرور نهایی
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  خلاصه‌ای از تنظیمات سناریو را بررسی کنید و در صورت نیاز
                  بازگردید و اصلاح کنید.
                </Typography>
              </Box>
            </Box>

            <Paper
              sx={{
                p: 3,
                bgcolor: alpha(theme.palette.background.paper, 0.7),
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    gutterBottom
                  >
                    نام سناریو
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formData.name || '---'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    gutterBottom
                  >
                    کد سناریو
                  </Typography>
                  <Typography variant="body1" fontFamily="monospace">
                    {formData.scenarioCode}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    gutterBottom
                  >
                    زمان شروع
                  </Typography>
                  <Typography variant="body1">
                    {new Date(
                      formData.year,
                      formData.month - 1,
                      formData.day,
                      formData.hour,
                      formData.minute
                    ).toLocaleString('fa-IR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                </Grid>
                {formData.authorName && (
                  <Grid item xs={12} md={6}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      gutterBottom
                    >
                      نویسنده
                    </Typography>
                    <Typography variant="body1">
                      {formData.authorName}
                    </Typography>
                  </Grid>
                )}
                {formData.purpose && (
                  <Grid item xs={12} md={6}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      gutterBottom
                    >
                      هدف سناریو
                    </Typography>
                    <Typography variant="body1">
                      {formData.purpose === 'operational'
                        ? 'عملیاتی'
                        : formData.purpose === 'educational'
                          ? 'آموزشی'
                          : formData.purpose === 'training'
                            ? 'تمرینی'
                            : formData.purpose}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    gutterBottom
                  >
                    وضعیت سناریو
                  </Typography>
                  <Chip
                    label={
                      formData.status === 'draft'
                        ? 'پیش‌نویس'
                        : formData.status === 'active'
                          ? 'فعال'
                          : formData.status === 'paused'
                            ? 'متوقف'
                            : formData.status === 'completed'
                              ? 'تکمیل شده'
                              : formData.status === 'archived'
                                ? 'آرشیو شده'
                                : formData.status
                    }
                    color={
                      formData.status === 'active'
                        ? 'success'
                        : formData.status === 'paused'
                          ? 'warning'
                          : formData.status === 'completed'
                            ? 'info'
                            : formData.status === 'archived'
                              ? 'default'
                              : 'default'
                    }
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    gutterBottom
                  >
                    آرایش اولیه
                  </Typography>
                  <Chip
                    label={
                      noInitialOrbat
                        ? 'پس از ایجاد سناریو تکمیل می‌شود'
                        : `${sides.length} طرف تعریف شده`
                    }
                    color={noInitialOrbat ? 'default' : 'secondary'}
                    size="small"
                    variant={noInitialOrbat ? 'outlined' : 'filled'}
                  />
                </Grid>
                {formData.objectives.length > 0 && (
                  <Grid item xs={12}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      gutterBottom
                    >
                      اهداف ({formData.objectives.filter(o => o.trim()).length})
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      {formData.objectives
                        .filter(o => o.trim())
                        .map((obj, idx) => (
                          <Chip key={idx} label={obj} size="small" />
                        ))}
                    </Stack>
                  </Grid>
                )}
                {formData.tags.length > 0 && (
                  <Grid item xs={12}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      gutterBottom
                    >
                      برچسب‌ها ({formData.tags.filter(t => t.trim()).length})
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      {formData.tags
                        .filter(t => t.trim())
                        .map((tag, idx) => (
                          <Chip
                            key={idx}
                            label={tag}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                    </Stack>
                  </Grid>
                )}
                {sides.length > 0 && (
                  <Grid item xs={12}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      gutterBottom
                    >
                      طرف‌ها ({sides.length})
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      {sides.map((side, idx) => (
                        <Chip
                          key={idx}
                          label={`${side.name || `طرف ${idx + 1}`} (${side.units.length} واحد)`}
                          size="small"
                          color="secondary"
                        />
                      ))}
                    </Stack>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={[
        buildResourcesFormDialogSx(theme),
        {
          '& .MuiDialog-paper': {
            maxHeight: '90vh',
          },
        },
      ]}
    >
      <DialogTitle sx={{ ...resourcesDialogTitleSx(theme), pt: 2, pb: 1.5 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6">
            {scenario ? 'ویرایش سناریو' : 'ایجاد سناریوی جدید'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={resourcesDialogContentDividersSx(theme)}>
        <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 1 }}>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {(validationMessage || submitError) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {validationMessage || submitError}
          </Alert>
        )}

        {renderStepContent()}

        {symbolPickerTarget &&
          sides[symbolPickerTarget.sideIndex]?.units[
            symbolPickerTarget.unitIndex
          ] && (
            <MilitarySymbolPicker
              open
              value={
                sides[symbolPickerTarget.sideIndex].units[
                  symbolPickerTarget.unitIndex
                ].rootUnitIcon
              }
              standardIdentity={
                sides[symbolPickerTarget.sideIndex].standardIdentity
              }
              symbologyStandard={formData.symbologyStandard}
              fillColor={
                sides[symbolPickerTarget.sideIndex].symbolOptions?.fillColor
              }
              onClose={() => setSymbolPickerTarget(null)}
              onChange={rootUnitIcon => {
                const { sideIndex, unitIndex } = symbolPickerTarget;
                setSides(prev =>
                  prev.map((side, index) =>
                    index === sideIndex
                      ? {
                          ...side,
                          units: side.units.map((unit, rootIndex) =>
                            rootIndex === unitIndex
                              ? { ...unit, rootUnitIcon }
                              : unit
                          ),
                        }
                      : side
                  )
                );
              }}
            />
          )}
      </DialogContent>

      <DialogActions
        sx={{ ...resourcesDialogActionsSx(theme), flexWrap: 'wrap' }}
      >
        <Button
          onClick={onClose}
          disabled={isSubmitting}
          variant="outlined"
          color="inherit"
          sx={resourcesOutlinedCancelButtonSx(theme)}
        >
          انصراف
        </Button>
        <Box sx={{ flex: 1 }} />
        {activeStep > 0 && (
          <Button
            onClick={handleBack}
            disabled={isSubmitting}
            startIcon={<ArrowBack />}
            variant="outlined"
            color="inherit"
            sx={resourcesOutlinedCancelButtonSx(theme)}
          >
            مرحله قبل
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
            disabled={isSubmitting}
            endIcon={<ArrowForward />}
            sx={{ borderRadius: 2, px: 3 }}
          >
            مرحله بعد
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={!formData.name.trim() || isSubmitting}
            startIcon={
              isSubmitting ? (
                <CircularProgress color="inherit" size={18} />
              ) : undefined
            }
            sx={{ borderRadius: 2, px: 3 }}
          >
            {isSubmitting
              ? 'در حال ذخیره...'
              : scenario
                ? 'اعمال تغییرات'
                : 'ایجاد سناریو'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default NewScenarioDialog;
