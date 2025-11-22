import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
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
} from '@mui/material';
import {
  Close,
  ArrowForward,
  ArrowBack,
  CloudUpload,
  Image as ImageIcon,
  ExpandMore,
  Delete,
  Add,
} from '@mui/icons-material';
import { useTranslation } from '@/hooks/useTranslation';
import type { Scenario, ScenarioStatus } from '@/types';
import MilitarySymbolPreview from '@/modules/scenario-management/components/MilitarySymbolPreview';
import { 
  LAND_UNIT_ICONS, 
  getEchelonOptions
} from '@/modules/scenario-management/constants/militarySymbols';

interface NewScenarioDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (scenario: Partial<Scenario>) => void;
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

interface WeatherData {
  sunPhase: 'day' | 'night' | 'dawn' | 'dusk';
  sunElevationDeg: number;
  sky: string;
  cloudCeilingFt: number;
  cloudCoveragePct: number;
  visibilityKm: number;
  visibilityReductionPct: number;
  temperatureC: number;
  humidityPct: number;
  pressureHpa: number;
  windSurfaceSpeedKt: number;
  windSurfaceDirDeg: number;
  windUpperSpeedKt: number;
  windUpperDirDeg: number;
  precipitationType: 'none' | 'rain' | 'snow' | 'hail';
  precipitationIntensity: number;
  precipitationDurationMin: number;
  groundCondition: 'dry' | 'semi-wet' | 'muddy';
  groundIcing: boolean;
  movementEnergyLossPct: number;
  airQualityIndex: number;
  dustLevel: 'low' | 'medium' | 'high';
}

const steps = [
  'اطلاعات پایه',
  'آرایش نبرد',
  'زمان شروع',
  'جو و وضعیت جوی',
  'اهداف و برچسب‌ها',
  'مرور نهایی',
];

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
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewImageFile, setPreviewImageFile] = useState<File | null>(null);
  
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

  const [noInitialOrbat, setNoInitialOrbat] = useState(false);
  const [selectedStandardIdentity, setSelectedStandardIdentity] = useState('1'); // Friend
  const [sides, setSides] = useState<SideData[]>([]);
  
  const [weather, setWeather] = useState<WeatherData>({
    sunPhase: 'day',
    sunElevationDeg: 30,
    sky: '',
    cloudCeilingFt: 0,
    cloudCoveragePct: 0,
    visibilityKm: 10,
    visibilityReductionPct: 0,
    temperatureC: 20,
    humidityPct: 40,
    pressureHpa: 1013,
    windSurfaceSpeedKt: 0,
    windSurfaceDirDeg: 0,
    windUpperSpeedKt: 0,
    windUpperDirDeg: 0,
    precipitationType: 'none',
    precipitationIntensity: 0,
    precipitationDurationMin: 0,
    groundCondition: 'dry',
    groundIcing: false,
    movementEnergyLossPct: 0,
    airQualityIndex: 50,
    dustLevel: 'low',
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setFormData({
        name: 'سناریوی جدید',
        description: '',
        scenarioCode: generateScenarioCode(),
        authorName: '',
        createdDate: '',
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
      setNoInitialOrbat(false);
      setSides([]);
      setPreviewImageUrl(null);
      setPreviewImageFile(null);
    }
  }, [open]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPreviewImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddObjective = () => {
    setFormData(prev => ({
      ...prev,
      objectives: [...prev.objectives, ''],
    }));
  };

  const handleRemoveObjective = (index: number) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.filter((_, i) => i !== index),
    }));
  };

  const handleObjectiveChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.map((obj, i) => i === index ? value : obj),
    }));
  };

  const handleAddTag = () => {
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, ''],
    }));
  };

  const handleRemoveTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const handleTagChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.map((tag, i) => i === index ? value : tag),
    }));
  };

  const handleAddSide = () => {
    setSides(prev => [...prev, {
      name: 'طرف',
      standardIdentity: selectedStandardIdentity,
      symbolOptions: {},
      units: [{ rootUnitName: 'ستاد', rootUnitEchelon: '18', rootUnitIcon: '121000' }],
    }]);
  };

  const handleRemoveSide = (index: number) => {
    setSides(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddRootUnit = (sideIndex: number) => {
    setSides(prev => prev.map((side, i) => 
      i === sideIndex 
        ? { ...side, units: [...side.units, { rootUnitName: 'ستاد', rootUnitEchelon: '18', rootUnitIcon: '121000' }] }
        : side
    ));
  };

  const handleRemoveUnit = (sideIndex: number, unitIndex: number) => {
    setSides(prev => prev.map((side, i) => 
      i === sideIndex 
        ? { ...side, units: side.units.filter((_, j) => j !== unitIndex) }
        : side
    ));
  };

  const handleSubmit = () => {
    // Calculate start time
    const startTime = new Date(
      formData.year,
      formData.month - 1,
      formData.day,
      formData.hour,
      formData.minute
    ).toISOString();

    // Parse bounding box if provided
    let boundingBox: number[] | undefined;
    if (formData.bboxText && formData.bboxText.trim().length > 0) {
      const nums = formData.bboxText.split(',').map((s) => Number(s.trim()));
      if (nums.length === 4 && nums.every((n) => Number.isFinite(n))) {
        boundingBox = [nums[0], nums[1], nums[2], nums[3]];
      }
    }

    const scenarioData: Partial<Scenario> = {
      name: formData.name,
      description: formData.description,
      status: formData.status,
      startTime,
      endTime: formData.endTime ? new Date(formData.endTime).toISOString() : undefined,
      objectives: formData.objectives.filter(obj => obj.trim()),
      // Add comprehensive metadata matching kalknegar structure
      metadata: {
        scenarioCode: formData.scenarioCode,
        authorName: formData.authorName || undefined,
        purpose: formData.purpose || undefined,
        createdDate: formData.createdDate || new Date().toISOString(),
        symbologyStandard: formData.symbologyStandard,
        timeZone: formData.timeZone,
        tags: formData.tags.filter(tag => tag.trim()),
        weather: {
          ...weather,
        },
        sides: noInitialOrbat ? [] : sides,
        boundingBox,
        image: previewImageUrl || undefined,
      } as any,
    };

    onSave(scenarioData);
    onClose();
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
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    label="شناسه سناریو"
                    value={formData.scenarioCode}
                    disabled
                  />
                  <Button
                    size="small"
                    onClick={() => setFormData(prev => ({ ...prev, scenarioCode: generateScenarioCode() }))}
                  >
                    تولید مجدد
                  </Button>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="نام نویسنده"
                  value={formData.authorName}
                  onChange={(e) => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="تاریخ ایجاد (شمسی)"
                  value={formData.createdDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, createdDate: e.target.value }))}
                  placeholder="مثلاً 1403/07/10"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>هدف سناریو</InputLabel>
                  <Select
                    value={formData.purpose}
                    label="هدف سناریو"
                    onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                  >
                    <MenuItem value="">- انتخاب کنید -</MenuItem>
                    <MenuItem value="operational">عملیاتی</MenuItem>
                    <MenuItem value="educational">آموزشی</MenuItem>
                    <MenuItem value="training">تمرینی</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>وضعیت سناریو</InputLabel>
                  <Select
                    value={formData.status}
                    label="وضعیت سناریو"
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as ScenarioStatus }))}
                  >
                    <MenuItem value="draft">پیش‌نویس</MenuItem>
                    <MenuItem value="active">فعال</MenuItem>
                    <MenuItem value="paused">متوقف</MenuItem>
                    <MenuItem value="completed">تکمیل شده</MenuItem>
                    <MenuItem value="archived">آرشیو شده</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>نمادشناسی</Divider>
                <FormControl component="fieldset">
                  <RadioGroup
                    row
                    value={formData.symbologyStandard}
                    onChange={(e) => setFormData(prev => ({ ...prev, symbologyStandard: e.target.value as 'app6' | '2525' }))}
                  >
                    <Paper
                      sx={{
                        p: 2,
                        mr: 2,
                        border: formData.symbologyStandard === 'app6' ? 2 : 1,
                        borderColor: formData.symbologyStandard === 'app6' ? 'primary.main' : 'divider',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={() => setFormData(prev => ({ ...prev, symbologyStandard: 'app6' }))}
                    >
                      <FormControlLabel
                        value="app6"
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography variant="body1" fontWeight="bold">APP-6</Typography>
                            <Typography variant="caption" color="text.secondary">نسخه ناتو</Typography>
                          </Box>
                        }
                      />
                    </Paper>
                    <Paper
                      sx={{
                        p: 2,
                        border: formData.symbologyStandard === '2525' ? 2 : 1,
                        borderColor: formData.symbologyStandard === '2525' ? 'primary.main' : 'divider',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={() => setFormData(prev => ({ ...prev, symbologyStandard: '2525' }))}
                    >
                      <FormControlLabel
                        value="2525"
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography variant="body1" fontWeight="bold">MIL-STD-2525D</Typography>
                            <Typography variant="caption" color="text.secondary">نسخه آمریکایی</Typography>
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
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  helperText="از نحو مارک‌داون برای قالب‌بندی استفاده کنید"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>تصویر پیش‌نمایش</Divider>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<CloudUpload />}
                      fullWidth
                    >
                      انتخاب تصویر
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleImageChange}
                      />
                    </Button>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      فرمت‌های رایج تصویری پشتیبانی می‌شوند. اندازه مناسب: ۱۶:۹
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper
                      sx={{
                        aspectRatio: '16/9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'grey.100',
                        overflow: 'hidden',
                      }}
                    >
                      {previewImageUrl ? (
                        <Box
                          component="img"
                          src={previewImageUrl}
                          alt="Preview"
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <ImageIcon sx={{ fontSize: 48, color: 'grey.400' }} />
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>محدوده جغرافیایی</Divider>
                <TextField
                  fullWidth
                  label="کران جغرافیایی (BBox) — ترتیب: minX,minY,maxX,maxY"
                  placeholder="مثلاً 44.5,25.1,63.3,39.8"
                  value={formData.bboxText}
                  onChange={(e) => setFormData(prev => ({ ...prev, bboxText: e.target.value }))}
                />
              </Grid>
            </Grid>
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
                  onChange={(e) => setNoInitialOrbat(e.target.checked)}
                />
              }
              label="طرف‌ها و واحدهای ریشه را بعداً اضافه کن"
              sx={{ mb: 2 }}
            />

            {!noInitialOrbat && (
              <Box>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>هویت استاندارد</InputLabel>
                  <Select
                    value={selectedStandardIdentity}
                    label="هویت استاندارد"
                    onChange={(e) => setSelectedStandardIdentity(e.target.value)}
                  >
                    <MenuItem value="1">دوست</MenuItem>
                    <MenuItem value="2">دشمن</MenuItem>
                    <MenuItem value="3">خنثی</MenuItem>
                    <MenuItem value="4">نامشخص</MenuItem>
                  </Select>
                </FormControl>

                {sides.map((side, sideIndex) => (
                  <Accordion key={sideIndex} defaultExpanded={sideIndex === 0} sx={{ mb: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        طرف {sideIndex + 1}: {side.name || 'بدون نام'}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="نام طرف"
                            value={side.name}
                            onChange={(e) => {
                              const newSides = [...sides];
                              newSides[sideIndex].name = e.target.value;
                              setSides(newSides);
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="رنگ نماد"
                            type="color"
                            value={side.symbolOptions?.fillColor || '#000000'}
                            onChange={(e) => {
                              const newSides = [...sides];
                              newSides[sideIndex].symbolOptions = {
                                ...newSides[sideIndex].symbolOptions,
                                fillColor: e.target.value,
                              };
                              setSides(newSides);
                            }}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                      </Grid>
                      
                      <Divider sx={{ my: 2 }}>واحدهای ریشه</Divider>
                      {side.units.map((unit, unitIndex) => (
                          <Box key={unitIndex} sx={{ mb: 3, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1, border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
                            <Grid container spacing={2} alignItems="center">
                              <Grid item xs={12} md={6}>
                                <TextField
                                  fullWidth
                                  label="نام واحد ریشه"
                                  value={unit.rootUnitName}
                                  onChange={(e) => {
                                    const newSides = [...sides];
                                    newSides[sideIndex].units[unitIndex].rootUnitName = e.target.value;
                                    setSides(newSides);
                                  }}
                                />
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center', p: 1 }}>
                                  <MilitarySymbolPreview
                                    standardIdentity={side.standardIdentity}
                                    echelon={unit.rootUnitEchelon || '18'}
                                    icon={unit.rootUnitIcon || '121000'}
                                    fillColor={side.symbolOptions?.fillColor}
                                    size={32}
                                    compact={true}
                                    symbologyStandard={formData.symbologyStandard}
                                    symbolOptions={side.symbolOptions || {}}
                                  />
                                </Box>
                              </Grid>
                            </Grid>
                            
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                              <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                  <InputLabel>آیکون اصلی</InputLabel>
                                  <Select
                                    value={unit.rootUnitIcon || '121000'}
                                    label="آیکون اصلی"
                                    onChange={(e) => {
                                      const newSides = [...sides];
                                      newSides[sideIndex].units[unitIndex].rootUnitIcon = e.target.value;
                                      setSides(newSides);
                                    }}
                                  >
                                    {LAND_UNIT_ICONS.map((icon) => (
                                      <MenuItem key={icon.value} value={icon.value}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <MilitarySymbolPreview
                                            standardIdentity={side.standardIdentity}
                                            echelon={unit.rootUnitEchelon || '18'}
                                            icon={icon.value}
                                            fillColor={side.symbolOptions?.fillColor}
                                            size={20}
                                            compact={true}
                                            symbologyStandard={formData.symbologyStandard}
                                            symbolOptions={side.symbolOptions || {}}
                                          />
                                          <Typography variant="body2">{icon.text}</Typography>
                                        </Box>
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                  <InputLabel>رده</InputLabel>
                                  <Select
                                    value={unit.rootUnitEchelon || '18'}
                                    label="رده"
                                    onChange={(e) => {
                                      const newSides = [...sides];
                                      newSides[sideIndex].units[unitIndex].rootUnitEchelon = e.target.value;
                                      setSides(newSides);
                                    }}
                                  >
                                    {getEchelonOptions().map((echelon) => (
                                      <MenuItem key={echelon.value} value={echelon.value}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <MilitarySymbolPreview
                                            standardIdentity={side.standardIdentity}
                                            echelon={echelon.value}
                                            icon={unit.rootUnitIcon || '121000'}
                                            fillColor={side.symbolOptions?.fillColor}
                                            size={20}
                                            compact={true}
                                            symbologyStandard={formData.symbologyStandard}
                                            symbolOptions={side.symbolOptions || {}}
                                          />
                                          <Typography variant="body2">{echelon.label}</Typography>
                                        </Box>
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>
                            </Grid>
                            
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              نگران نباشید اگر نمی‌توانید آیکون مناسب را پیدا کنید. می‌توانید بعداً آن را تغییر دهید.
                            </Typography>
                          {side.units.length > 1 && (
                            <Button
                              size="small"
                              color="error"
                              startIcon={<Delete />}
                              onClick={() => handleRemoveUnit(sideIndex, unitIndex)}
                              sx={{ mt: 1 }}
                            >
                              حذف واحد
                            </Button>
                          )}
                          {unitIndex < side.units.length - 1 && <Divider sx={{ mt: 2 }} />}
                        </Box>
                      ))}
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Add />}
                          onClick={() => handleAddRootUnit(sideIndex)}
                          disabled={!side.units.length}
                        >
                          + افزودن واحد ریشه
                        </Button>
                        {side.units.length > 0 && (
                          <Button
                            size="small"
                            color="error"
                            startIcon={<Delete />}
                            onClick={() => handleRemoveUnit(sideIndex, side.units.length - 1)}
                            disabled={!side.units.length}
                          >
                            حذف واحد
                          </Button>
                        )}
                      </Box>
                      {sideIndex === sides.length - 1 && sides.length > 1 && (
                        <Button
                          size="small"
                          color="error"
                          startIcon={<Delete />}
                          onClick={() => handleRemoveSide(sideIndex)}
                          sx={{ mt: 2 }}
                        >
                          حذف طرف
                        </Button>
                      )}
                    </AccordionDetails>
                  </Accordion>
                ))}
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={handleAddSide}
                  >
                    + افزودن طرف
                  </Button>
                </Box>
              </Box>
            )}
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
                  زمان شروع سناریو
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  زمان شروع و منطقه زمانی را انتخاب کنید.
                </Typography>
              </Box>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="منطقه زمانی"
                  value={formData.timeZone}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeZone: e.target.value }))}
                  placeholder="UTC"
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="سال"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) || 0 }))}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="ماه"
                  type="number"
                  value={formData.month}
                  onChange={(e) => setFormData(prev => ({ ...prev, month: parseInt(e.target.value) || 0 }))}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="روز"
                  type="number"
                  value={formData.day}
                  onChange={(e) => setFormData(prev => ({ ...prev, day: parseInt(e.target.value) || 0 }))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="ساعت"
                  type="number"
                  value={formData.hour}
                  onChange={(e) => setFormData(prev => ({ ...prev, hour: parseInt(e.target.value) || 0 }))}
                  inputProps={{ min: 0, max: 23 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="دقیقه"
                  type="number"
                  value={formData.minute}
                  onChange={(e) => setFormData(prev => ({ ...prev, minute: parseInt(e.target.value) || 0 }))}
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
                  <Typography variant="body1" align="center" fontWeight="bold" color="primary.main">
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
                  جو و وضعیت جوی
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  پارامترهای جوی را برای زمان شروع سناریو مشخص کنید. (زمان و منطقه زمانی از مرحله ۳ استفاده می‌شود)
                </Typography>
              </Box>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>روشنایی</Divider>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>روشنایی</InputLabel>
                  <Select
                    value={weather.sunPhase}
                    label="روشنایی"
                    onChange={(e) => setWeather(prev => ({ ...prev, sunPhase: e.target.value as any }))}
                  >
                    <MenuItem value="day">روز</MenuItem>
                    <MenuItem value="night">شب</MenuItem>
                    <MenuItem value="dawn">طلوع</MenuItem>
                    <MenuItem value="dusk">غروب</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="زاویه خورشید (°)"
                  type="number"
                  value={weather.sunElevationDeg}
                  onChange={(e) => setWeather(prev => ({ ...prev, sunElevationDeg: parseFloat(e.target.value) || 0 }))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="وضعیت آسمان"
                  value={weather.sky}
                  onChange={(e) => setWeather(prev => ({ ...prev, sky: e.target.value }))}
                  placeholder="صاف / نیمه‌ابری / ابری"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>دما، رطوبت، فشار</Divider>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="دما (°C)"
                  type="number"
                  value={weather.temperatureC}
                  onChange={(e) => setWeather(prev => ({ ...prev, temperatureC: parseFloat(e.target.value) || 0 }))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="رطوبت نسبی (%)"
                  type="number"
                  value={weather.humidityPct}
                  onChange={(e) => setWeather(prev => ({ ...prev, humidityPct: parseFloat(e.target.value) || 0 }))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="فشار (hPa)"
                  type="number"
                  value={weather.pressureHpa}
                  onChange={(e) => setWeather(prev => ({ ...prev, pressureHpa: parseFloat(e.target.value) || 0 }))}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>باد</Divider>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="باد سطحی - سرعت (گره)"
                  type="number"
                  value={weather.windSurfaceSpeedKt}
                  onChange={(e) => setWeather(prev => ({ ...prev, windSurfaceSpeedKt: parseFloat(e.target.value) || 0 }))}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="باد سطحی - سمت (°)"
                  type="number"
                  value={weather.windSurfaceDirDeg}
                  onChange={(e) => setWeather(prev => ({ ...prev, windSurfaceDirDeg: parseFloat(e.target.value) || 0 }))}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="باد لایه بالاتر - سرعت (گره)"
                  type="number"
                  value={weather.windUpperSpeedKt}
                  onChange={(e) => setWeather(prev => ({ ...prev, windUpperSpeedKt: parseFloat(e.target.value) || 0 }))}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="باد لایه بالاتر - سمت (°)"
                  type="number"
                  value={weather.windUpperDirDeg}
                  onChange={(e) => setWeather(prev => ({ ...prev, windUpperDirDeg: parseFloat(e.target.value) || 0 }))}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>بارش</Divider>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>نوع بارش</InputLabel>
                  <Select
                    value={weather.precipitationType}
                    label="نوع بارش"
                    onChange={(e) => setWeather(prev => ({ ...prev, precipitationType: e.target.value as any }))}
                  >
                    <MenuItem value="none">بدون بارش</MenuItem>
                    <MenuItem value="rain">باران</MenuItem>
                    <MenuItem value="snow">برف</MenuItem>
                    <MenuItem value="hail">تگرگ</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="شدت (mm/h)"
                  type="number"
                  value={weather.precipitationIntensity}
                  onChange={(e) => setWeather(prev => ({ ...prev, precipitationIntensity: parseFloat(e.target.value) || 0 }))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="مدت (دقیقه)"
                  type="number"
                  value={weather.precipitationDurationMin}
                  onChange={(e) => setWeather(prev => ({ ...prev, precipitationDurationMin: parseFloat(e.target.value) || 0 }))}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>ابر و دید</Divider>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="سقف ابر (ft)"
                  type="number"
                  value={weather.cloudCeilingFt}
                  onChange={(e) => setWeather(prev => ({ ...prev, cloudCeilingFt: parseFloat(e.target.value) || 0 }))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="پوشش ابر (%)"
                  type="number"
                  value={weather.cloudCoveragePct}
                  onChange={(e) => setWeather(prev => ({ ...prev, cloudCoveragePct: parseFloat(e.target.value) || 0 }))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="برد دید افقی (km)"
                  type="number"
                  value={weather.visibilityKm}
                  onChange={(e) => setWeather(prev => ({ ...prev, visibilityKm: parseFloat(e.target.value) || 0 }))}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>وضعیت زمین</Divider>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>وضعیت زمین</InputLabel>
                  <Select
                    value={weather.groundCondition}
                    label="وضعیت زمین"
                    onChange={(e) => setWeather(prev => ({ ...prev, groundCondition: e.target.value as any }))}
                  >
                    <MenuItem value="dry">خشک</MenuItem>
                    <MenuItem value="semi-wet">نیمه‌مرطوب</MenuItem>
                    <MenuItem value="muddy">گل‌آلود</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={weather.groundIcing}
                      onChange={(e) => setWeather(prev => ({ ...prev, groundIcing: e.target.checked }))}
                    />
                  }
                  label="یخ‌زدگی سطح"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="تلفات انرژی حرکت (%)"
                  type="number"
                  value={weather.movementEnergyLossPct}
                  onChange={(e) => setWeather(prev => ({ ...prev, movementEnergyLossPct: parseFloat(e.target.value) || 0 }))}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>کیفیت هوا / گردوغبار</Divider>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="شاخص کیفیت هوا (AQI)"
                  type="number"
                  value={weather.airQualityIndex}
                  onChange={(e) => setWeather(prev => ({ ...prev, airQualityIndex: parseFloat(e.target.value) || 0 }))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>گردوغبار</InputLabel>
                  <Select
                    value={weather.dustLevel}
                    label="گردوغبار"
                    onChange={(e) => setWeather(prev => ({ ...prev, dustLevel: e.target.value as any }))}
                  >
                    <MenuItem value="low">کم</MenuItem>
                    <MenuItem value="medium">متوسط</MenuItem>
                    <MenuItem value="high">زیاد</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="کاهش دید به‌علت گردوغبار (%)"
                  type="number"
                  value={weather.visibilityReductionPct}
                  onChange={(e) => setWeather(prev => ({ ...prev, visibilityReductionPct: parseFloat(e.target.value) || 0 }))}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 4:
        return (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                <Typography variant="h6">5</Typography>
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  اهداف و برچسب‌ها
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  اهداف سناریو و برچسب‌های مربوطه را مشخص کنید.
                </Typography>
              </Box>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  اهداف سناریو
                </Typography>
                <Stack spacing={2}>
                  {formData.objectives.map((objective, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth
                        placeholder={`هدف ${index + 1}`}
                        value={objective}
                        onChange={(e) => handleObjectiveChange(index, e.target.value)}
                      />
                      <Button
                        color="error"
                        onClick={() => handleRemoveObjective(index)}
                      >
                        حذف
                      </Button>
                    </Box>
                  ))}
                  <Button
                    variant="outlined"
                    onClick={handleAddObjective}
                  >
                    افزودن هدف
                  </Button>
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  برچسب‌ها
                </Typography>
                <Stack spacing={2}>
                  {formData.tags.map((tag, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth
                        placeholder="برچسب"
                        value={tag}
                        onChange={(e) => handleTagChange(index, e.target.value)}
                      />
                      <Button
                        color="error"
                        onClick={() => handleRemoveTag(index)}
                      >
                        حذف
                      </Button>
                    </Box>
                  ))}
                  <Button
                    variant="outlined"
                    onClick={handleAddTag}
                  >
                    افزودن برچسب
                  </Button>
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="زمان پایان سناریو"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>وضعیت سناریو</InputLabel>
                  <Select
                    value={formData.status}
                    label="وضعیت سناریو"
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as ScenarioStatus }))}
                  >
                    <MenuItem value="draft">پیش‌نویس</MenuItem>
                    <MenuItem value="active">فعال</MenuItem>
                    <MenuItem value="paused">متوقف</MenuItem>
                    <MenuItem value="completed">تکمیل شده</MenuItem>
                    <MenuItem value="archived">آرشیو شده</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        );

      case 5:
        return (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                <Typography variant="h6">6</Typography>
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  مرور نهایی
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  خلاصه‌ای از تنظیمات سناریو را بررسی کنید و در صورت نیاز بازگردید و اصلاح کنید.
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
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    نام سناریو
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formData.name || '---'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    کد سناریو
                  </Typography>
                  <Typography variant="body1" fontFamily="monospace">
                    {formData.scenarioCode}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
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
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    وضعیت جوی
                  </Typography>
                  <Typography variant="body1">
                    {weather.sky || '-'} | دید {weather.visibilityKm || 0} km | دما {weather.temperatureC || 0}°C
                  </Typography>
                </Grid>
                {formData.authorName && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      نویسنده
                    </Typography>
                    <Typography variant="body1">
                      {formData.authorName}
                    </Typography>
                  </Grid>
                )}
                {formData.purpose && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      هدف سناریو
                    </Typography>
                    <Typography variant="body1">
                      {formData.purpose === 'operational' ? 'عملیاتی' : 
                       formData.purpose === 'educational' ? 'آموزشی' : 
                       formData.purpose === 'training' ? 'تمرینی' : formData.purpose}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    وضعیت سناریو
                  </Typography>
                  <Chip 
                    label={
                      formData.status === 'draft' ? 'پیش‌نویس' :
                      formData.status === 'active' ? 'فعال' :
                      formData.status === 'paused' ? 'متوقف' :
                      formData.status === 'completed' ? 'تکمیل شده' :
                      formData.status === 'archived' ? 'آرشیو شده' : formData.status
                    }
                    color={
                      formData.status === 'active' ? 'success' :
                      formData.status === 'paused' ? 'warning' :
                      formData.status === 'completed' ? 'info' :
                      formData.status === 'archived' ? 'default' : 'default'
                    }
                    size="small"
                  />
                </Grid>
                {formData.objectives.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      اهداف ({formData.objectives.filter(o => o.trim()).length})
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {formData.objectives.filter(o => o.trim()).map((obj, idx) => (
                        <Chip key={idx} label={obj} size="small" />
                      ))}
                    </Stack>
                  </Grid>
                )}
                {formData.tags.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      برچسب‌ها ({formData.tags.filter(t => t.trim()).length})
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {formData.tags.filter(t => t.trim()).map((tag, idx) => (
                        <Chip key={idx} label={tag} size="small" color="primary" variant="outlined" />
                      ))}
                    </Stack>
                  </Grid>
                )}
                {sides.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      طرف‌ها ({sides.length})
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
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
      PaperProps={{
        sx: {
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">ایجاد سناریوی جدید</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 2 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>لغو</Button>
        <Box sx={{ flex: 1 }} />
        {activeStep > 0 && (
          <Button onClick={handleBack} startIcon={<ArrowBack />}>
            مرحله قبل
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={<ArrowForward />}
          >
            مرحله بعد
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!formData.name.trim()}
          >
            ایجاد سناریو
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default NewScenarioDialog;

