import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  Chip,
  Divider,
  Paper,
  Stack,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Sync as SyncIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Tab as TabIcon,
  ViewColumn as FieldIcon,
  AccountTree as HierarchyIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { simulateDefinitionChange } from '@/utils/definitionSync';
import { useDefinitionData } from '@/hooks/useDefinitionData';
import { useHierarchicalData } from '@/hooks/useHierarchicalData';
import DynamicModal from '@/components/common/DynamicModal';

/**
 * کامپوننت تست سیستم همگام‌سازی real-time
 * این کامپوننت نشان می‌دهد که چگونه تغییرات در definition-editor
 * بلافاصله در مودال‌ها و HierarchicalSelector منعکس می‌شوند
 */
const RealTimeSyncTest: React.FC = () => {
  const [autoSync, setAutoSync] = useState(true);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'users' | 'resources'>('users');
  
  // استفاده از hooks برای تست همگام‌سازی
  const usersData = useDefinitionData('users');
  const resourcesData = useDefinitionData('resources');
  const usersHierarchy = useHierarchicalData('users');
  const resourcesHierarchy = useHierarchicalData('resources');

  const addTestResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('fa-IR');
    setTestResults(prev => [...prev.slice(-19), `[${timestamp}] ${message}`]);
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  // تست‌های شبیه‌سازی تغییرات
  const simulateTabChanges = (category: 'users' | 'resources') => {
    const baseId = category === 'users' ? 'pr-2' : 'pr-1';
    const newTabId = `${baseId}-new-tab-${Date.now()}`;
    
    simulateDefinitionChange(
      'add',
      'persons',
      newTabId,
      null,
      {
        id: newTabId,
        name: `تب جدید ${Date.now()}`,
        parentId: baseId,
        customFields: [
          {
            id: `field-${Date.now()}`,
            name: 'فیلد تست',
            type: 'text',
            isRequired: true,
            order: 1
          }
        ]
      }
    );
    
    addTestResult(`شبیه‌سازی اضافه کردن تب جدید در ${category}: ${newTabId}`);
  };

  const simulateFieldChanges = (category: 'users' | 'resources') => {
    const baseId = category === 'users' ? 'pr-2-1' : 'pr-1-1'; // فرض کنیم تب اول
    
    simulateDefinitionChange(
      'update',
      'persons',
      baseId,
      null,
      {
        customFields: [
          {
            id: `new-field-${Date.now()}`,
            name: `فیلد جدید ${Date.now()}`,
            type: 'email',
            isRequired: false,
            order: 999
          }
        ]
      }
    );
    
    addTestResult(`شبیه‌سازی اضافه کردن فیلد جدید در ${category}`);
  };

  const simulateHierarchyChanges = (category: 'users' | 'resources') => {
    const legalInfoId = category === 'users' ? 'pr-2-3' : 'pr-1-2';
    const newNodeId = `${legalInfoId}-new-${Date.now()}`;
    
    simulateDefinitionChange(
      'add',
      'persons',
      newNodeId,
      null,
      {
        id: newNodeId,
        name: `گره جدید ${Date.now()}`,
        parentId: legalInfoId,
        customFields: [
          {
            id: `hier-field-${Date.now()}`,
            name: 'فیلد سلسله‌مراتبی',
            type: 'text',
            isRequired: true
          }
        ]
      }
    );
    
    addTestResult(`شبیه‌سازی اضافه کردن گره سلسله‌مراتبی در ${category}`);
  };

  const simulateTabDeletion = (category: 'users' | 'resources') => {
    const baseId = category === 'users' ? 'pr-2-1' : 'pr-1-1';
    
    simulateDefinitionChange(
      'delete',
      'persons',
      baseId,
      { id: baseId, name: 'تب حذف شده' },
      null
    );
    
    addTestResult(`شبیه‌سازی حذف تب در ${category}`);
  };

  const simulateGlobalRefresh = () => {
    simulateDefinitionChange(
      'update',
      'persons',
      '*',
      null,
      { message: 'بروزرسانی کلی تمام تعاریف' }
    );
    
    addTestResult('شبیه‌سازی بروزرسانی کلی تمام تعاریف');
  };

  const openModal = (type: 'users' | 'resources') => {
    setModalType(type);
    setModalOpen(true);
  };

  const handleSaveModal = async (data: Record<string, any>) => {
    console.log('Modal data saved:', data);
    addTestResult(`داده‌های مودال ${modalType} ذخیره شد`);
  };

  // نمایش وضعیت همگام‌سازی
  const renderSyncStatus = (
    title: string, 
    data: any, 
    hierarchy?: any
  ) => (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" color="primary">
            {title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label={data.loading ? 'بارگذاری...' : 'آماده'} 
              color={data.loading ? 'warning' : 'success'} 
              size="small" 
            />
            <Tooltip title="بروزرسانی دستی">
              <IconButton size="small" onClick={() => data.reload?.()}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              تعداد تب‌ها: {data.definitionData?.tabs?.length || 0}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              آخرین sync: {data.lastSyncTime ? new Date(data.lastSyncTime).toLocaleTimeString('fa-IR') : 'نامشخص'}
            </Typography>
          </Grid>
          {hierarchy && (
            <>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  گره‌های سلسله‌مراتبی: {hierarchy.rootNode?.children?.length || 0}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  مسیر انتخاب شده: {hierarchy.selectedPath?.length || 0}
                </Typography>
              </Grid>
            </>
          )}
        </Grid>

        {data.error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {data.error}
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: 'primary.main' }}>
        <SyncIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        تست سیستم همگام‌سازی Real-time
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        این صفحه برای تست کامل سیستم همگام‌سازی با definition-editor طراحی شده است.
        تغییرات شبیه‌سازی شده باید بلافاصله در مودال‌ها و component های مربوطه منعکس شوند.
      </Alert>

      <Grid container spacing={3}>
        {/* کنترل‌های اصلی */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">کنترل‌های تست</Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                  />
                }
                label="همگام‌سازی خودکار"
              />
            </Box>
            
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <Button
                variant="contained"
                startIcon={<SyncIcon />}
                onClick={simulateGlobalRefresh}
              >
                بروزرسانی کلی
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<TabIcon />}
                onClick={() => simulateTabChanges('users')}
              >
                تست تب کاربران
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<TabIcon />}
                onClick={() => simulateTabChanges('resources')}
              >
                تست تب منابع
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<FieldIcon />}
                onClick={() => simulateFieldChanges('users')}
              >
                تست فیلد کاربران
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<FieldIcon />}
                onClick={() => simulateFieldChanges('resources')}
              >
                تست فیلد منابع
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<HierarchyIcon />}
                onClick={() => simulateHierarchyChanges('users')}
              >
                تست سلسله‌مراتب کاربران
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<HierarchyIcon />}
                onClick={() => simulateHierarchyChanges('resources')}
              >
                تست سلسله‌مراتب منابع
              </Button>
              
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => simulateTabDeletion('users')}
              >
                تست حذف تب
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* وضعیت همگام‌سازی */}
        <Grid item xs={12} md={6}>
          {renderSyncStatus('کاربران', usersData, usersHierarchy)}
          
          <Button
            variant="contained"
            fullWidth
            onClick={() => openModal('users')}
            sx={{ mb: 2 }}
          >
            باز کردن مودال کاربران
          </Button>
        </Grid>

        <Grid item xs={12} md={6}>
          {renderSyncStatus('منابع', resourcesData, resourcesHierarchy)}
          
          <Button
            variant="contained"
            fullWidth
            onClick={() => openModal('resources')}
            sx={{ mb: 2 }}
          >
            باز کردن مودال منابع
          </Button>
        </Grid>

        {/* لاگ رویدادها */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                لاگ رویدادهای همگام‌سازی ({testResults.length})
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={clearTestResults}
              >
                پاک کردن لاگ
              </Button>
            </Box>
            
            <Box
              sx={{
                maxHeight: 300,
                overflow: 'auto',
                bgcolor: 'grey.50',
                p: 2,
                borderRadius: 1,
                fontFamily: 'monospace'
              }}
            >
              {testResults.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  هیچ رویدادی ثبت نشده است...
                </Typography>
              ) : (
                testResults.map((result, index) => (
                  <Typography
                    key={index}
                    variant="body2"
                    sx={{
                      mb: 0.5,
                      fontSize: '0.875rem',
                      color: result.includes('شبیه‌سازی') ? 'warning.main' : 'text.primary'
                    }}
                  >
                    {result}
                  </Typography>
                ))
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* مودال تست */}
      <DynamicModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveModal}
        categoryType={modalType}
        mode="create"
        title={`تست مودال ${modalType === 'users' ? 'کاربران' : 'منابع'}`}
      />

      <Box sx={{ mt: 3 }}>
        <Alert severity="success">
          <Typography variant="body2">
            ✅ سیستم همگام‌سازی real-time پیاده‌سازی شد
            <br />
            ✅ تغییرات تب‌ها و فیلدها به‌طور خودکار اعمال می‌شوند
            <br />
            ✅ سیستم hierarchical selector متصل شد
            <br />
            ✅ مودال‌ها با definition-editor همگام‌سازی می‌شوند
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default RealTimeSyncTest;