import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
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
import DynamicModal from '@/components/common/DynamicModal';

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

  const handleSaveResource = async (formData: Record<string, any>) => {
    try {
      // Transform form data to Resource format
      const resourceData: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'> = {
        personalInfo: formData['pr-1-1'] || {},
        legalInfo: {
          status: 'اشخاص کلیدی' as const, // Default, will be determined by form data
          subStatus: 'زنده' as const,
          details: formData['pr-1-2'] || {},
        },
        isActive: true,
      };
      
      await dispatch(createResource(resourceData));
      setShowAddModal(false);
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

      {/* Dynamic Modal for Adding Resources */}
      <DynamicModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveResource}
        categoryType="resources"
        mode="create"
        title="افزودن منبع جدید"
        maxWidth="lg"
      />
    </Box>
  );
};

export default ResourcesListPage;