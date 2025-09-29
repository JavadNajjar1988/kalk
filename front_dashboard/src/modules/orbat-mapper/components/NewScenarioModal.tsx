import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  IconButton,
  Select,
  MenuItem,
  InputLabel,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ExpandMore as ExpandMoreIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import MilitarySymbol from './MilitarySymbol';

interface NewScenarioModalProps {
  open: boolean;
  onClose: () => void;
  onCreateScenario: (scenarioData: ScenarioFormData) => void;
}

// Types based on Orbat data models
export interface ScenarioFormData {
  name: string;
  description: string;
  startTime: Date;
  timeZone: string;
  symbologyStandard: 'app6' | '2525';
  noInitialOrbat: boolean;
  sides: SideFormData[];
}

export interface SideFormData {
  name: string;
  standardIdentity: StandardIdentity;
  fillColor?: string;
  units: RootUnitData[];
}

export interface RootUnitData {
  name: string;
  echelon: string;
  icon: string;
}

export type StandardIdentity = '0' | '1' | '2' | '3' | '4' | '5' | '6'; // All military standard identities: Pending, Unknown, Assumed Friend, Friend, Neutral, Suspect, Hostile

const NewScenarioModal: React.FC<NewScenarioModalProps> = ({
  open,
  onClose,
  onCreateScenario,
}) => {
  const [formData, setFormData] = useState<ScenarioFormData>({
    name: 'سناریوی جدید',
    description: '',
    startTime: new Date(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    symbologyStandard: 'app6',
    noInitialOrbat: false,
    sides: [
      {
        name: 'طرف ۱',
        standardIdentity: '3', // Friend
        fillColor: '#80e0ff',
        units: [{ name: 'ستاد', echelon: '18', icon: '121100' }],
      },
      {
        name: 'طرف ۲',
        standardIdentity: '6', // Hostile
        fillColor: '#ff8080',
        units: [{ name: 'ستاد', echelon: '18', icon: '121100' }],
      },
    ],
  });

  // Symbol options for different unit types
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

  // Colors for different sides
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

  const handleSubmit = () => {
    onCreateScenario(formData);
    onClose();
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          height: '90vh',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          ایجاد سناریوی جدید
        </Typography>
        <Button
          variant="outlined"
          size="small"
          sx={{ color: 'white', borderColor: 'white' }}
          startIcon={<HelpIcon />}
          href="https://docs.orbat-mapper.app/guide/getting-started"
          target="_blank"
        >
          مشاهده مستندات
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3, overflow: 'auto' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Basic Information */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                اطلاعات پایه سناریو
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                نام و توضیحی برای سناریوی خود ارائه دهید.
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="نام سناریو"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    variant="outlined"
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
                    rows={3}
                    variant="outlined"
                    placeholder="از نحو مارک‌داون برای قالب‌بندی استفاده کنید"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Initial ORBAT */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                آرایش نبرد اولیه
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                طرف‌ها و واحدهای ریشه.
              </Typography>
              
              <FormGroup sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.noInitialOrbat}
                      onChange={(e) => setFormData({ ...formData, noInitialOrbat: e.target.checked })}
                    />
                  }
                  label="طرف‌ها و واحدهای ریشه را بعداً اضافه کن"
                />
              </FormGroup>

              {!formData.noInitialOrbat && (
                <Box>
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

                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                        واحدهای ریشه
                      </Typography>

                      {side.units.map((unit, unitIndex) => (
                        <Box key={unitIndex} sx={{ mb: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={4}>
                              <TextField
                                fullWidth
                                label="نام واحد ریشه"
                                value={unit.name}
                                onChange={(e) => updateUnit(sideIndex, unitIndex, { name: e.target.value })}
                              />
                            </Grid>
                            <Grid item xs={12} md={3}>
                              <FormControl fullWidth>
                                <InputLabel>آیکون اصلی</InputLabel>
                                <Select
                                  value={unit.icon}
                                  label="آیکون اصلی"
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
                                  label="رده"
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
                            <Grid item xs={12} md={2}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                          
                          {/* Helper text */}
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                            نگران نباشید اگر نمی‌توانید آیکون مناسب را پیدا کنید. می‌توانید بعداً آن را تغییر دهید.
                          </Typography>
                        </Box>
                      ))}

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => addUnit(sideIndex)}
                        >
                          افزودن واحد ریشه
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
                    sx={{ mt: 1 }}
                  >
                    افزودن طرف
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Start Time */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                زمان شروع سناریو
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                زمان شروع و منطقه زمانی را انتخاب کنید.
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>منطقه زمانی</InputLabel>
                    <Select
                      value={formData.timeZone}
                      label="منطقه زمانی"
                      onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })}
                    >
                      {timeZones.map((tz) => (
                        <MenuItem key={tz} value={tz}>
                          {tz}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="تاریخ و زمان شروع"
                    type="datetime-local"
                    value={formData.startTime.toISOString().slice(0, 16)}
                    onChange={(e) => setFormData({ ...formData, startTime: new Date(e.target.value) })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                  {formData.startTime.toLocaleString('fa-IR', { 
                    timeZone: formData.timeZone,
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Symbology Standard */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                استاندارد نمادشناسی
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                استاندارد نمادشناسی که ترجیح می‌دهید استفاده کنید را انتخاب کنید.
              </Typography>
              
              <FormControl component="fieldset">
                <RadioGroup
                  value={formData.symbologyStandard}
                  onChange={(e) => setFormData({ ...formData, symbologyStandard: e.target.value as 'app6' | '2525' })}
                >
                  <FormControlLabel
                    value="app6"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          APP-6
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          نسخه ناتو
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="2525"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          MIL-STD-2525D
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          نسخه آمریکایی
                        </Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>
            </CardContent>
          </Card>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button onClick={onClose} variant="outlined">
          لغو
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          ایجاد سناریو
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewScenarioModal;