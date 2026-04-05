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
  LocalShipping as LogisticsIcon,
} from '@mui/icons-material';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  LogisticsItem,
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
import LogisticsModal from './modals/LogisticsModal';
import LogisticsDeleteConfirmModal from '@/modules/dashboard/pages/resources/LogisticsDeleteConfirmModal';

import logisticsData from '@/data/resources/logistics.json';

const LogisticsTab: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  
  // Redux state
  const logistics = useAppSelector(state => selectTabItems(state, 'logistics')) as LogisticsItem[];
  const loading = useAppSelector(state => selectTabLoading(state, 'logistics'));
  const error = useAppSelector(state => selectTabError(state, 'logistics'));
  const filters = useAppSelector(state => selectTabFilters(state, 'logistics'));
  const pagination = useAppSelector(state => selectTabPagination(state, 'logistics'));
  
  // Local state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLogistics, setSelectedLogistics] = useState<LogisticsItem | null>(null);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [statusFilter, setStatusFilter] = useState<string>(filters.status || 'all');
  const [categoryFilter, setCategoryFilter] = useState<string>((filters as any).category || 'all');
  
  // Load data on mount
  useEffect(() => {
    dispatch(fetchTabItems({ tabType: 'logistics', filters }));
  }, [dispatch, filters]);
  
  // Update filters when search or status changes
  useEffect(() => {
    const newFilters = {
      search: searchTerm,
      status: statusFilter === 'all' ? undefined : statusFilter,
      category: categoryFilter === 'all' ? undefined : categoryFilter,
    };
    dispatch(setTabFilters({ tabType: 'logistics', filters: newFilters }));
  }, [dispatch, searchTerm, statusFilter, categoryFilter]);

  const handleOpenModal = (item?: LogisticsItem) => {
    setSelectedLogistics(item || null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedLogistics(null);
  };

  const handleSave = async (itemData: Omit<LogisticsItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (selectedLogistics) {
        // Update existing logistics
        await dispatch(updateTabItem({ 
          tabType: 'logistics', 
          itemId: selectedLogistics.id, 
          itemData 
        })).unwrap();
      } else {
        // Add new logistics
        await dispatch(createTabItem({ 
          tabType: 'logistics', 
          itemData 
        })).unwrap();
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving logistics:', error);
    }
  };

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<LogisticsItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = (id: string) => {
    const item = logistics.find(l => l.id === id) || null;
    setPendingDeleteItem(item);
    setDeleteOpen(true);
  };

  const confirmDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      await dispatch(deleteTabItem({ tabType: 'logistics', itemId: id })).unwrap();
      setDeleteOpen(false);
      setPendingDeleteItem(null);
    } catch (error) {
      console.error('Error deleting logistics:', error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handlePageChange = (event: unknown, newPage: number) => {
    dispatch(setTabPagination({ tabType: 'logistics', pagination: { page: newPage } }));
  };
  
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    dispatch(setTabPagination({ 
      tabType: 'logistics', 
      pagination: { pageSize: newRowsPerPage, page: 0 } 
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'primary';
      case 'low-stock': return 'warning';
      case 'out-of-stock': return 'error';
      case 'ordered': return 'info';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'موجود';
      case 'low-stock': return 'کمبود موجودی';
      case 'out-of-stock': return 'تمام موجودی';
      case 'ordered': return 'سفارش داده‌شده';
      default: return status;
    }
  };

  const isLowStock = (item: LogisticsItem) => {
    return item.quantity <= item.minStock;
  };

  const filteredLogistics = logistics.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>      
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>          
          <LogisticsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight="bold">
            مدیریت لجستیک
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal()}
          sx={{ borderRadius: 2 }}
        >
          افزودن آیتم جدید
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="جستجو در آیتم‌های لجستیک..."
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
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="فیلتر وضعیت"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">همه</MenuItem>
              <MenuItem value="available">موجود</MenuItem>
              <MenuItem value="low-stock">کمبود موجودی</MenuItem>
              <MenuItem value="out-of-stock">تمام موجودی</MenuItem>
              <MenuItem value="ordered">سفارش داده‌شده</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="فیلتر دسته‌بندی"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="all">همه</MenuItem>
              <MenuItem value="غذا">غذا</MenuItem>
              <MenuItem value="پوشاک">پوشاک</MenuItem>
              <MenuItem value="ابزار">ابزار</MenuItem>
              <MenuItem value="قطعات">قطعات</MenuItem>
              <MenuItem value="مصالح">مصالح</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="body2" color="text.secondary">
              تعداد کل: {filteredLogistics.length}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Logistics Table */}
      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
        <TableContainer sx={{ flex: 1 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>کد آیتم</TableCell>
                <TableCell>نام آیتم</TableCell>
                <TableCell>دسته‌بندی</TableCell>
                <TableCell>موجودی</TableCell>
                <TableCell>وضعیت</TableCell>
                <TableCell>قیمت کل</TableCell>
                <TableCell>مکان</TableCell>
                <TableCell align="center">عملیات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogistics
                .slice(pagination.page * pagination.pageSize, pagination.page * pagination.pageSize + pagination.pageSize)
                .map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.itemCode}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">
                        {item.quantity} {item.unit}
                      </Typography>
                      {isLowStock(item) && (
                        <Chip
                          label="کمبود"
                          color="warning"
                          size="small"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(item.status)}
                      color={getStatusColor(item.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{item.totalValue.toLocaleString()} تومان</TableCell>
                  <TableCell>{item.location}</TableCell>
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
          count={filteredLogistics.length}
          rowsPerPage={pagination.pageSize}
          page={pagination.page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          labelRowsPerPage="تعداد ردیف در صفحه"
        />
      </Paper>

      {/* Logistics Modal */}
      <LogisticsModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        logistics={selectedLogistics}
        categories={logisticsData.categories}
      />

      <LogisticsDeleteConfirmModal
        open={deleteOpen}
        item={pendingDeleteItem}
        onClose={() => { setDeleteOpen(false); setPendingDeleteItem(null); }}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </Box>
  );
};

export default LogisticsTab;
