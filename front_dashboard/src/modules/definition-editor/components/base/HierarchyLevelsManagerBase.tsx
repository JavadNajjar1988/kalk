import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Accordion, AccordionSummary, AccordionDetails, Paper,
  Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, alpha, useTheme, useMediaQuery
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Settings as SettingsIcon, Warning as WarningIcon, Close as CloseIcon } from '@mui/icons-material';
import { CategoryType, ExtendedHierarchyLevel } from '../../types';
import { DynamicHierarchyLevel } from '../../types';
import { useAppDispatch, useAppSelector } from '../../../../store';
import { 
  selectDynamicLevelsByCategory,
  addDynamicLevel,
  updateDynamicLevel,
  deleteDynamicLevel
} from '../../store';
import { loadCategoryLevels } from '../../data/loader';

// تعریف نوع داده برای دسته‌بندی محلی
interface LocalDefinitionCategory {
  id: string;
  name: string;
  englishName: string;
  description?: string;
  icon?: string;
  color?: string;
  maxLevels: number;
  isActive: boolean;
  order: number;
  useAccordion?: boolean;
}

interface HierarchyLevelsManagerBaseProps {
  categoryType: CategoryType;
  maxLevels?: number;
  onLevelsChange?: (levels: DynamicHierarchyLevel[]) => void;
}

const HierarchyLevelsManagerBase: React.FC<HierarchyLevelsManagerBaseProps> = ({ 
  categoryType
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const softSurface = useMemo(() => {
    const primary = (theme.palette.primary.main || '#4a90e2').toLowerCase();
    const hex = primary.replace('#', '');

    if (hex.includes('10b981') || hex.includes('4caf50') || hex.includes('2e7d32')) return '#f0f4f3';
    if (hex.includes('4a90e2') || hex.includes('1976d2') || hex.includes('2196f3')) return '#f0f4f8';
    if (hex.includes('ef4444') || hex.includes('f44336') || hex.includes('d32f2f')) return '#fbf1f0';
    if (hex.includes('6b21a8') || hex.includes('9c27b0') || hex.includes('673ab7')) return theme.palette.mode === 'dark' ? '#1f2330' : '#f3f0f9';
    if (hex.includes('f59e0b') || hex.includes('ff9800') || hex.includes('fb8c00')) return '#fbf5ef';

    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    const hexToRgb = (h: string) => {
      const norm = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
      const r = parseInt(norm.slice(0, 2), 16);
      const g = parseInt(norm.slice(2, 4), 16);
      const b = parseInt(norm.slice(4, 6), 16);
      return { r, g, b };
    };
    const rgbToHex = (r: number, g: number, b: number) =>
      `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
    const blendWithWhite = (h: string, primaryWeight = 0.1) => {
      const { r, g, b } = hexToRgb(h);
      const white = 255;
      const weight = 1 - primaryWeight;
      const br = white * weight + r * primaryWeight;
      const bg = white * weight + g * primaryWeight;
      const bb = white * weight + b * primaryWeight;
      return rgbToHex(br, bg, bb);
    };

    if (/^[0-9a-f]{3,6}$/.test(hex)) {
      return blendWithWhite(hex, 0.1);
    }

    try {
      const fallback = (theme.palette.primary.light || '#90caf9').toLowerCase().replace('#', '');
      return blendWithWhite(fallback, 0.08);
    } catch {
      return theme.palette.mode === 'dark' ? '#1f2430' : '#f5f7fa';
    }
  }, [theme]);

  const inputBaseSx = useMemo(() => ({
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      backgroundColor: theme.palette.mode === 'dark'
        ? alpha(theme.palette.background.paper, 0.65)
        : 'rgba(255, 255, 255, 0.9)',
      '& fieldset': { borderColor: alpha(theme.palette.primary.main, 0.2) },
      '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.4) },
      '&.Mui-focused fieldset': {
        borderColor: alpha(theme.palette.primary.main, 0.6),
        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}`
      },
    },
  }), [theme]);

  const secondaryButtonSx = useMemo(() => ({
    borderRadius: '12px',
    px: { xs: 2, sm: 3 },
    py: 1.2,
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    color: '#475569',
    border: '1px solid rgba(148, 163, 184, 0.25)',
    backdropFilter: 'blur(10px)',
    fontWeight: 600,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(148, 163, 184, 0.18)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 22px rgba(148, 163, 184, 0.24)',
    },
  }), [theme]);

  const primaryButtonSx = useMemo(() => ({
    borderRadius: '12px',
    px: { xs: 2.2, sm: 3.5 },
    py: 1.2,
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
    color: '#ffffff',
    border: '2px solid rgba(255, 255, 255, 0.4)',
    boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.32)}`,
    fontWeight: 700,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: `0 16px 44px ${alpha(theme.palette.primary.dark, 0.4)}`,
      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
    },
    '&:disabled': {
      background: 'rgba(148, 163, 184, 0.4)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      color: 'rgba(255, 255, 255, 0.85)',
      transform: 'none',
      boxShadow: 'none',
    },
  }), [theme]);

  // حالت‌های کامپوننت
  const [category, setCategory] = useState<LocalDefinitionCategory | null>(null);
  const dispatch = useAppDispatch();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<DynamicHierarchyLevel | null>(null);
  const [formData, setFormData] = useState<{name: string; englishName: string; order: number; isRequired: boolean; isActive: boolean;}>(
    { name: '', englishName: '', order: 1, isRequired: false, isActive: true }
  );
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<DynamicHierarchyLevel | null>(null);

  // بررسی اینکه آیا این دسته‌بندی از مدیریت سطوح سلسله‌مراتبی پشتیبانی می‌کند
  const supportsHierarchyLevels = categoryType !== CategoryType.EQUIPMENT && categoryType !== CategoryType.AMMUNITION;

  // تنظیم دسته‌بندی بر اساس categoryType
  useEffect(() => {
    const getCategoryConfig = (): LocalDefinitionCategory => {
      switch (categoryType) {
        case CategoryType.GEOGRAPHICAL:
          return {
            id: 'geographical',
            name: 'تقسیمات جغرافیایی',
            englishName: 'Geographical Divisions',
            description: 'مدیریت سطوح تقسیمات جغرافیایی',
            maxLevels: 9,
            isActive: true,
            order: 1,
            useAccordion: true
          };
        case CategoryType.MILITARY_RANKS:
          return {
            id: 'military_ranks',
            name: 'درجات نظامی',
            englishName: 'Military Ranks',
            description: 'مدیریت سطوح درجات نظامی',
            maxLevels: 3,
            isActive: true,
            order: 2,
            useAccordion: true
          };
        case CategoryType.MILITARY_UNITS:
          return {
            id: 'military_units',
            name: 'ساختار رده‌های نظامی',
            englishName: 'Unit Structures',
            description: 'مدیریت سطوح ساختار رده‌های نظامی',
            maxLevels: 11,
            isActive: true,
            order: 3,
            useAccordion: true
          };
        case CategoryType.MISSION_TYPE:
          return {
            id: 'mission_type',
            name: 'نوع مأموریت',
            englishName: 'Mission Type',
            description: 'مدیریت سطوح نوع مأموریت با ساختار 5 سطحه',
            maxLevels: 5,
            isActive: true,
            order: 5,
            useAccordion: true
          };
        case CategoryType.OPERATIONAL_STATUS:
          return {
            id: 'operational_status',
            name: 'وضعیت عملیاتی',
            englishName: 'Operational Status',
            description: 'مدیریت سطوح وضعیت عملیاتی با 12 سطح جامع',
            maxLevels: 12,
            isActive: true,
            order: 6,
            useAccordion: false
          };
        case CategoryType.OPERATIONAL_ENVIRONMENT:
          return {
            id: 'operational_environment',
            name: 'محیط عملیاتی',
            englishName: 'Operational Environment',
            description: 'مدیریت سطوح محیط عملیاتی',
            maxLevels: 12,
            isActive: true,
            order: 7,
            useAccordion: false
          };
        case CategoryType.TIME_DEFINITIONS:
          return {
            id: 'time_definitions',
            name: 'واحدهای زمان و دوره',
            englishName: 'Time Definitions',
            description: 'مدیریت سطوح واحدهای زمان با ساختار 5 سطحه',
            maxLevels: 5,
            isActive: true,
            order: 8,
            useAccordion: true
          };
        case CategoryType.CODING_CLASSIFICATION:
          return {
            id: 'coding_classification',
            name: 'تعاریف فنی و کدگذاری',
            englishName: 'Coding Classification',
            description: 'مدیریت سطوح تعاریف فنی',
            maxLevels: 5,
            isActive: true,
            order: 9,
            useAccordion: true
          };
        case CategoryType.FORCE_TYPE:
          return {
            id: 'force_type',
            name: 'نوع واحد نظامی',
            englishName: 'Military Unit Type',
            description: 'مدیریت سطوح نوع واحد نظامی',
            maxLevels: 4,
            isActive: true,
            order: 10,
            useAccordion: true
          };
        case CategoryType.ORGANIZATIONAL_AFFILIATION:
          return {
            id: 'organizational_affiliation',
            name: 'وابستگی سازمانی',
            englishName: 'Organizational Affiliation',
            description: 'مدیریت سطوح وابستگی سازمانی',
            maxLevels: 5,
            isActive: true,
            order: 11,
            useAccordion: true
          };

        case CategoryType.THREAT_TYPE:
          return {
            id: 'threat_type',
            name: 'نوع تهدید',
            englishName: 'Threat Type',
            description: 'مدیریت سطوح نوع تهدید با 12 دسته جامع',
            maxLevels: 12,
            isActive: true,
            order: 13,
            useAccordion: false
          };
        case CategoryType.INFO_CLASSIFICATION:
          return {
            id: 'info_classification',
            name: 'سطح طبقه‌بندی اطلاعات',
            englishName: 'Info Classification Level',
            description: 'مدیریت سطوح طبقه‌بندی اطلاعات با 12 سطح جامع',
            maxLevels: 12,
            isActive: true,
            order: 14,
            useAccordion: false
          };
        case CategoryType.LOGISTICS_STATUS:
          return {
            id: 'logistics_status',
            name: 'وضعیت لجستیکی',
            englishName: 'Logistics Status',
            description: 'مدیریت سطوح وضعیت لجستیکی با 12 سطح جامع',
            maxLevels: 12,
            isActive: true,
            order: 15,
            useAccordion: false
          };
        case CategoryType.WEATHER:
          return {
            id: 'weather',
            name: 'آب و هوا',
            englishName: 'Weather',
            description: 'مدیریت سطوح آب و هوا',
            maxLevels: 6,
            isActive: true,
            order: 17,
            useAccordion: true
          };
        default:
          return {
            id: 'default',
            name: 'دسته‌بندی پیش‌فرض',
            englishName: 'Default Category',
            description: 'مدیریت سطوح پیش‌فرض',
            maxLevels: 5,
            isActive: true,
            order: 0,
            useAccordion: true
          };
      }
    };

    setCategory(getCategoryConfig());
  }, [categoryType]);

  // سطوح از استور سراسری
  const levels = useAppSelector((state: any) => category ? selectDynamicLevelsByCategory(state, category.id) : []);

  // مقداردهی اولیه سطوح از JSON در صورت خالی بودن استور پویا
  useEffect(() => {
    let cancelled = false;
    async function bootstrapLevels() {
      if (!category || !supportsHierarchyLevels) return;
      if (levels && levels.length > 0) return;
      try {
        const jsonLevels: ExtendedHierarchyLevel[] = await loadCategoryLevels(categoryType);
        if (cancelled) return;
        (jsonLevels || [])
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .forEach((lvl) => {
            const newLevel: DynamicHierarchyLevel = {
              id: lvl.id || `level-${lvl.order || Date.now()}`,
              categoryId: category.id,
              name: lvl.name,
              englishName: lvl.englishName,
              order: lvl.order,
              isRequired: !!lvl.isRequired,
              isActive: lvl.isActive !== false,
              customFields: lvl.customFields,
            };
            dispatch(addDynamicLevel(newLevel));
          });
      } catch {
        // ignore
      }
    }
    bootstrapLevels();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category?.id, supportsHierarchyLevels]);

  const handleOpenDialog = (level?: DynamicHierarchyLevel) => {
    if (!category) return;
    if (level) {
      setEditingLevel(level);
      setFormData({
        name: level.name,
        englishName: level.englishName,
        order: level.order,
        isRequired: level.isRequired,
        isActive: level.isActive,
      });
    } else {
      setEditingLevel(null);
      setFormData({ name: '', englishName: '', order: levels.length + 1, isRequired: false, isActive: true });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingLevel(null);
  };

  const handleSave = () => {
    if (!category) return;
    if (!formData.name.trim() || !formData.englishName.trim()) return;

    if (editingLevel) {
      dispatch(updateDynamicLevel({
        id: editingLevel.id,
        data: {
          name: formData.name.trim(),
          englishName: formData.englishName.trim(),
          order: formData.order,
          isRequired: formData.isRequired,
          isActive: formData.isActive,
        }
      }));
    } else {
      const newLevel: DynamicHierarchyLevel = {
        id: `level-${Date.now()}`,
        categoryId: category.id,
        name: formData.name.trim(),
        englishName: formData.englishName.trim(),
        order: formData.order,
        isRequired: formData.isRequired,
        isActive: formData.isActive,
      };
      dispatch(addDynamicLevel(newLevel));
    }

    handleCloseDialog();
  };

  const handleDelete = (level: DynamicHierarchyLevel) => {
    setItemToDelete(level);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      dispatch(deleteDynamicLevel(itemToDelete.id));
      setIsDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  if (!category) {
    return (
      <Box>
        <Typography variant="body2" color="text.secondary">
          در حال بارگذاری...
        </Typography>
      </Box>
    );
  }

  // اگر این دسته‌بندی از مدیریت سطوح سلسله‌مراتبی پشتیبانی نمی‌کند، هیچ‌چیزی نمایش نده
  if (!supportsHierarchyLevels) {
    return null;
  }

  // UI بخش مدیریت سطوح (مشترک)
  const LevelsUI = (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: (t) => t.palette.primary.main, fontWeight: 700 }}>
            {levels.length}
          </Avatar>
          <Typography variant="h6" fontWeight={600}>سطوح تعریف شده</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ borderRadius: '24px', px: 2.5, py: 1, boxShadow: (t) => `0 4px 12px ${alpha(t.palette.primary.main, 0.2)}` }}>
          افزودن سطح جدید
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={80} sx={{ fontWeight: 600 }}>ترتیب</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>نام فارسی</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>نام انگلیسی</TableCell>
              <TableCell width={120} align="center" sx={{ fontWeight: 600 }}>عملیات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {levels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">هیچ سطحی تعریف نشده است</Typography>
                </TableCell>
              </TableRow>
            ) : (
              levels.map((level) => (
                <TableRow key={level.id} hover>
                  <TableCell>
                    <Avatar sx={{ width: 28, height: 28, bgcolor: (t) => t.palette.primary.main, fontSize: '0.875rem' }}>{level.order}</Avatar>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{level.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{level.englishName}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <IconButton size="small" onClick={() => handleOpenDialog(level)} sx={{ color: (t) => t.palette.primary.main, '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.1) } }} title="ویرایش">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(level)} sx={{ color: (t) => t.palette.error.main, '&:hover': { bgcolor: (t) => alpha(t.palette.error.main, 0.1) } }} title="حذف">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            direction: 'rtl',
            borderRadius: isMobile ? 0 : '20px',
            backgroundColor: alpha(theme.palette.primary.light, 0.1),
            backdropFilter: 'blur(20px)',
            border: (t) => `1px solid ${alpha(t.palette.primary.light, 0.2)}`,
            boxShadow: (t) => `0 24px 60px ${alpha(t.palette.primary.light, 0.28)}, inset 0 1px 0 rgba(255, 255, 255, 0.75)`,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: { xs: '100vh', md: '90vh' },
          },
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: softSurface,
            borderBottom: (t) => `1px solid ${alpha(t.palette.primary.light, 0.2)}`,
            py: isMobile ? 2 : 3,
            px: isMobile ? 2 : 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={700} color="primary">
            {editingLevel ? 'ویرایش سطح' : 'افزودن سطح جدید'}
          </Typography>
          <IconButton
            onClick={handleCloseDialog}
            size="small"
            sx={{
              minWidth: 'auto',
              color: theme.palette.primary.main,
              backgroundColor: alpha(theme.palette.primary.main, 0.12),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                transform: 'translateY(-1px)',
                boxShadow: `0 6px 18px ${alpha(theme.palette.primary.main, 0.25)}`,
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, backgroundColor: softSurface }}>
          <Box sx={{ p: { xs: 2.5, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="نام فارسی"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              sx={inputBaseSx}
            />
            <TextField
              label="نام انگلیسی"
              value={formData.englishName}
              onChange={(e) => setFormData({ ...formData, englishName: e.target.value })}
              fullWidth
              required
              sx={inputBaseSx}
            />
            <TextField
              label="ترتیب"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value, 10) || 1 })}
              fullWidth
              inputProps={{ min: 1 }}
              sx={inputBaseSx}
            />
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            backgroundColor: softSurface,
            borderTop: (t) => `1px solid ${alpha(t.palette.primary.light, 0.2)}`,
            p: isMobile ? 2 : 3,
            justifyContent: 'flex-end',
            gap: 1.5,
          }}
        >
          <Button onClick={handleCloseDialog} variant="outlined" sx={secondaryButtonSx}>
            انصراف
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.name.trim() || !formData.englishName.trim()}
            sx={primaryButtonSx}
          >
            ذخیره
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog تأیید حذف */}
      <Dialog open={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { direction: 'rtl', borderRadius: 2 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
          <WarningIcon color="error" />
          تأیید حذف سطح
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography>
            آیا از حذف سطح "{itemToDelete?.name}" اطمینان دارید؟
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            این عملیات قابل بازگشت نیست و ممکن است بر روی داده‌های مرتبط تأثیر بگذارد.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteConfirmOpen(false)} variant="outlined">
            انصراف
          </Button>
          <Button onClick={confirmDelete} variant="contained" color="error">
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

  // اگر باید از آکاردئون استفاده کند
  if (category.useAccordion) {
    return (
      <Accordion
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: (t) => alpha(t.palette.primary.light, t.palette.mode === 'dark' ? 0.08 : 0.12),
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: (t) => `0 6px 24px ${alpha(t.palette.common.black, t.palette.mode === 'dark' ? 0.4 : 0.1)}`,
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="hierarchy-levels-content"
          id="hierarchy-levels-header"
          sx={{
            bgcolor: (t) => alpha(t.palette.background.paper, t.palette.mode === 'dark' ? 0.06 : 0.6),
            '&:hover': { bgcolor: (t) => alpha(t.palette.background.paper, t.palette.mode === 'dark' ? 0.1 : 0.7) },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 1, bgcolor: 'background.paper', boxShadow: (t) => `0 2px 8px ${alpha(t.palette.primary.main, 0.15)}` }}>
              <SettingsIcon sx={{ color: (t) => t.palette.primary.main }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={600}>مدیریت سطوح سلسله‌مراتبی</Typography>
              <Typography variant="body2" color="text.secondary">تعریف و مدیریت سطوح مختلف {category.name}</Typography>
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {LevelsUI}
        </AccordionDetails>
      </Accordion>
    );
  }

  // نمایش عادی (بدون آکاردئون)
  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, bgcolor: (t) => alpha(t.palette.primary.light, 0.15), border: '1px solid', borderColor: 'divider', p: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 1, bgcolor: 'white', boxShadow: (t) => `0 2px 8px ${alpha(t.palette.primary.main, 0.15)}` }}>
          <SettingsIcon sx={{ color: (t) => t.palette.primary.main }} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={600}>مدیریت سطوح سلسله‌مراتبی</Typography>
          <Typography variant="body2" color="text.secondary">تعریف و مدیریت سطوح مختلف {category.name}</Typography>
        </Box>
      </Box>
      {LevelsUI}
    </Paper>
  );
};

export default HierarchyLevelsManagerBase;
