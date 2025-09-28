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
  WorkspacePremium as RanksIcon,
} from '@mui/icons-material';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  RankItem,
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
import RanksModal from './modals/RanksModal';

// Import ranks data
import ranksData from '@/data/resources/ranks.json';

const RanksTab: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  
  // Redux state
  const ranks = useAppSelector(state => selectTabItems(state, 'ranks')) as RankItem[];
  const loading = useAppSelector(state => selectTabLoading(state, 'ranks'));
  const error = useAppSelector(state => selectTabError(state, 'ranks'));
  const filters = useAppSelector(state => selectTabFilters(state, 'ranks'));
  const pagination = useAppSelector(state => selectTabPagination(state, 'ranks'));
  
  // Local state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRank, setSelectedRank] = useState<RankItem | null>(null);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [statusFilter, setStatusFilter] = useState<string>(filters.status || 'all');
  const [categoryFilter, setCategoryFilter] = useState<string>((filters as any).category || 'all');
  
  // Load data on mount
  useEffect(() => {
    dispatch(fetchTabItems({ tabType: 'ranks', filters }));
  }, [dispatch, filters]);
  
  // Update filters when search or status changes
  useEffect(() => {
    const newFilters = {
      search: searchTerm,
      status: statusFilter === 'all' ? undefined : statusFilter,
      category: categoryFilter === 'all' ? undefined : categoryFilter,
    };
    dispatch(setTabFilters({ tabType: 'ranks', filters: newFilters }));
  }, [dispatch, searchTerm, statusFilter, categoryFilter]);

  const handleOpenModal = (item?: RankItem) => {
    setSelectedRank(item || null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedRank(null);
  };

  const handleSave = async (itemData: Omit<RankItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (selectedRank) {
        // Update existing rank
        await dispatch(updateTabItem({ 
          tabType: 'ranks', 
          itemId: selectedRank.id, 
          itemData 
        })).unwrap();
      } else {
        // Add new rank
        await dispatch(createTabItem({ 
          tabType: 'ranks', 
          itemData 
        })).unwrap();
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving rank:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('آیا از حذف این رده اطمینان دارید؟')) {
      try {
        await dispatch(deleteTabItem({ tabType: 'ranks', itemId: id })).unwrap();
      } catch (error) {
        console.error('Error deleting rank:', error);
      }
    }
  };
  
  const handlePageChange = (event: unknown, newPage: number) => {
    dispatch(setTabPagination({ tabType: 'ranks', pagination: { page: newPage } }));
  };
  
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    dispatch(setTabPagination({ 
      tabType: 'ranks', 
      pagination: { pageSize: newRowsPerPage, page: 0 } 
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'historical': return 'info';
      case 'deprecated': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'فعال';
      case 'historical': return 'تاریخی';
      case 'deprecated': return 'منسوخ';
      default: return status;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'officer': return 'primary';
      case 'enlisted': return 'secondary';
      case 'warrant': return 'warning';
      default: return 'default';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'officer': return 'افسر';
      case 'enlisted': return 'درجه‌دار';
      case 'warrant': return 'ستوان';
      default: return category;
    }
  };

  const filteredRanks = ranks.filter(item => {
    const matchesSearch = !searchTerm || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.rankCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          <RanksIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight="bold">
            مدیریت رده‌ها
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal()}
          sx={{ borderRadius: 2 }}
        >
          افزودن رده جدید
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="جستجو در رده‌ها..."
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
              <MenuItem value="active">فعال</MenuItem>
              <MenuItem value="historical">تاریخی</MenuItem>
              <MenuItem value="deprecated">منسوخ</MenuItem>
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
              <MenuItem value="officer">افسر</MenuItem>
              <MenuItem value="enlisted">درجه‌دار</MenuItem>
              <MenuItem value="warrant">ستوان</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="body2" color="text.secondary">
              تعداد کل: {filteredRanks.length}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Ranks Table */}
      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
        <TableContainer sx={{ flex: 1 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>کد رده</TableCell>
                <TableCell>عنوان</TableCell>
                <TableCell>سطح</TableCell>
                <TableCell>دسته‌بندی</TableCell>
                <TableCell>وضعیت</TableCell>
                <TableCell>اختیارات</TableCell>
                <TableCell align="center">عملیات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRanks
                .slice(pagination.page * pagination.pageSize, pagination.page * pagination.pageSize + pagination.pageSize)
                .map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.rankCode}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {item.insignia && (
                        <Box 
                          component="img" 
                          src={item.insignia} 
                          alt={item.title}
                          sx={{ width: 24, height: 24 }}
                        />
                      )}
                      <Typography variant="body2">{item.title}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{item.level}</TableCell>
                  <TableCell>
                    <Chip
                      label={getCategoryLabel(item.category)}
                      color={getCategoryColor(item.category) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(item.status)}
                      color={getStatusColor(item.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {item.authority.length} مورد
                    </Typography>
                  </TableCell>
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
          count={filteredRanks.length}
          rowsPerPage={pagination.pageSize}
          page={pagination.page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          labelRowsPerPage="تعداد ردیف در صفحه"
        />
      </Paper>

      {/* Ranks Modal */}
      <RanksModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        rank={selectedRank}
        categories={ranksData.categories}
        fields={ranksData.fields}
      />
    </Box>
  );
};

export default RanksTab;