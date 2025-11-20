/**
 * ScenarioOrbatForm Component
 * فرم تنظیمات ORBAT برای سناریوی جدید
 */

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  FormLabel,
  FormControlLabel,
  Switch,
  TextField,
  Button,
  IconButton,
  Grid,
  Divider,
  Select,
  MenuItem,
  InputLabel,
  Chip,
  Alert,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Groups as GroupsIcon,
  MilitaryTech as MilitaryTechIcon
} from '@mui/icons-material';
import type { 
  InitialSideData, 
  RootUnitConfig,
  NewScenarioFormErrors 
} from '../types/new-scenario';
import MilitarySymbolPreview from './MilitarySymbolPreview';
import { 
  getStandardIdentityOptions, 
  getEchelonOptions, 
  getLandUnitIcons
} from '../constants/militarySymbols';
import { useSymbolSync } from '../services/symbolSyncService';

interface ScenarioOrbatFormProps {
  formData: {
    noInitialOrbat: boolean;
    sides: InitialSideData[];
    symbologyStandard: 'app6' | '2525';
  };
  errors: Pick<NewScenarioFormErrors, 'sides'>;
  onFieldChange: (field: string, value: any) => void;
  onAddSide: () => void;
  onRemoveSide: (index: number) => void;
  onUpdateSide: (index: number, field: string, value: any) => void;
  onAddUnit: (sideIndex: number) => void;
  onRemoveUnit: (sideIndex: number, unitIndex: number) => void;
  onUpdateUnit: (sideIndex: number, unitIndex: number, field: string, value: any) => void;
}

// Use centralized symbol definitions (مطابق با Vue ORBAT)
const STANDARD_IDENTITY_OPTIONS = getStandardIdentityOptions();
const ECHELON_OPTIONS = getEchelonOptions();
const UNIT_ICON_OPTIONS = getLandUnitIcons();

const ScenarioOrbatForm: React.FC<ScenarioOrbatFormProps> = ({
  formData,
  errors,
  onFieldChange,
  onAddSide,
  onRemoveSide,
  onUpdateSide,
  onAddUnit,
  onRemoveUnit,
  onUpdateUnit
}) => {
  const theme = useTheme();
  
  // Initialize symbol sync service for real-time sync
  const symbolSync = useSymbolSync({
    enableRealtimeSync: true,
    preserveOriginalFunctionality: true,
    onSymbolChange: (event) => {
      // Handle real-time changes from ORBAT (if needed)
      console.log('Symbol change from ORBAT:', event);
    }
  });

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <MilitaryTechIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
        <Typography variant="h6" component="h2">
          تنظیمات ORBAT
        </Typography>
      </Box>

      {/* Validation Summary */}
      {!formData.noInitialOrbat && (
        <Box sx={{ mb: 2 }}>
          {formData.sides.some(side => !side.name.trim()) && (
            <Alert severity="warning" sx={{ mb: 1 }}>
              برخی اطراف بدون نام هستند
            </Alert>
          )}
          {formData.sides.some(side => side.units.some(unit => !unit.rootUnitName?.trim())) && (
            <Alert severity="warning" sx={{ mb: 1 }}>
              برخی واحدها بدون نام هستند
            </Alert>
          )}
        </Box>
      )}

      {/* No Initial ORBAT Toggle */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.noInitialOrbat}
              onChange={(e) => onFieldChange('noInitialOrbat', e.target.checked)}
              color="primary"
            />
          }
          label="سناریو بدون ORBAT اولیه"
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          در صورت انتخاب، سناریو بدون هیچ واحد اولیه‌ای ایجاد می‌شود
        </Typography>
      </FormControl>

      {/* Sides Configuration */}
      {!formData.noInitialOrbat && (
        <>
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <GroupsIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
              <Typography variant="h6">
                اطراف درگیری ({formData.sides.length})
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={onAddSide}
              size="small"
            >
              افزودن طرف
            </Button>
          </Box>

          {formData.sides.map((side, sideIndex) => (
            <Paper
              key={sideIndex}
              variant="outlined"
              sx={{ 
                p: 2, 
                mb: 2,
                bgcolor: theme.palette.background.default
              }}
            >
              {/* Side Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  طرف {sideIndex + 1}
                </Typography>
                {formData.sides.length > 1 && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onRemoveSide(sideIndex)}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>

              <Grid container spacing={2}>
                {/* Side Name */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="نام طرف"
                    value={side.name}
                    onChange={(e) => onUpdateSide(sideIndex, 'name', e.target.value)}
                    size="small"
                    error={!side.name.trim()}
                    helperText={!side.name.trim() ? 'نام طرف الزامی است' : ''}
                  />
                </Grid>

                {/* Standard Identity */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>هویت استاندارد</InputLabel>
                    <Select
                      value={side.standardIdentity}
                      label="هویت استاندارد"
                      onChange={(e) => onUpdateSide(sideIndex, 'standardIdentity', e.target.value)}
                    >
                      {STANDARD_IDENTITY_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <MilitarySymbolPreview
                              standardIdentity={option.value}
                              echelon="18"
                              icon="121100"
                              fillColor={option.color}
                              size={24}
                              showDetails={false}
                              compact={true}
                              symbologyStandard={formData.symbologyStandard}
                            />
                            <Typography variant="body2">{option.label}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Fill Color Picker */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ minWidth: 80 }}>
                      رنگ پر:
                    </Typography>
                    <input
                      type="color"
                      value={side.symbolOptions.fillColor || STANDARD_IDENTITY_OPTIONS.find(opt => opt.value === side.standardIdentity)?.color || '#0080ff'}
                      onChange={(e) => onUpdateSide(sideIndex, 'symbolOptions', { ...side.symbolOptions, fillColor: e.target.value })}
                      style={{
                        width: 40,
                        height: 32,
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {side.symbolOptions.fillColor || 'پیش‌فرض'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Units */}
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle2">
                    واحدهای اولیه ({side.units.length})
                  </Typography>
                  <Button
                    variant="text"
                    startIcon={<AddIcon />}
                    onClick={() => onAddUnit(sideIndex)}
                    size="small"
                  >
                    افزودن واحد
                  </Button>
                </Box>

                {side.units.map((unit, unitIndex) => (
                  <Paper
                    key={unitIndex}
                    variant="outlined"
                    sx={{ 
                      p: 2, 
                      mb: 1,
                      bgcolor: theme.palette.grey[50]
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      {/* Symbol Preview */}
                      <Grid item xs={12} md={2}>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <MilitarySymbolPreview
                            standardIdentity={side.standardIdentity}
                            echelon={unit.rootUnitEchelon || '18'}
                            icon={unit.rootUnitIcon || '121100'}
                            fillColor={side.symbolOptions.fillColor}
                            size={50}
                            showDetails={false}
                            compact={true}
                            symbologyStandard={formData.symbologyStandard}
                            symbolOptions={side.symbolOptions}
                          />
                        </Box>
                      </Grid>

                      {/* Unit Name */}
                      <Grid item xs={12} md={2.5}>
                        <TextField
                          fullWidth
                          label="نام واحد"
                          value={unit.rootUnitName || ''}
                          onChange={(e) => onUpdateUnit(sideIndex, unitIndex, 'rootUnitName', e.target.value)}
                          size="small"
                          error={!unit.rootUnitName?.trim()}
                          helperText={!unit.rootUnitName?.trim() ? 'نام واحد الزامی است' : ''}
                        />
                      </Grid>

                      {/* Echelon */}
                      <Grid item xs={12} md={2.5}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Echelon</InputLabel>
                          <Select
                            value={unit.rootUnitEchelon || '18'}
                            label="Echelon"
                            onChange={(e) => onUpdateUnit(sideIndex, unitIndex, 'rootUnitEchelon', e.target.value)}
                          >
                            {ECHELON_OPTIONS.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <MilitarySymbolPreview
                                    standardIdentity={side.standardIdentity}
                                    echelon={option.value}
                                    icon={unit.rootUnitIcon || '121100'}
                                    fillColor={side.symbolOptions.fillColor}
                                    size={24}
                                    showDetails={false}
                                    compact={true}
                                    symbologyStandard={formData.symbologyStandard}
                                    symbolOptions={side.symbolOptions}
                                  />
                                  <Typography variant="body2">{option.label}</Typography>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Main Symbol */}
                      <Grid item xs={12} md={2.5}>
                        <FormControl fullWidth size="small">
                          <InputLabel>نماد اصلی</InputLabel>
                          <Select
                            value={unit.rootUnitIcon || '121100'}
                            label="نماد اصلی"
                            onChange={(e) => onUpdateUnit(sideIndex, unitIndex, 'rootUnitIcon', e.target.value)}
                          >
                            {UNIT_ICON_OPTIONS.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <MilitarySymbolPreview
                                    standardIdentity={side.standardIdentity}
                                    echelon={unit.rootUnitEchelon || '18'}
                                    icon={option.value}
                                    fillColor={side.symbolOptions.fillColor}
                                    size={24}
                                    showDetails={false}
                                    compact={true}
                                    symbologyStandard={formData.symbologyStandard}
                                    symbolOptions={side.symbolOptions}
                                  />
                                  <Typography variant="body2">{option.label}</Typography>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Remove Unit */}
                      <Grid item xs={12} md={2.5}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          {side.units.length > 1 && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => onRemoveUnit(sideIndex, unitIndex)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Box>
            </Paper>
          ))}

          {/* Symbology Standard */}
          <Divider sx={{ my: 3 }} />
          
          <FormControl fullWidth>
            <InputLabel>استاندارد نمادشناسی</InputLabel>
            <Select
              value={formData.symbologyStandard}
              label="استاندارد نمادشناسی"
              onChange={(e) => onFieldChange('symbologyStandard', e.target.value)}
            >
              <MenuItem value="app6">APP-6 (ناتو)</MenuItem>
              <MenuItem value="2525">MIL-STD-2525D (آمریکایی)</MenuItem>
            </Select>
          </FormControl>
        </>
      )}

      {/* Errors */}
      {errors.sides && (
        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
          {typeof errors.sides === 'string' ? errors.sides : 'خطا در تنظیمات طرف‌ها'}
        </Typography>
      )}
    </Paper>
  );
};

export default ScenarioOrbatForm;
