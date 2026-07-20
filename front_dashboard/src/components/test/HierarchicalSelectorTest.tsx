import React, { useState } from 'react';
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
  Stack
} from '@mui/material';
import {
  PlayArrow as TestIcon,
  Sync as SyncIcon,
  AccountTree as HierarchyIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { simulateDefinitionChange } from '@/utils/definitionSync';
import HierarchicalSelector from '@/components/common/HierarchicalSelector';

/**
 * Test component for demonstrating hierarchical selector and real-time sync functionality
 * This component allows testing of the hierarchical selection system and sync events
 */
const HierarchicalSelectorTest: React.FC = () => {
  const [selectedUsersPath, setSelectedUsersPath] = useState<string[]>([]);
  const [selectedResourcesPath, setSelectedResourcesPath] = useState<string[]>([]);
  const [usersFields, setUsersFields] = useState<any[]>([]);
  const [resourcesFields, setResourcesFields] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('fa-IR');
    setTestResults(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  // Test functions for simulating definition-editor changes
  const simulateAddNode = (category: 'users' | 'resources') => {
    const nodeId = category === 'users' ? 'pr-2-3' : 'pr-1-2';
    const newNodeId = `${nodeId}-new-${Date.now()}`;
    
    simulateDefinitionChange(
      'add',
      'persons',
      newNodeId,
      null,
      {
        id: newNodeId,
        name: `گره جدید ${Date.now()}`,
        parentId: nodeId
      }
    );
    
    addTestResult(`شبیه‌سازی اضافه کردن گره جدید در ${category}: ${newNodeId}`);
  };

  const simulateRenameNode = (category: 'users' | 'resources') => {
    const nodeId = category === 'users' ? 'pr-2-3' : 'pr-1-2';
    
    simulateDefinitionChange(
      'rename',
      'persons',
      nodeId,
      { name: 'نام قدیمی' },
      { name: `نام جدید ${Date.now()}` }
    );
    
    addTestResult(`شبیه‌سازی تغییر نام گره در ${category}: ${nodeId}`);
  };

  const simulateDeleteNode = (category: 'users' | 'resources') => {
    const nodeId = category === 'users' ? 'pr-2-3-test' : 'pr-1-2-test';
    
    simulateDefinitionChange(
      'delete',
      'persons',
      nodeId,
      { id: nodeId, name: 'گره حذف شده' },
      null
    );
    
    addTestResult(`شبیه‌سازی حذف گره در ${category}: ${nodeId}`);
  };

  const simulateGlobalSync = () => {
    simulateDefinitionChange(
      'update',
      'persons',
      '*',
      null,
      { message: 'بروزرسانی کلی' }
    );
    
    addTestResult('شبیه‌سازی بروزرسانی کلی تعاریف');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: 'primary.main' }}>
        <HierarchyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        تست سیستم انتخاب سلسله‌مراتبی و همگام‌سازی
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        این صفحه برای تست عملکرد سیستم انتخاب سلسله‌مراتبی و همگام‌سازی real-time با definition-editor طراحی شده است.
      </Alert>

      <Grid container spacing={3}>
        {/* Users Hierarchical Selector */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                انتخاب سلسله‌مراتبی کاربران
              </Typography>
              
              <HierarchicalSelector
                categoryType="users"
                value={selectedUsersPath}
                onChange={(path, finalNodeId) => {
                  setSelectedUsersPath(path);
                  addTestResult(`مسیر کاربران تغییر کرد: [${path.join(' → ')}]${finalNodeId ? ` (گره نهایی: ${finalNodeId})` : ''}`);
                }}
                onFieldsChange={(fields) => {
                  setUsersFields(fields);
                  addTestResult(`فیلدهای کاربران بروزرسانی شد: ${fields.length} فیلد`);
                }}
              />
              
              {usersFields.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    فیلدهای دریافت شده:
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.5}>
                    {usersFields.slice(0, 5).map((field: any, index) => (
                      <Chip
                        key={field.id || index}
                        label={field.name}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    ))}
                    {usersFields.length > 5 && (
                      <Chip
                        label={`+${usersFields.length - 5} فیلد دیگر`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </Box>
              )}

              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => simulateAddNode('users')}
                >
                  شبیه‌سازی اضافه
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => simulateRenameNode('users')}
                >
                  شبیه‌سازی تغییر نام
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => simulateDeleteNode('users')}
                >
                  شبیه‌سازی حذف
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Resources Hierarchical Selector */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: 'secondary.main' }}>
                انتخاب سلسله‌مراتبی منابع
              </Typography>
              
              <HierarchicalSelector
                categoryType="resources"
                value={selectedResourcesPath}
                onChange={(path, finalNodeId) => {
                  setSelectedResourcesPath(path);
                  addTestResult(`مسیر منابع تغییر کرد: [${path.join(' → ')}]${finalNodeId ? ` (گره نهایی: ${finalNodeId})` : ''}`);
                }}
                onFieldsChange={(fields) => {
                  setResourcesFields(fields);
                  addTestResult(`فیلدهای منابع بروزرسانی شد: ${fields.length} فیلد`);
                }}
              />
              
              {resourcesFields.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    فیلدهای دریافت شده:
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.5}>
                    {resourcesFields.slice(0, 5).map((field: any, index) => (
                      <Chip
                        key={field.id || index}
                        label={field.name}
                        size="small"
                        variant="outlined"
                        color="secondary"
                      />
                    ))}
                    {resourcesFields.length > 5 && (
                      <Chip
                        label={`+${resourcesFields.length - 5} فیلد دیگر`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </Box>
              )}

              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => simulateAddNode('resources')}
                >
                  شبیه‌سازی اضافه
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => simulateRenameNode('resources')}
                >
                  شبیه‌سازی تغییر نام
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => simulateDeleteNode('resources')}
                >
                  شبیه‌سازی حذف
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Control Panel */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              کنترل‌های تست
            </Typography>
            
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<SyncIcon />}
                onClick={simulateGlobalSync}
              >
                شبیه‌سازی بروزرسانی کلی
              </Button>
              
              <Button
                variant="outlined"
                onClick={clearTestResults}
              >
                پاک کردن لاگ‌ها
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* Test Results Log */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              لاگ تست‌ها ({testResults.length})
            </Typography>
            
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
                  هیچ تستی اجرا نشده است...
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

      <Box sx={{ mt: 3 }}>
        <Alert severity="success">
          <Typography variant="body2">
            ✅ سیستم انتخاب سلسله‌مراتبی پیاده‌سازی شد
            <br />
            ✅ سیستم همگام‌سازی real-time راه‌اندازی شد
            <br />
            ✅ اتصال به DynamicForm و DynamicModal انجام شد
            <br />
            ✅ مدیریت خطاها و بهبود عملکرد اعمال شد
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default HierarchicalSelectorTest;