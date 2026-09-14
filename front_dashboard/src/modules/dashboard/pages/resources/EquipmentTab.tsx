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
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Inventory as EquipmentIcon,
  ImageNotSupported as NoImageIcon,
  Hub as HistoryIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import resourceApiService from '@/services/api/resourceApiService';
import {
  applyPrimaryImageChanges,
  PrimaryImageChanges,
} from '@/modules/dashboard/pages/resources/components/primaryImageHelpers';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  EquipmentItem,
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
import EquipmentModal from '@/modules/dashboard/pages/resources/modals/EquipmentModal';
import EquipmentDeleteConfirmModal from '@/modules/dashboard/pages/resources/EquipmentDeleteConfirmModal';
import ResourceUsageGraphDialog from '@/modules/dashboard/pages/resources/components/ResourceUsageGraphDialog';
import LegacyResourceReconciliationDialog from './components/LegacyResourceReconciliationDialog';
import {
  buildUnitReferenceLabels,
  resolveUnitReferenceLabel,
} from './resourceReferenceLabels';

// Import equipment data
import equipmentData from '@/data/resources/equipment.json';

const EquipmentTab: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  // Redux state
  const equipment = useAppSelector(state =>
    selectTabItems(state, 'equipment')
  ) as EquipmentItem[];
  const loading = useAppSelector(state => selectTabLoading(state, 'equipment'));
  const error = useAppSelector(state => selectTabError(state, 'equipment'));
  const filters = useAppSelector(state => selectTabFilters(state, 'equipment'));
  const pagination = useAppSelector(state =>
    selectTabPagination(state, 'equipment')
  );

  // Local state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] =
    useState<EquipmentItem | null>(null);
  const [usageEquipment, setUsageEquipment] = useState<EquipmentItem | null>(
    null
  );
  const [reconcileOpen, setReconcileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [statusFilter, setStatusFilter] = useState<string>(
    filters.status || 'all'
  );
  const [typeFilter, setTypeFilter] = useState<string>(
    (filters as any).type || 'all'
  );
  const [unitReferenceLabels, setUnitReferenceLabels] = useState(
    buildUnitReferenceLabels([])
  );

  // Load data on mount
  useEffect(() => {
    dispatch(fetchTabItems({ tabType: 'equipment', filters }));
  }, [dispatch, filters]);

  useEffect(() => {
    let active = true;
    resourceApiService
      .list({ type: 'units', limit: 500 })
      .then(result => {
        if (active) {
          setUnitReferenceLabels(buildUnitReferenceLabels(result.items));
        }
      })
      .catch(() => {
        // در داده‌های قدیمی یا حالت آفلاین، مقدار خام همچنان نمایش داده می‌شود.
      });
    return () => {
      active = false;
    };
  }, []);

  // Update filters when search or status changes
  useEffect(() => {
    const newFilters = {
      search: searchTerm,
      status: statusFilter === 'all' ? undefined : statusFilter,
      type: typeFilter === 'all' ? undefined : typeFilter,
    };
    dispatch(setTabFilters({ tabType: 'equipment', filters: newFilters }));
  }, [dispatch, searchTerm, statusFilter, typeFilter]);

  const handleOpenModal = (item?: EquipmentItem) => {
    setSelectedEquipment(item || null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedEquipment(null);
  };

  const handleSave = async (
    itemData: Omit<EquipmentItem, 'id' | 'createdAt' | 'updatedAt'>,
    imageChanges?: PrimaryImageChanges
  ) => {
    try {
      if (selectedEquipment) {
        const newPrimaryMediaId = await applyPrimaryImageChanges({
          resourceId: selectedEquipment.id,
          currentPrimaryMediaId: selectedEquipment.primaryMediaId,
          changes: imageChanges,
        });
        await dispatch(
          updateTabItem({
            tabType: 'equipment',
            itemId: selectedEquipment.id,
            itemData: { ...itemData, primaryMediaId: newPrimaryMediaId },
          })
        ).unwrap();
      } else {
        const result = await dispatch(
          createTabItem({
            tabType: 'equipment',
            itemData,
          })
        ).unwrap();
        const created = result.item as EquipmentItem;
        if (imageChanges?.selectedFile) {
          const newPrimaryMediaId = await applyPrimaryImageChanges({
            resourceId: created.id,
            currentPrimaryMediaId: undefined,
            changes: imageChanges,
          });
          if (newPrimaryMediaId) {
            await dispatch(
              updateTabItem({
                tabType: 'equipment',
                itemId: created.id,
                itemData: { ...itemData, primaryMediaId: newPrimaryMediaId },
              })
            ).unwrap();
          }
        }
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving equipment:', error);
    }
  };

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDeleteEquipment, setPendingDeleteEquipment] =
    useState<EquipmentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = (id: string) => {
    const item = equipment.find(e => e.id === id) || null;
    setPendingDeleteEquipment(item);
    setDeleteOpen(true);
  };

  const confirmDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      await dispatch(
        deleteTabItem({ tabType: 'equipment', itemId: id })
      ).unwrap();
      setDeleteOpen(false);
      setPendingDeleteEquipment(null);
    } catch (error) {
      console.error('Error deleting equipment:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    dispatch(
      setTabPagination({ tabType: 'equipment', pagination: { page: newPage } })
    );
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    dispatch(
      setTabPagination({
        tabType: 'equipment',
        pagination: { pageSize: newRowsPerPage, page: 0 },
      })
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'primary';
      case 'assigned':
        return 'info';
      case 'maintenance':
        return 'warning';
      case 'retired':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'موجود';
      case 'assigned':
        return 'تخصیص‌یافته';
      case 'maintenance':
        return 'در تعمیر';
      case 'retired':
        return 'مستهلک';
      default:
        return status;
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent':
        return 'primary';
      case 'good':
        return 'info';
      case 'fair':
        return 'warning';
      case 'poor':
        return 'error';
      case 'damaged':
        return 'error';
      default:
        return 'default';
    }
  };

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'excellent':
        return 'عالی';
      case 'good':
        return 'خوب';
      case 'fair':
        return 'قابل قبول';
      case 'poor':
        return 'ضعیف';
      case 'damaged':
        return 'آسیب‌دیده';
      default:
        return condition;
    }
  };

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch =
      !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.equipmentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.manufacturer &&
        item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <Box
      sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <EquipmentIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight="bold">
            مدیریت تجهیزات و سامانه‌ها
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<LinkIcon />}
            onClick={() => setReconcileOpen(true)}
          >
            تطبیق تجهیزات قدیمی
          </Button>
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
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            افزودن تجهیز جدید
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="جستجو در تجهیزات..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
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
              onChange={e => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">همه</MenuItem>
              <MenuItem value="available">موجود</MenuItem>
              <MenuItem value="assigned">تخصیص‌یافته</MenuItem>
              <MenuItem value="maintenance">در تعمیر</MenuItem>
              <MenuItem value="retired">مستهلک</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="فیلتر نوع"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <MenuItem value="all">همه</MenuItem>
              <MenuItem value="سلاح">سلاح</MenuItem>
              <MenuItem value="وسیله نقلیه">وسیله نقلیه</MenuItem>
              <MenuItem value="ارتباطات">ارتباطات</MenuItem>
              <MenuItem value="الکترونیک">الکترونیک</MenuItem>
              <MenuItem value="پشتیبانی">پشتیبانی</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="body2" color="text.secondary">
              تعداد کل: {filteredEquipment.length}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Equipment Table */}
      <Paper
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
        }}
      >
        <TableContainer sx={{ flex: 1 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 64 }}>تصویر</TableCell>
                <TableCell>کد تجهیز</TableCell>
                <TableCell>نام تجهیز</TableCell>
                <TableCell>نوع</TableCell>
                <TableCell>تعداد</TableCell>
                <TableCell>مودل</TableCell>
                <TableCell>وضعیت</TableCell>
                <TableCell>شرایط</TableCell>
                <TableCell>مکان یا یگان</TableCell>
                <TableCell align="center">عملیات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEquipment
                .slice(
                  pagination.page * pagination.pageSize,
                  pagination.page * pagination.pageSize + pagination.pageSize
                )
                .map(item => (
                  <TableRow
                    key={item.id}
                    hover
                    onClick={() => setUsageEquipment(item)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      {item.primaryMediaId ? (
                        <Avatar
                          variant="rounded"
                          src={resourceApiService.getMediaUrl(
                            item.primaryMediaId
                          )}
                          sx={{ width: 40, height: 40 }}
                        />
                      ) : (
                        <Avatar
                          variant="rounded"
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: 'background.default',
                            color: 'text.disabled',
                          }}
                        >
                          <NoImageIcon fontSize="small" />
                        </Avatar>
                      )}
                    </TableCell>
                    <TableCell>{item.equipmentCode}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.quantity ?? 1}</TableCell>
                    <TableCell>{item.model || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(item.status)}
                        color={getStatusColor(item.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getConditionLabel(item.condition)}
                        color={getConditionColor(item.condition) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {resolveUnitReferenceLabel(
                        item.location || item.assignedTo,
                        unitReferenceLabels
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={event => {
                          event.stopPropagation();
                          handleOpenModal(item);
                        }}
                        color="primary"
                        title="ویرایش"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={event => {
                          event.stopPropagation();
                          handleDelete(item.id);
                        }}
                        color="error"
                        title="حذف"
                      >
                        <DeleteIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={event => {
                          event.stopPropagation();
                          setUsageEquipment(item);
                        }}
                        color="secondary"
                        title="سابقه عملیات"
                      >
                        <HistoryIcon />
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
          count={filteredEquipment.length}
          rowsPerPage={pagination.pageSize}
          page={pagination.page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          labelRowsPerPage="تعداد ردیف در صفحه"
        />
      </Paper>

      {/* Equipment Modal */}
      <EquipmentModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        equipment={selectedEquipment}
        categories={equipmentData.categories}
      />

      <EquipmentDeleteConfirmModal
        open={deleteOpen}
        item={pendingDeleteEquipment}
        onClose={() => {
          setDeleteOpen(false);
          setPendingDeleteEquipment(null);
        }}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />

      <ResourceUsageGraphDialog
        open={Boolean(usageEquipment)}
        resourceId={usageEquipment?.id || null}
        resourceName={usageEquipment?.name}
        onClose={() => setUsageEquipment(null)}
      />
      <LegacyResourceReconciliationDialog
        open={reconcileOpen}
        type="equipment"
        onClose={() => setReconcileOpen(false)}
        onApplied={() =>
          dispatch(fetchTabItems({ tabType: 'equipment', filters }))
        }
      />
    </Box>
  );
};

export default EquipmentTab;
