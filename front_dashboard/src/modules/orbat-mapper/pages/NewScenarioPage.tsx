import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  Divider,
  IconButton,
  Select,
  MenuItem,
  InputLabel,
  Paper,
  Step,
  StepLabel,
  Stepper,
  Chip,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
  Help as HelpIcon,
  ExpandMore as ExpandMoreIcon,
  Map as MapIcon,
  Settings as SettingsIcon,
  Group as GroupIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store';
import { createScenario } from '@/store/slices/scenariosSlice';
import { showSuccessNotification, showErrorNotification } from '@/store/slices/uiSlice';
import MilitarySymbol from '../components/MilitarySymbol';

// Types
export interface ScenarioFormData {
  name: string;
  description: string;
  startTime: Date;
  endTime?: Date;
  timeZone: string;
  symbologyStandard: 'app6' | '2525';
  noInitialOrbat: boolean;
  sides: SideFormData[];
  objectives: string[];
  location: {
    name: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  weather: {
    condition: string;
    temperature: number;
    visibility: string;
  };
  terrain: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

export interface SideFormData {
  name: string;
  standardIdentity: StandardIdentity;
  fillColor?: string;
  units: RootUnitData[];
  doctrine: string;
  strength: number;
}

export interface RootUnitData {
  name: string;
  echelon: string;
  icon: string;
  strength?: number;
  equipment?: string[];
}

export type StandardIdentity = '0' | '1' | '2' | '3' | '4' | '5' | '6'; // All military standard identities: Pending, Unknown, Assumed Friend, Friend, Neutral, Suspect, Hostile

const steps = [
  'اطلاعات پایه',
  'شرایط محیطی', 
  'طرف‌ها و نیروها',
  'اهداف و تنظیمات',
  'بررسی نهایی'
];

const NewScenarioPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ScenarioFormData>({
    name: '',
    description: '',
    startTime: new Date(),
    endTime: undefined,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    symbologyStandard: 'app6',
    noInitialOrbat: false,
    sides: [
      {
        name: 'طرف ۱',
        standardIdentity: '3',
        fillColor: '#80e0ff',
        units: [{ name: 'ستاد', echelon: '18', icon: '121100' }],
        doctrine: 'offensive',
        strength: 100,
      },
      {
        name: 'طرف ۲',
        standardIdentity: '6',
        fillColor: '#ff8080',
        units: [{ name: 'ستاد', echelon: '18', icon: '121100' }],
        doctrine: 'defensive',
        strength: 100,
      },
    ],
    objectives: [''],
    location: {
      name: '',
    },
    weather: {
      condition: 'clear',
      temperature: 20,
      visibility: 'good',
    },
    terrain: 'mixed',
    difficulty: 'intermediate',
    tags: [],
  });

  // Data for form options
  const unitIcons = [
    { code: '000000', name: 'نامشخص' },
    { code: '110000', name: 'فرماندهی و کنترل' },
    { code: '121100', name: 'پیاده‌نظام' },
    { code: '121000', name: 'ترکیبی' },
    { code: '121102', name: 'مکانیزه' },
    { code: '130300', name: 'توپخانه' },
    { code: '120500', name: 'زرهی' },
    { code: '160600', name: 'پشتیبانی رزمی' },
  ];

  const echelonOptions = [
    { code: '00', name: 'نامشخص' },
    { code: '11', name: 'تیم/خدمه' },
    { code: '12', name: 'جوخه' },
    { code: '13', name: 'بخش' },
    { code: '14', name: 'دسته/گروه جداشده' },
    { code: '15', name: 'گردان/باتری/سرباز' },
    { code: '16', name: 'تابور/اسکادران' },
    { code: '17', name: 'هنگ/گروه' },
    { code: '18', name: 'تیپ' },
    { code: '21', name: 'لشکر' },
    { code: '22', name: 'سپاه/MEF' },
    { code: '23', name: 'ارتش' },
    { code: '24', name: 'گروه ارتش/جبهه' },
  ];

  const fillColors = [
    { value: '#80e0ff', name: 'آبی (استاندارد)', type: 'friend' },
    { value: '#ff8080', name: 'قرمز (استاندارد)', type: 'hostile' },
    { value: '#aaffaa', name: 'سبز (استاندارد)', type: 'neutral' },
    { value: '#ffff80', name: 'زرد (استاندارد)', type: 'unknown' },
    { value: '#ffa1ff', name: 'صورتی (غیرنظامی)', type: 'civilian' },
  ];

  const timeZones = [
    'UTC',
    'Asia/Tehran',
    'Asia/Baghdad',
    'Europe/Berlin',
    'America/New_York',
    'Asia/Tokyo',
  ];

  const weatherConditions = [
    { value: 'clear', name: 'آفتابی' },
    { value: 'cloudy', name: 'ابری' },
    { value: 'rainy', name: 'بارانی' },
    { value: 'snowy', name: 'برفی' },
    { value: 'foggy', name: 'مه‌آلود' },
    { value: 'stormy', name: 'طوفانی' },
  ];

  const terrainTypes = [
    { value: 'urban', name: 'شهری' },
    { value: 'desert', name: 'بیابانی' },
    { value: 'mountain', name: 'کوهستانی' },
    { value: 'forest', name: 'جنگلی' },
    { value: 'coastal', name: 'ساحلی' },
    { value: 'mixed', name: 'متنوع' },
  ];

  const suggestionTags = [
    'آموزشی', 'تاکتیکی', 'استراتژیک', 'تاریخی', 'شهری', 'صحرایی',
    'دفاعی', 'تهاجمی', 'پیاده‌نظام', 'زرهی', 'هوایی', 'دریایی'
  ];

  // Generate SIDC for symbol preview
  const generateSidc = (unit: RootUnitData, standardIdentity: StandardIdentity): string => {
    // SIDC structure: version(2) + context(1) + standardIdentity(1) + symbolSet(2) + status(1) + hqtfd(1) + amplifier(1) + amplifierDescriptor(1) + entity(2) + entityType(2) + entitySubType(2) + modifierOne(2) + modifierTwo(2)
    const version = '10';
    const context = '0';
    const symbolSet = '10'; // Land unit
    const status = '0';
    const hqtfd = '0';
    
    // Properly handle echelon mapping - this is crucial for echelon symbols
    const echelonCode = unit.echelon || '00';
    const amplifier = echelonCode.length >= 1 ? echelonCode.substring(0, 1) : '0';
    const amplifierDescriptor = echelonCode.length >= 2 ? echelonCode.substring(1, 2) : '0';
    
    // Map icon to entity parts
    const icon = unit.icon.padEnd(6, '0');
    const entity = icon.substring(0, 2);
    const entityType = icon.substring(2, 4);
    const entitySubType = icon.substring(4, 6);
    const modifierOne = '00';
    const modifierTwo = '00';
    
    const result = version + context + standardIdentity + symbolSet + status + hqtfd + amplifier + amplifierDescriptor + entity + entityType + entitySubType + modifierOne + modifierTwo;
    
    // Debug log to verify SIDC construction and echelon mapping
    console.log('🔍 SIDC Generation Debug:', {
      unit: unit.name,
      echelon: echelonCode,
      amplifier: `'${amplifier}'`,
      amplifierDescriptor: `'${amplifierDescriptor}'`,
      icon: unit.icon,
      entity,
      entityType,
      entitySubType,
      finalSidc: result,
      sidcLength: result.length,
      positions: {
        amplifier_pos8: result[8],
        amplifierDescriptor_pos9: result[9]
      }
    });
    
    // Verify SIDC is exactly 20 characters
    if (result.length !== 20) {
      console.error('❌ INVALID SIDC LENGTH:', result.length, 'Expected: 20');
    }
    
    return result;
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const validateCurrentStep = (): boolean => {
    switch (activeStep) {
      case 0: // Basic Information
        return formData.name.trim() !== '' && formData.description.trim() !== '';
      case 1: // Environmental Conditions
        return formData.location.name.trim() !== '';
      case 2: // Sides and Forces
        return formData.sides.length > 0 && formData.sides.every(side => 
          side.name.trim() !== '' && side.units.length > 0
        );
      case 3: // Objectives and Settings
        return formData.objectives.some(obj => obj.trim() !== '');
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const scenarioData = {
        ...formData,
        startTime: formData.startTime.toISOString(),
        endTime: formData.endTime?.toISOString(),
      };
      
      const result = await dispatch(createScenario(scenarioData)).unwrap();
      dispatch(showSuccessNotification(`سناریو "${result.name}" با موفقیت ایجاد شد`));
      navigate(`/dashboard/orbat-mapper/scenario/${result.id}`);
    } catch (error) {
      dispatch(showErrorNotification('خطا در ایجاد سناریو'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSide = () => {
    setFormData({
      ...formData,
      sides: [
        ...formData.sides,
        {
          name: 'طرف جدید',
          standardIdentity: '3',
          fillColor: '#80e0ff',
          units: [{ name: 'ستاد', echelon: '18', icon: '121000' }],
          doctrine: 'offensive',
          strength: 100,
        },
      ],
    });
  };

  const removeSide = (index: number) => {
    if (formData.sides.length > 1) {
      const newSides = formData.sides.filter((_, i) => i !== index);
      setFormData({ ...formData, sides: newSides });
    }
  };

  const updateSide = (index: number, updates: Partial<SideFormData>) => {
    const newSides = [...formData.sides];
    newSides[index] = { ...newSides[index], ...updates };
    setFormData({ ...formData, sides: newSides });
  };

  const addUnit = (sideIndex: number) => {
    const newSides = [...formData.sides];
    newSides[sideIndex].units.push({
      name: 'واحد جدید',
      echelon: '18',
      icon: '121000',
    });
    setFormData({ ...formData, sides: newSides });
  };

  const removeUnit = (sideIndex: number, unitIndex: number) => {
    if (formData.sides[sideIndex].units.length > 1) {
      const newSides = [...formData.sides];
      newSides[sideIndex].units.splice(unitIndex, 1);
      setFormData({ ...formData, sides: newSides });
    }
  };

  const updateUnit = (sideIndex: number, unitIndex: number, updates: Partial<RootUnitData>) => {
    const newSides = [...formData.sides];
    newSides[sideIndex].units[unitIndex] = {
      ...newSides[sideIndex].units[unitIndex],
      ...updates,
    };
    setFormData({ ...formData, sides: newSides });
  };

  const addObjective = () => {
    setFormData({
      ...formData,
      objectives: [...formData.objectives, ''],
    });
  };

  const removeObjective = (index: number) => {
    if (formData.objectives.length > 1) {
      const newObjectives = formData.objectives.filter((_, i) => i !== index);
      setFormData({ ...formData, objectives: newObjectives });
    }
  };

  const updateObjective = (index: number, value: string) => {
    const newObjectives = [...formData.objectives];
    newObjectives[index] = value;
    setFormData({ ...formData, objectives: newObjectives });
  };

  const addTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag],
      });
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0: // Basic Information
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                اطلاعات پایه سناریو
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="نام سناریو"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    variant="outlined"
                    required
                    autoFocus
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="توضیحات"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    multiline
                    rows={4}
                    variant="outlined"
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="زمان شروع"
                    type="datetime-local"
                    value={formData.startTime.toISOString().slice(0, 16)}
                    onChange={(e) => setFormData({ ...formData, startTime: new Date(e.target.value) })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>منطقه زمانی</InputLabel>
                    <Select
                      value={formData.timeZone}
                      label="منطقه زمانی"
                      onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })}
                    >
                      {timeZones.map((tz) => (
                        <MenuItem key={tz} value={tz}>{tz}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );

      case 1: // Environmental Conditions
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                شرایط محیطی
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="نام منطقه/موقعیت"
                    value={formData.location.name}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      location: { ...formData.location, name: e.target.value } 
                    })}
                    variant="outlined"
                    required
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>شرایط آب و هوا</InputLabel>
                    <Select
                      value={formData.weather.condition}
                      label="شرایط آب و هوا"
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        weather: { ...formData.weather, condition: e.target.value } 
                      })}
                    >
                      {weatherConditions.map((condition) => (
                        <MenuItem key={condition.value} value={condition.value}>
                          {condition.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="دما (درجه سلسیوس)"
                    type="number"
                    value={formData.weather.temperature}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      weather: { ...formData.weather, temperature: parseInt(e.target.value) || 0 } 
                    })}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>نوع زمین</InputLabel>
                    <Select
                      value={formData.terrain}
                      label="نوع زمین"
                      onChange={(e) => setFormData({ ...formData, terrain: e.target.value })}
                    >
                      {terrainTypes.map((terrain) => (
                        <MenuItem key={terrain.value} value={terrain.value}>
                          {terrain.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );

      case 2: // Sides and Forces
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                طرف‌ها و نیروها
              </Typography>
              
              {formData.sides.map((side, sideIndex) => (
                <Paper key={sideIndex} sx={{ p: 3, mb: 2, bgcolor: 'grey.50' }}>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="نام طرف"
                        value={side.name}
                        onChange={(e) => updateSide(sideIndex, { name: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>شناسایی استاندارد</InputLabel>
                        <Select
                          value={side.standardIdentity}
                          label="شناسایی استاندارد"
                          onChange={(e) => updateSide(sideIndex, { standardIdentity: e.target.value as StandardIdentity })}
                        >
                          <MenuItem value="0">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 16, height: 16, bgcolor: '#FFFF00', borderRadius: '50%', border: '1px solid #ccc' }} />
                              نامشخص
                            </Box>
                          </MenuItem>
                          <MenuItem value="1">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 16, height: 16, bgcolor: '#FFFF80', borderRadius: '50%', border: '1px solid #ccc' }} />
                              ناشناخته
                            </Box>
                          </MenuItem>
                          <MenuItem value="2">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 16, height: 16, bgcolor: '#80BFFF', borderRadius: '50%' }} />
                              دوست فرضی
                            </Box>
                          </MenuItem>
                          <MenuItem value="3">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 16, height: 16, bgcolor: '#0080FF', borderRadius: '50%' }} />
                              دوست
                            </Box>
                          </MenuItem>
                          <MenuItem value="4">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 16, height: 16, bgcolor: '#00FF00', borderRadius: '50%' }} />
                              خنثی
                            </Box>
                          </MenuItem>
                          <MenuItem value="5">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 16, height: 16, bgcolor: '#FF8000', borderRadius: '50%' }} />
                              مظنون
                            </Box>
                          </MenuItem>
                          <MenuItem value="6">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 16, height: 16, bgcolor: '#FF0000', borderRadius: '50%' }} />
                              دشمن
                            </Box>
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>رنگ پر</InputLabel>
                        <Select
                          value={side.fillColor || '#80e0ff'}
                          label="رنگ پر"
                          onChange={(e) => updateSide(sideIndex, { fillColor: e.target.value })}
                        >
                          {fillColors.map((color) => (
                            <MenuItem key={color.value} value={color.value}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 16, height: 16, bgcolor: color.value, borderRadius: '4px', border: '1px solid #ccc' }} />
                                {color.name}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  {side.units.map((unit, unitIndex) => (
                    <Box key={unitIndex} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            label="نام واحد"
                            value={unit.name}
                            onChange={(e) => updateUnit(sideIndex, unitIndex, { name: e.target.value })}
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <FormControl fullWidth>
                            <InputLabel>آیکون</InputLabel>
                            <Select
                              value={unit.icon}
                              onChange={(e) => updateUnit(sideIndex, unitIndex, { icon: e.target.value })}
                            >
                              {unitIcons.map((icon) => (
                                <MenuItem key={icon.code} value={icon.code}>
                                  {icon.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <FormControl fullWidth>
                            <InputLabel>رده</InputLabel>
                            <Select
                              value={unit.echelon}
                              onChange={(e) => updateUnit(sideIndex, unitIndex, { echelon: e.target.value })}
                            >
                              {echelonOptions.map((option) => (
                                <MenuItem key={option.code} value={option.code}>
                                  {option.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                            <MilitarySymbol
                              sidc={generateSidc(unit, side.standardIdentity)}
                              size={48}
                              options={{ 
                                fillColor: side.fillColor
                              }}
                            />
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeUnit(sideIndex, unitIndex)}
                              disabled={side.units.length <= 1}
                            >
                              <RemoveIcon />
                            </IconButton>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  ))}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => addUnit(sideIndex)}
                    >
                      افزودن واحد
                    </Button>
                    <Button
                      variant="text"
                      size="small"
                      color="error"
                      onClick={() => removeSide(sideIndex)}
                      disabled={formData.sides.length <= 1}
                    >
                      حذف طرف
                    </Button>
                  </Box>
                </Paper>
              ))}

              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addSide}
              >
                افزودن طرف
              </Button>
            </CardContent>
          </Card>
        );
        
      case 3: // Objectives and Settings
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                اهداف و تنظیمات
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                    اهداف آموزشی
                  </Typography>
                  {formData.objectives.map((objective, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <TextField
                        fullWidth
                        label={`هدف ${index + 1}`}
                        value={objective}
                        onChange={(e) => updateObjective(index, e.target.value)}
                        variant="outlined"
                      />
                      <IconButton
                        color="error"
                        onClick={() => removeObjective(index)}
                        disabled={formData.objectives.length <= 1}
                      >
                        <RemoveIcon />
                      </IconButton>
                    </Box>
                  ))}
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={addObjective}
                  >
                    افزودن هدف
                  </Button>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                    برچسب‌ها
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {formData.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        onDelete={() => removeTag(tag)}
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                  <Box>
                    {suggestionTags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        variant="outlined"
                        onClick={() => addTag(tag)}
                        sx={{ mr: 1, mb: 1, cursor: 'pointer' }}
                        disabled={formData.tags.includes(tag)}
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );
        
      case 4: // Final Review
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                بررسی نهایی
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        اطلاعات کلی
                      </Typography>
                      <Typography variant="body2"><strong>نام:</strong> {formData.name}</Typography>
                      <Typography variant="body2"><strong>موقعیت:</strong> {formData.location.name}</Typography>
                      <Typography variant="body2"><strong>زمان شروع:</strong> {formData.startTime.toLocaleDateString('fa-IR')}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        طرف‌ها
                      </Typography>
                      {formData.sides.map((side, index) => (
                        <Typography key={index} variant="body2">
                          <strong>{side.name}:</strong> {side.units.length} واحد
                        </Typography>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Alert severity="info">
                    با کلیک بر “ایجاد سناریو” سناریوی جدید شما ذخیره و به صفحه ویرایش هدایت خواهید شد.
                  </Alert>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );
        
      default:
        return null;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link 
              color="inherit" 
              onClick={() => navigate('/dashboard/orbat-mapper')}
              sx={{ textDecoration: 'none', cursor: 'pointer' }}
            >
              کالک نگار
            </Link>
            <Typography color="text.primary">ایجاد سناریوی جدید</Typography>
          </Breadcrumbs>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              ایجاد سناریوی جدید
            </Typography>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/dashboard/orbat-mapper')}
            >
              بازگشت
            </Button>
          </Box>
        </Box>

        {/* Stepper */}
        <Box sx={{ mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Step Content */}
        <Box sx={{ mb: 4 }}>
          {renderStepContent(activeStep)}
        </Box>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            قبلی
          </Button>
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={isSubmitting || !validateCurrentStep()}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                {isSubmitting ? 'در حال ایجاد...' : 'ایجاد سناریو'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!validateCurrentStep()}
              >
                بعدی
              </Button>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default NewScenarioPage;