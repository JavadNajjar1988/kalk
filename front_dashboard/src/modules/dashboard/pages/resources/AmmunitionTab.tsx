import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  MenuItem,
  InputAdornment,
  IconButton,
  Chip,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Security as AmmunitionIcon,
} from '@mui/icons-material';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  AmmunitionItem,
  fetchTabItems,
  createTabItem,
  updateTabItem,
  deleteTabItem,
  setTabFilters,
  setTabPagination,
  selectTabItems,
  selectTabLoading,
  selectTabError,
  selectTabFilters,
  selectTabPagination,
} from '@/store/slices/tabularResourcesSlice';
import AmmunitionModal from './modals/AmmunitionModal';

// Import ammunition data
import ammunitionData from '@/data/resources/ammunition.json';

const AmmunitionTab: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  
  // Redux state
  const ammunition = useAppSelector(state => selectTabItems(state, 'ammunition')) as AmmunitionItem[];
  const loading = useAppSelector(state => selectTabLoading(state, 'ammunition'));
  const error = useAppSelector(state => selectTabError(state, 'ammunition'));
  const filters = useAppSelector(state => selectTabFilters(state, 'ammunition'));
  const pagination = useAppSelector(state => selectTabPagination(state, 'ammunition'));
  
  // Local state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAmmunition, setSelectedAmmunition] = useState<AmmunitionItem | null>(null);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [statusFilter, setStatusFilter] = useState<string>(filters.status || 'all');
  const [typeFilter, setTypeFilter] = useState<string>((filters as any).type || 'all');
  const [dangerClassFilter, setDangerClassFilter] = useState<string>((filters as any).dangerClass || 'all');
  
  // Load data on mount
  useEffect(() => {
    dispatch(fetchTabItems({ tabType: 'ammunition', filters }));
  }, [dispatch, filters]);
  
  // Update filters when search or status changes
  useEffect(() => {
    const newFilters = {
      search: searchTerm,
      status: statusFilter === 'all' ? undefined : statusFilter,
      type: typeFilter === 'all' ? undefined : typeFilter,
      dangerClass: dangerClassFilter === 'all' ? undefined : dangerClassFilter,
    };
    dispatch(setTabFilters({ tabType: 'ammunition', filters: newFilters }));
  }, [dispatch, searchTerm, statusFilter, typeFilter, dangerClassFilter]);

  const handleOpenModal = (item?: AmmunitionItem) => {
    setSelectedAmmunition(item || null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedAmmunition(null);
  };

  const handleSave = async (itemData: Omit<AmmunitionItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (selectedAmmunition) {
        // Update existing ammunition
        await dispatch(updateTabItem({ 
          tabType: 'ammunition', 
          itemId: selectedAmmunition.id, 
          itemData 
        })).unwrap();
      } else {
        // Add new ammunition
        await dispatch(createTabItem({ 
          tabType: 'ammunition', 
          itemData 
        })).unwrap();
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving ammunition:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('آیا از حذف این مهمات اطمینان دارید؟')) {
      try {
        await dispatch(deleteTabItem({ tabType: 'ammunition', itemId: id })).unwrap();
      } catch (error) {
        console.error('Error deleting ammunition:', error);
      }
    }
  };
  
  const handlePageChange = (event: unknown, newPage: number) => {
    dispatch(setTabPagination({ tabType: 'ammunition', pagination: { page: newPage } }));
  };
  
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    dispatch(setTabPagination({ 
      tabType: 'ammunition', 
      pagination: { pageSize: newRowsPerPage, page: 0 } 
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'success';
      case 'allocated': return 'info';
      case 'used': return 'default';
      case 'expired': return 'warning';
      case 'damaged': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'موجود';
      case 'allocated': return 'تخصیص‌یافته';
      case 'used': return 'مصرف‌شده';
      case 'expired': return 'منقضی';
      case 'damaged': return 'آسیب‌دیده';
      default: return status;
    }
  };

  const getDangerClassColor = (dangerClass: string) => {
    switch (dangerClass) {
      case '1.1': return 'error';
      case '1.2': return 'error';
      case '1.3': return 'warning';
      case '1.4': return 'info';
      case '1.5': return 'success';
      case '1.6': return 'success';
      default: return 'default';
    }
  };

  const filteredAmmunition = ammunition.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ammunitionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.caliber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesDangerClass = dangerClassFilter === 'all' || item.dangerClass === dangerClassFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesDangerClass;
  });

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>      
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>          
          <AmmunitionIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight="bold">
            مدیریت مهمات
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal()}
          sx={{ 
            borderRadius: 2,
            px: 3,
            py: 1,
            boxShadow: 2,
            '&:hover': {
              boxShadow: 4,
              transform: 'translateY(-1px)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          افزودن مهمات جدید
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="جستجو در مهمات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
            <TextField
              select
              fullWidth
              label="فیلتر وضعیت"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">همه</MenuItem>
              <MenuItem value="available">موجود</MenuItem>
              <MenuItem value="allocated">تخصیص‌یافته</MenuItem>
              <MenuItem value="used">مصرف‌شده</MenuItem>
              <MenuItem value="expired">منقضی</MenuItem>
              <MenuItem value="damaged">آسیب‌دیده</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              label="فیلتر نوع"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="all">همه</MenuItem>
              <MenuItem value="گلوله">گلوله</MenuItem>
              <MenuItem value="بمب">بمب</MenuItem>
              <MenuItem value="نارنجک">نارنجک</MenuItem>
              <MenuItem value="موشک">موشک</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              label="کلاس خطر"
              value={dangerClassFilter}
              onChange={(e) => setDangerClassFilter(e.target.value)}
            >
              <MenuItem value="all">همه</MenuItem>
              <MenuItem value="1.1">1.1 - انفجار جرمی</MenuItem>
              <MenuItem value="1.2">1.2 - انفجار با خطر پرتاب</MenuItem>
              <MenuItem value="1.3">1.3 - انفجار با خطر آتش‌سوزی</MenuItem>
              <MenuItem value="1.4">1.4 - خطر جزئی</MenuItem>
              <MenuItem value="1.5">1.5 - مواد کم‌حساس</MenuItem>
              <MenuItem value="1.6">1.6 - اجسام بسیار کم‌حساس</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">
              تعداد کل: {filteredAmmunition.length}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Ammunition Table */}
      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
        <TableContainer sx={{ flex: 1 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>کد مهمات</TableCell>
                <TableCell>نام مهمات</TableCell>
                <TableCell>کالیبر</TableCell>
                <TableCell>نوع</TableCell>
                <TableCell>تعداد</TableCell>
                <TableCell>وضعیت</TableCell>
                <TableCell>کلاس خطر</TableCell>
                <TableCell>محل انبار</TableCell>
                <TableCell align="center">عملیات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAmmunition
                .slice(pagination.page * pagination.pageSize, pagination.page * pagination.pageSize + pagination.pageSize)
                .map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.ammunitionCode}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.caliber}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{item.quantity} {item.unit}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(item.status)}
                      color={getStatusColor(item.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.dangerClass}
                      color={getDangerClassColor(item.dangerClass) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{item.storageLocation}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenModal(item)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(item.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredAmmunition.length}
          rowsPerPage={pagination.pageSize}
          page={pagination.page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          labelRowsPerPage="تعداد ردیف در صفحه"
        />
      </Paper>

      {/* Ammunition Modal */}
      <AmmunitionModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        ammunition={selectedAmmunition}
        categories={ammunitionData.categories}
      />
    </Box>
  );
};

export default AmmunitionTab;