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
  Groups as PersonnelIcon,
} from '@mui/icons-material';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  PersonnelItem,
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
import DynamicModal from '@/components/common/DynamicModal';

const PersonnelTab: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  
  // Redux state
  const personnel = useAppSelector(state => selectTabItems(state, 'personnel')) as PersonnelItem[];
  const loading = useAppSelector(state => selectTabLoading(state, 'personnel'));
  const error = useAppSelector(state => selectTabError(state, 'personnel'));
  const filters = useAppSelector(state => selectTabFilters(state, 'personnel'));
  const pagination = useAppSelector(state => selectTabPagination(state, 'personnel'));
  
  // Local state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState<PersonnelItem | null>(null);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [statusFilter, setStatusFilter] = useState<string>(filters.status || 'all');
  const [rankFilter, setRankFilter] = useState<string>((filters as any).rank || 'all');
  
  // Load data on mount
  useEffect(() => {
    dispatch(fetchTabItems({ tabType: 'personnel', filters }));
  }, [dispatch, filters]);

  // Update filters when search or status changes
  useEffect(() => {
    const newFilters = {
      search: searchTerm,
      status: statusFilter === 'all' ? undefined : statusFilter,
      rank: rankFilter === 'all' ? undefined : rankFilter,
    };
    dispatch(setTabFilters({ tabType: 'personnel', filters: newFilters }));
  }, [dispatch, searchTerm, statusFilter, rankFilter]);

  const handleOpenModal = (person?: PersonnelItem) => {
    setSelectedPersonnel(person || null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPersonnel(null);
  };

  const handleSave = async (formData: Record<string, any>) => {
    try {
      console.log('Form data received from DynamicModal:', formData);
      
      // Show form data structure for debugging
      Object.keys(formData).forEach(tabId => {
        console.log(`Tab ${tabId}:`, formData[tabId]);
      });
      
      // Extract data from each tab based on the resources definition structure
      // The exact tab IDs will depend on the definitions editor configuration
      const extractedData: Record<string, any> = {};
      
      // Flatten the hierarchical form data into a single object
      Object.keys(formData).forEach(tabId => {
        Object.assign(extractedData, formData[tabId]);
      });
      
      // Ensure required fields are present with defaults for PersonnelItem compatibility
      const personnelData = {
        personalCode: extractedData.personalCode || `PER${Date.now().toString().slice(-6)}`,
        firstName: extractedData.firstName || '',
        lastName: extractedData.lastName || '',
        nationalId: extractedData.nationalId || '',
        rank: extractedData.rank || '',
        unit: extractedData.unit || '',
        position: extractedData.position || '',
        phoneNumber: extractedData.phoneNumber || '',
        email: extractedData.email || '',
        status: extractedData.status || 'active' as const,
        startDate: extractedData.startDate || new Date().toISOString().split('T')[0],
        ...extractedData // Include any additional fields from the dynamic form
      };
      
      console.log('Processed personnel data:', personnelData);
      
      if (selectedPersonnel) {
        // Update existing personnel
        await dispatch(updateTabItem({ 
          tabType: 'personnel', 
          itemId: selectedPersonnel.id, 
          itemData: personnelData 
        })).unwrap();
      } else {
        // Add new personnel
        await dispatch(createTabItem({ 
          tabType: 'personnel', 
          itemData: personnelData 
        })).unwrap();
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving personnel:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('آیا از حذف این شخص اطمینان دارید؟')) {
      try {
        await dispatch(deleteTabItem({ tabType: 'personnel', itemId: id })).unwrap();
      } catch (error) {
        console.error('Error deleting personnel:', error);
      }
    }
  };
  
  const handlePageChange = (event: unknown, newPage: number) => {
    dispatch(setTabPagination({ tabType: 'personnel', pagination: { page: newPage } }));
  };
  
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    dispatch(setTabPagination({ 
      tabType: 'personnel', 
      pagination: { pageSize: newRowsPerPage, page: 0 } 
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'leave': return 'warning';
      case 'mission': return 'info';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'فعال';
      case 'inactive': return 'غیرفعال';
      case 'leave': return 'مرخصی';
      case 'mission': return 'ماموریت';
      default: return status;
    }
  };

  const filteredPersonnel = personnel.filter(person => {
    const matchesSearch = !searchTerm || 
      person.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.personalCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.nationalId.includes(searchTerm) ||
      person.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.rank.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (person.position && person.position.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (person.phoneNumber && person.phoneNumber.includes(searchTerm)) ||
      (person.email && person.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || person.status === statusFilter;
    const matchesRank = rankFilter === 'all' || person.rank === rankFilter;
    
    return matchesSearch && matchesStatus && matchesRank;
  });

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PersonnelIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight="bold">
            مدیریت اشخاص
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal()}
          sx={{ borderRadius: 2 }}
        >
          افزودن شخص جدید
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="جستجو در اشخاص... (نام، کد پرسنلی، کد ملی، یگان، درجه)"
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
              <MenuItem value="active">فعال</MenuItem>
              <MenuItem value="inactive">غیرفعال</MenuItem>
              <MenuItem value="leave">مرخصی</MenuItem>
              <MenuItem value="mission">ماموریت</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              label="فیلتر درجه"
              value={rankFilter}
              onChange={(e) => setRankFilter(e.target.value)}
            >
              <MenuItem value="all">همه</MenuItem>
              <MenuItem value="سرهنگ">سرهنگ</MenuItem>
              <MenuItem value="سرگرد">سرگرد</MenuItem>
              <MenuItem value="ستوان">ستوان</MenuItem>
              <MenuItem value="ستوان‌دوم">ستوان‌دوم</MenuItem>
              <MenuItem value="جوان‌یکم">جوان‌یکم</MenuItem>
              <MenuItem value="گروهبان">گروهبان</MenuItem>
              <MenuItem value="سرباز">سرباز</MenuItem>
              <MenuItem value="کارشناس">کارشناس</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                تعداد کل: <strong>{filteredPersonnel.length}</strong> نفر
              </Typography>
              <Typography variant="body2" color="text.secondary">
                نمایش: {Math.min((pagination.page + 1) * pagination.pageSize, filteredPersonnel.length)} از {filteredPersonnel.length}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Personnel Table */}
      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
        <TableContainer sx={{ flex: 1 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>کد پرسنلی</TableCell>
                <TableCell>نام و نام خانوادگی</TableCell>
                <TableCell>کد ملی</TableCell>
                <TableCell>درجه</TableCell>
                <TableCell>یگان</TableCell>
                <TableCell>سمت</TableCell>
                <TableCell>شماره تماس</TableCell>
                <TableCell>تاریخ شروع خدمت</TableCell>
                <TableCell>وضعیت</TableCell>
                <TableCell align="center">عملیات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPersonnel
                .slice(pagination.page * pagination.pageSize, pagination.page * pagination.pageSize + pagination.pageSize)
                .map((person) => (
                <TableRow key={person.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium" color="primary.main">
                      {person.personalCode}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {`${person.firstName} ${person.lastName}`}
                      </Typography>
                      {person.email && (
                        <Typography variant="caption" color="text.secondary">
                          {person.email}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {person.nationalId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={person.rank}
                      size="small"
                      variant="outlined"
                      color="secondary"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap title={person.unit}>
                      {person.unit}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {person.position || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {person.phoneNumber || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(person.startDate).toLocaleDateString('fa-IR')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(person.status)}
                      color={getStatusColor(person.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenModal(person)}
                      color="primary"
                      title="ویرایش"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(person.id)}
                      color="error"
                      title="حذف"
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
          count={filteredPersonnel.length}
          rowsPerPage={pagination.pageSize}
          page={pagination.page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          labelRowsPerPage="تعداد ردیف در صفحه"
        />
      </Paper>

      {/* Dynamic Personnel Modal */}
      <DynamicModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        categoryType="resources"
        mode={selectedPersonnel ? "edit" : "create"}
        title={selectedPersonnel ? "ویرایش شخص" : "افزودن شخص جدید"}
        initialData={selectedPersonnel || {}}
        maxWidth="lg"
      />
    </Box>
  );
};

export default PersonnelTab;