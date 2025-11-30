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
import DynamicModal from '@/components/common/DynamicModal';
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

  const handleSaveUser = async (formData: Record<string, any>) => {
    try {
      console.log('Form data received from DynamicModal:', formData);
      
      // Show form data structure for debugging
      Object.keys(formData).forEach(tabId => {
        console.log(`Tab ${tabId}:`, formData[tabId]);
      });
      
      // Extract data from each tab
      const personalInfo = formData['pr-2-1'] || {};
      const contactInfo = formData['pr-2-2'] || {};
      const legalInfo = formData['pr-2-3'] || {}; // This might contain hierarchical data
      const educationInfo = formData['pr-2-4'] || {};
      
      console.log('Extracted tab data:', { personalInfo, contactInfo, legalInfo, educationInfo });
      
      // Generate user code
      const userCode = `USR${Date.now().toString().slice(-6)}`;
      
      // Determine professional status and details based on legal information
      let professionalStatus: 'آزاد' | 'نظامی' | 'غیرنظامی' = 'آزاد';
      let professionalDetails: any = {};
      
      // Check if hierarchical legal info was selected
      if (legalInfo.hierarchicalFields && legalInfo.hierarchicalFields.length > 0) {
        // Process hierarchical form data
        const hierarchicalData: Record<string, any> = {};
        legalInfo.hierarchicalFields.forEach((field: any) => {
          if (legalInfo[field.id]) {
            hierarchicalData[field.id] = legalInfo[field.id];
          }
        });
        
        // Determine status based on selected path
        const selectedPath = legalInfo.hierarchicalPath || [];
        if (selectedPath.includes('نظامی') || selectedPath.includes('Military')) {
          professionalStatus = 'نظامی';
          professionalDetails = {
            forceType: hierarchicalData['legal-military-force'] || 'ارتش',
            rank: hierarchicalData['legal-military-rank'] || 'سرباز',
            position: hierarchicalData['legal-military-position'] || 'کارمند',
            serviceNumber: hierarchicalData['legal-military-service-number'] || '',
            unit: hierarchicalData['legal-military-unit'] || 'واحد عمومی'
          };
        } else if (selectedPath.includes('دولتی') || selectedPath.includes('Government')) {
          professionalStatus = 'غیرنظامی';
          professionalDetails = {
            organization: hierarchicalData['legal-gov-organization'] || 'سازمان دولتی',
            department: hierarchicalData['legal-gov-department'] || 'بخش عمومی',
            jobTitle: hierarchicalData['legal-gov-job-title'] || 'کارمند',
            employeeCode: hierarchicalData['legal-gov-employee-code'] || ''
          };
        } else if (selectedPath.includes('خصوصی') || selectedPath.includes('Private')) {
          professionalStatus = 'غیرنظامی';
          professionalDetails = {
            companyName: hierarchicalData['legal-private-company-name'] || 'شرکت خصوصی',
            position: hierarchicalData['legal-private-position'] || 'کارمند',
            industry: hierarchicalData['legal-private-industry'] || 'عمومی'
          };
        } else {
          // Default to freelance
          professionalDetails = {
            businessType: hierarchicalData['legal-freelance-business-type'] || 'کسب و کار آزاد',
            expertise: hierarchicalData['legal-freelance-specialization'] || 'عمومی',
            experienceYears: hierarchicalData['legal-freelance-experience-years'] || 0
          };
        }
      } else {
        // If no hierarchical data, use simple default
        professionalDetails = {
          businessType: 'کسب و کار آزاد',
          expertise: 'عمومی'
        };
      }
      
      // Transform form data to User format with comprehensive data
      const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
        userCode,
        personalInfo: {
          fullName: personalInfo['pf-full-name'] || personalInfo['fullName'] || 'کاربر جدید',
          fullNameEn: personalInfo['pf-full-name-en'] || personalInfo['fullNameEn'] || '',
          fatherName: personalInfo['pf-father-name'] || personalInfo['fatherName'] || '',
          nationalId: personalInfo['pf-national-id'] || personalInfo['nationalId'] || `${Date.now().toString().slice(-10)}`,
          nationality: personalInfo['pf-nationality'] || personalInfo['nationality'] || 'ایرانی',
          birthDate: personalInfo['pf-birth-date'] || personalInfo['birthDate'] || new Date().toISOString(),
          gender: personalInfo['pf-gender'] || personalInfo['gender'] || 'مرد',
          birthPlace: personalInfo['pf-birth-place'] || personalInfo['birthPlace'] || '',
          maritalStatus: personalInfo['pf-marital-status'] || personalInfo['maritalStatus'] || 'مجرد',
        },
        contactInfo: {
          landline: contactInfo['cf-landline'] || contactInfo['landline'] || '',
          mobile: Array.isArray(contactInfo['cf-mobile']) ? contactInfo['cf-mobile'] : 
                  (contactInfo['cf-mobile'] ? [contactInfo['cf-mobile']] : 
                  (contactInfo['mobile'] ? (Array.isArray(contactInfo['mobile']) ? contactInfo['mobile'] : [contactInfo['mobile']]) : 
                  [`0912${Date.now().toString().slice(-7)}`])),
          addresses: contactInfo['cf-address'] || contactInfo['addresses'] || '',
          email: contactInfo['cf-email'] || contactInfo['email'] || '',
          postalCode: contactInfo['cf-postal-code'] || contactInfo['postalCode'] || '',
          socialNetworks: Array.isArray(contactInfo['cf-social-networks']) ? contactInfo['cf-social-networks'] : 
                         (contactInfo['socialNetworks'] ? contactInfo['socialNetworks'] : []),
        },
        professionalInfo: {
          status: professionalStatus,
          details: professionalDetails,
        },
        systemInfo: {
          role: 'مهمان',
          accessLevel: 'سطح 4 - دسترسی مهمان',
          permissions: ['مشاهده محدود'],
          loginCount: 0,
          password: 'temp_password',
          passwordLastChanged: new Date().toISOString()
        },
        isActive: true,
      };
      
      console.log('Final transformed user data:', userData);
      
      const resultAction = await dispatch(createUser(userData));
      if (createUser.fulfilled.match(resultAction)) {
        setShowAddModal(false);
        dispatch(fetchUsers());
      } else {
        console.error('Failed to create user:', resultAction.error);
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

      {/* Dynamic Modal for Adding Users */}
      <DynamicModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveUser}
        categoryType="users"
        mode="create"
        title="افزودن کاربر جدید"
        maxWidth="lg"
      />

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
