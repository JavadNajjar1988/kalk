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
  Alert,
  CircularProgress,
  Fab,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Person as PersonIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  TableView as TableViewIcon,
  ViewModule as CardViewIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchUsers, setFilters, clearFilters, setPagination, clearError, createUser, setViewMode, updateUser, deleteUser, performQuickAction } from '../store/usersSlice';
import type { User, UserFilters, QuickActionPayload } from '../types';
import { useTranslation } from '@/hooks/useTranslation';
import { UsersTableView, UsersCardView, QuickActionsModal, UserDetailsModal, EditUserModal, DeleteConfirmationModal } from '../components';

const UsersListPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  
  const {
    users,
    roles,
    accessLevels,
    filters,
    viewMode,
    isLoading,
    error,
    pagination,
  } = useAppSelector((state) => state.users);

  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickActionsModal, setShowQuickActionsModal] = useState(false);
  const [selectedUserForQuickActions, setSelectedUserForQuickActions] = useState<User | null>(null);
  
  // Modal states for CRUD operations
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUserForm, setNewUserForm] = useState({
    fullName: '',
    nationalId: '',
    gender: 'مرد' as 'مرد' | 'زن',
    nationality: 'ایرانی' as 'ایرانی' | 'غیرایرانی' | 'تبعه مضاعف',
    mobile: '',
    role: 'مهمان',
    accessLevel: 'سطح 4 - دسترسی مهمان',
    status: 'آزاد' as 'آزاد' | 'نظامی' | 'غیرنظامی',
  });

  useEffect(() => {
    dispatch(clearError());
    dispatch(fetchUsers());
  }, [dispatch, filters, pagination.page]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    dispatch(setFilters({ search: value }));
  };

  const handleFilterChange = (filterKey: keyof UserFilters, value: any) => {
    dispatch(setFilters({ [filterKey]: value }));
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    dispatch(clearFilters());
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    dispatch(setPagination({ page: value }));
  };

  const handleAddUser = () => {
    setShowAddModal(true);
  };

  const handleViewModeChange = (event: React.MouseEvent<HTMLElement>, newViewMode: 'table' | 'card') => {
    if (newViewMode !== null) {
      dispatch(setViewMode({ type: newViewMode }));
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleView = (user: User) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const handleQuickAction = (user: User) => {
    setSelectedUserForQuickActions(user);
    setShowQuickActionsModal(true);
  };

  const handleQuickActionExecute = async (payload: QuickActionPayload) => {
    try {
      await dispatch(performQuickAction(payload));
      setShowQuickActionsModal(false);
      setSelectedUserForQuickActions(null);
    } catch (error) {
      console.error('Quick action error:', error);
    }
  };

  const handleSaveUser = async () => {
    try {
      const userCode = `USR${Date.now().toString().slice(-6)}`;

      const professionalDetails: User['professionalInfo']['details'] =
        newUserForm.status === 'نظامی'
          ? { forceType: 'ارتش' as const, rank: 'سرباز', position: 'کارمند' }
          : newUserForm.status === 'غیرنظامی'
            ? { occupation: 'نامشخص' }
            : { businessType: 'کسب و کار آزاد', expertise: 'عمومی' };

      const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
        userCode,
        personalInfo: {
          fullName: newUserForm.fullName || 'کاربر جدید',
          fatherName: '',
          nationalId: newUserForm.nationalId || `${Date.now().toString().slice(-10)}`,
          nationality: newUserForm.nationality,
          birthDate: new Date().toISOString(),
          gender: newUserForm.gender,
        },
        contactInfo: {
          mobile: [newUserForm.mobile || `0912${Date.now().toString().slice(-7)}`],
        },
        professionalInfo: {
          status: newUserForm.status,
          details: professionalDetails,
        },
        systemInfo: {
          role: newUserForm.role,
          accessLevel: newUserForm.accessLevel,
          permissions: ['مشاهده محدود'],
          loginCount: 0,
          password: 'temp_password',
          passwordLastChanged: new Date().toISOString()
        },
        isActive: true,
      };

      const resultAction = await dispatch(createUser(userData));
      if (createUser.fulfilled.match(resultAction)) {
        setShowAddModal(false);
        setNewUserForm({
          fullName: '',
          nationalId: '',
          gender: 'مرد',
          nationality: 'ایرانی',
          mobile: '',
          role: 'مهمان',
          accessLevel: 'سطح 4 - دسترسی مهمان',
          status: 'آزاد',
        });
        dispatch(fetchUsers());
      }
    } catch (error) {
      console.error('Error in handleSaveUser:', error);
    }
  };

  // Handle edit user
  const handleSaveEditUser = async (user: User, updatedData: Partial<User>) => {
    try {
      await dispatch(updateUser({ id: user.id, userData: updatedData }));
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  // Handle delete user
  const handleConfirmDelete = async (user: User) => {
    try {
      await dispatch(deleteUser(user.id));
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  // Handle modal close functions
  const handleCloseModals = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedUser(null);
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
          مدیریت کاربران
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* View Mode Toggle */}
          <ToggleButtonGroup
            value={viewMode.type}
            exclusive
            onChange={handleViewModeChange}
            size="small"
          >
            <ToggleButton value="table">
              <Tooltip title="نمایش جدولی">
                <TableViewIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="card">
              <Tooltip title="نمایش کارتی">
                <CardViewIcon />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddUser}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
            }}
          >
            افزودن کاربر جدید
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <FilterIcon sx={{ mr: 1 }} />
            فیلترها و جستجو
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="جستجو در کاربران..."
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
            <Grid item xs={12} md={1.5}>
              <FormControl fullWidth>
                <InputLabel>وضعیت</InputLabel>
                <Select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="وضعیت"
                >
                  <MenuItem value="">همه</MenuItem>
                  <MenuItem value="نظامی">نظامی</MenuItem>
                  <MenuItem value="آزاد">آزاد</MenuItem>
                  <MenuItem value="غیرنظامی">غیرنظامی</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1.5}>
              <FormControl fullWidth>
                <InputLabel>نقش</InputLabel>
                <Select
                  value={filters.role || ''}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  label="نقش"
                >
                  <MenuItem value="">همه</MenuItem>
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.name}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1.5}>
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
            <Grid item xs={12} md={1.5}>
              <FormControl fullWidth>
                <InputLabel>فعالیت</InputLabel>
                <Select
                  value={filters.isActive !== undefined ? (filters.isActive ? 'active' : 'inactive') : ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      handleFilterChange('isActive', undefined);
                    } else {
                      handleFilterChange('isActive', value === 'active');
                    }
                  }}
                  label="فعالیت"
                >
                  <MenuItem value="">همه</MenuItem>
                  <MenuItem value="active">فعال</MenuItem>
                  <MenuItem value="inactive">غیرفعال</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
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

      {/* Users Display */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : users.length === 0 ? (
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              هیچ کاربری یافت نشد
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {Object.keys(filters).length > 0 ? 'برای نمایش کاربران، فیلترها را تغییر دهید' : 'برای افزودن کاربر جدید روی دکمه "افزودن کاربر جدید" کلیک کنید'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Results Count */}
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography component="div" variant="body2" color="text.secondary">
              {pagination.total} کاربر یافت شد
              {Object.keys(filters).length > 0 && (
                <Chip 
                  label={`${Object.keys(filters).length} فیلتر فعال`} 
                  size="small" 
                  variant="outlined" 
                  sx={{ ml: 1 }}
                  onDelete={handleClearFilters}
                />
              )}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            {viewMode.type === 'table' ? (
              <UsersTableView
                users={users}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                onQuickAction={handleQuickAction}
              />
            ) : (
              <UsersCardView
                users={users}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                onQuickAction={handleQuickAction}
              />
            )}
          </Box>
        </>
      )}

      {/* Floating Action Button for Mobile */}
      <Fab
        color="primary"
        aria-label="add user"
        onClick={handleAddUser}
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
        <DialogTitle>افزودن کاربر جدید</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="نام و نام خانوادگی"
                value={newUserForm.fullName}
                onChange={(e) => setNewUserForm((prev) => ({ ...prev, fullName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="کد ملی"
                value={newUserForm.nationalId}
                onChange={(e) => setNewUserForm((prev) => ({ ...prev, nationalId: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="شماره موبایل"
                value={newUserForm.mobile}
                onChange={(e) => setNewUserForm((prev) => ({ ...prev, mobile: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>جنسیت</InputLabel>
                <Select
                  value={newUserForm.gender}
                  label="جنسیت"
                  onChange={(e) => setNewUserForm((prev) => ({ ...prev, gender: e.target.value as 'مرد' | 'زن' }))}
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
                  value={newUserForm.nationality}
                  label="تابعیت"
                  onChange={(e) =>
                    setNewUserForm((prev) => ({
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
              <FormControl fullWidth>
                <InputLabel>وضعیت حرفه‌ای</InputLabel>
                <Select
                  value={newUserForm.status}
                  label="وضعیت حرفه‌ای"
                  onChange={(e) =>
                    setNewUserForm((prev) => ({
                      ...prev,
                      status: e.target.value as 'آزاد' | 'نظامی' | 'غیرنظامی',
                    }))
                  }
                >
                  <MenuItem value="آزاد">آزاد</MenuItem>
                  <MenuItem value="نظامی">نظامی</MenuItem>
                  <MenuItem value="غیرنظامی">غیرنظامی</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddModal(false)}>انصراف</Button>
          <Button variant="contained" onClick={handleSaveUser}>ذخیره</Button>
        </DialogActions>
      </Dialog>

      {/* Quick Actions Modal */}
      <QuickActionsModal
        user={selectedUserForQuickActions}
        open={showQuickActionsModal}
        onClose={() => setShowQuickActionsModal(false)}
        onAction={handleQuickActionExecute}
        roles={roles}
        accessLevels={accessLevels}
      />

      {/* User Details Modal */}
      <UserDetailsModal
        user={selectedUser}
        open={showViewModal}
        onClose={handleCloseModals}
      />

      {/* Edit User Modal */}
      <EditUserModal
        user={selectedUser}
        open={showEditModal}
        onClose={handleCloseModals}
        onSave={handleSaveEditUser}
        isSaving={isLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        user={selectedUser}
        open={showDeleteModal}
        onClose={handleCloseModals}
        onConfirm={handleConfirmDelete}
        isDeleting={isLoading}
      />
    </Box>
  );
};

export default UsersListPage;
