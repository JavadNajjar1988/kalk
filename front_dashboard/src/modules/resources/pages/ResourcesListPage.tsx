import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Pagination,
  Alert,
  CircularProgress,
  Fab,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  AccountBox as ResourceIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchResources, setFilters, clearFilters, createResource, clearError } from '../store/resourcesSlice';
import type { Resource, ResourceFilters } from '../types';
import { useTranslation } from '@/hooks/useTranslation';

const ResourcesListPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  
  const {
    resources,
    filters,
    isLoading,
    error,
    pagination,
  } = useAppSelector((state) => state.resourcesModule);

  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newResourceForm, setNewResourceForm] = useState({
    fullName: '',
    birthDate: '',
    gender: 'مرد' as 'مرد' | 'زن',
    nationality: 'ایرانی' as 'ایرانی' | 'غیرایرانی' | 'تبعه مضاعف',
    birthPlace: '',
    status: 'اشخاص کلیدی' as 'اشخاص کلیدی' | 'نظامی' | 'غیرنظامی',
    subStatus: 'زنده' as 'زنده' | 'شهید' | 'آسیب دیده',
  });

  useEffect(() => {
    dispatch(fetchResources(filters));
  }, [dispatch, filters, pagination.page]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    dispatch(setFilters({ search: value }));
  };

  const handleFilterChange = (filterKey: keyof ResourceFilters, value: any) => {
    dispatch(setFilters({ [filterKey]: value }));
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    dispatch(clearFilters());
  };

  const handleAddResource = () => {
    setShowAddModal(true);
  };

  const handleSaveResource = async () => {
    try {
      const resourceData: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'> = {
        personalInfo: {
          fullName: newResourceForm.fullName || 'منبع جدید',
          birthDate: newResourceForm.birthDate || new Date().toISOString(),
          gender: newResourceForm.gender,
          nationality: newResourceForm.nationality,
          birthPlace: newResourceForm.birthPlace || undefined,
        },
        legalInfo: {
          status: newResourceForm.status,
          subStatus: newResourceForm.subStatus,
          details:
            newResourceForm.status === 'اشخاص کلیدی'
              ? { position: 'نامشخص', authorityLevel: 'فرمانده پایین' }
              : newResourceForm.status === 'نظامی'
                ? { forceType: 'ارتش', rank: 'نامشخص', position: 'نامشخص' }
                : { occupation: 'نامشخص' },
        },
        isActive: true,
      };
      
      await dispatch(createResource(resourceData));
      setShowAddModal(false);
      setNewResourceForm({
        fullName: '',
        birthDate: '',
        gender: 'مرد',
        nationality: 'ایرانی',
        birthPlace: '',
        status: 'اشخاص کلیدی',
        subStatus: 'زنده',
      });
    } catch (error) {
      console.error('Error creating resource:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'اشخاص کلیدی': return 'primary';
      case 'نظامی': return 'success';
      case 'غیرنظامی': return 'warning';
      default: return 'default';
    }
  };

  const getSubStatusColor = (subStatus: string) => {
    switch (subStatus) {
      case 'زنده': return 'success';
      case 'شهید': return 'error';
      case 'آسیب دیده': return 'warning';
      default: return 'default';
    }
  };

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight={600}>
          مدیریت منابع
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddResource}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1.5,
          }}
        >
          افزودن منبع جدید
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <FilterIcon sx={{ mr: 1 }} />
            فیلترها و جستجو
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="جستجو در منابع..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ borderRadius: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>وضعیت</InputLabel>
                <Select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="وضعیت"
                >
                  <MenuItem value="">همه</MenuItem>
                  <MenuItem value="اشخاص کلیدی">اشخاص کلیدی</MenuItem>
                  <MenuItem value="نظامی">نظامی</MenuItem>
                  <MenuItem value="غیرنظامی">غیرنظامی</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>وضعیت فرعی</InputLabel>
                <Select
                  value={filters.subStatus || ''}
                  onChange={(e) => handleFilterChange('subStatus', e.target.value)}
                  label="وضعیت فرعی"
                >
                  <MenuItem value="">همه</MenuItem>
                  <MenuItem value="زنده">زنده</MenuItem>
                  <MenuItem value="شهید">شهید</MenuItem>
                  <MenuItem value="آسیب دیده">آسیب دیده</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>جنسیت</InputLabel>
                <Select
                  value={filters.gender || ''}
                  onChange={(e) => handleFilterChange('gender', e.target.value)}
                  label="جنسیت"
                >
                  <MenuItem value="">همه</MenuItem>
                  <MenuItem value="مرد">مرد</MenuItem>
                  <MenuItem value="زن">زن</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                sx={{ height: '100%' }}
              >
                پاک کردن فیلترها
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Resources List */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : resources.length === 0 ? (
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <ResourceIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              هیچ منبعی یافت نشد
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              برای افزودن منبع جدید روی دکمه "افزودن منبع جدید" کلیک کنید
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <Grid container spacing={2}>
            {resources.map((resource) => (
              <Grid item xs={12} md={6} lg={4} key={resource.id}>
                <Card
                  sx={{
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: (theme) => theme.shadows[8],
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" noWrap>
                        {resource.personalInfo.fullName}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Chip
                          label={resource.legalInfo.status}
                          color={getStatusColor(resource.legalInfo.status) as any}
                          size="small"
                        />
                        <Chip
                          label={resource.legalInfo.subStatus}
                          color={getSubStatusColor(resource.legalInfo.subStatus) as any}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      تاریخ تولد: {resource.personalInfo.birthDate}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      جنسیت: {resource.personalInfo.gender}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      تابعیت: {resource.personalInfo.nationality}
                    </Typography>
                    
                    {resource.personalInfo.birthPlace && (
                      <Typography variant="body2" color="text.secondary">
                        محل تولد: {resource.personalInfo.birthPlace}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {pagination.total > pagination.pageSize && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={Math.ceil(pagination.total / pagination.pageSize)}
                page={pagination.page}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}

      {/* Floating Action Button for Mobile */}
      <Fab
        color="primary"
        aria-label="add resource"
        onClick={handleAddResource}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' },
        }}
      >
        <AddIcon />
      </Fab>

      <Dialog
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>افزودن منبع جدید</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="نام و نام خانوادگی"
                value={newResourceForm.fullName}
                onChange={(e) => setNewResourceForm((prev) => ({ ...prev, fullName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="تاریخ تولد"
                InputLabelProps={{ shrink: true }}
                value={newResourceForm.birthDate}
                onChange={(e) => setNewResourceForm((prev) => ({ ...prev, birthDate: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>جنسیت</InputLabel>
                <Select
                  value={newResourceForm.gender}
                  label="جنسیت"
                  onChange={(e) => setNewResourceForm((prev) => ({ ...prev, gender: e.target.value as 'مرد' | 'زن' }))}
                >
                  <MenuItem value="مرد">مرد</MenuItem>
                  <MenuItem value="زن">زن</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>تابعیت</InputLabel>
                <Select
                  value={newResourceForm.nationality}
                  label="تابعیت"
                  onChange={(e) =>
                    setNewResourceForm((prev) => ({
                      ...prev,
                      nationality: e.target.value as 'ایرانی' | 'غیرایرانی' | 'تبعه مضاعف',
                    }))
                  }
                >
                  <MenuItem value="ایرانی">ایرانی</MenuItem>
                  <MenuItem value="غیرایرانی">غیرایرانی</MenuItem>
                  <MenuItem value="تبعه مضاعف">تبعه مضاعف</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="محل تولد"
                value={newResourceForm.birthPlace}
                onChange={(e) => setNewResourceForm((prev) => ({ ...prev, birthPlace: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>وضعیت اصلی</InputLabel>
                <Select
                  value={newResourceForm.status}
                  label="وضعیت اصلی"
                  onChange={(e) =>
                    setNewResourceForm((prev) => ({
                      ...prev,
                      status: e.target.value as 'اشخاص کلیدی' | 'نظامی' | 'غیرنظامی',
                    }))
                  }
                >
                  <MenuItem value="اشخاص کلیدی">اشخاص کلیدی</MenuItem>
                  <MenuItem value="نظامی">نظامی</MenuItem>
                  <MenuItem value="غیرنظامی">غیرنظامی</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>وضعیت فرعی</InputLabel>
                <Select
                  value={newResourceForm.subStatus}
                  label="وضعیت فرعی"
                  onChange={(e) =>
                    setNewResourceForm((prev) => ({
                      ...prev,
                      subStatus: e.target.value as 'زنده' | 'شهید' | 'آسیب دیده',
                    }))
                  }
                >
                  <MenuItem value="زنده">زنده</MenuItem>
                  <MenuItem value="شهید">شهید</MenuItem>
                  <MenuItem value="آسیب دیده">آسیب دیده</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddModal(false)}>انصراف</Button>
          <Button variant="contained" onClick={handleSaveResource}>ذخیره</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResourcesListPage;