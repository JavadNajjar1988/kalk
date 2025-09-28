import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  Button,
  Card,
  CardContent
} from '@mui/material';
import { 
  TableChart as GridIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { EnhancedScenario } from '../../../../types';

interface GridEditorViewProps {
  scenario: EnhancedScenario;
}

const GridEditorView: React.FC<GridEditorViewProps> = ({ scenario }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock unit data - in real implementation, this would come from scenario.units
  const mockUnits = [
    { id: '1', name: 'لشکر 21 زرهی', type: 'لشکر', status: 'فعال', personnel: 3000, location: 'تهران' },
    { id: '2', name: 'تیپ 1 زرهی', type: 'تیپ', status: 'فعال', personnel: 1500, location: 'اصفهان' },
    { id: '3', name: 'گردان 1 تانک', type: 'گردان', status: 'آماده', personnel: 500, location: 'شیراز' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'فعال': return 'success';
      case 'آماده': return 'warning';
      case 'غیرفعال': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <GridIcon color="primary" />
          <Typography variant="h5" sx={{ fontFamily: 'Vazirmatn, sans-serif' }}>
            حالت ویرایش جدولی
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          ویرایش سریع اطلاعات واحدها در قالب جدول
        </Typography>
      </Paper>

      {/* Controls */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              size="small"
              placeholder="جستجو در واحدها..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 250 }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              size="small"
            >
              افزودن واحد جدید
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flex: 1, p: 0 }}>
          <TableContainer sx={{ height: '100%' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>نام واحد</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>نوع</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>وضعیت</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>پرسنل</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>موقعیت</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>عملیات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockUnits
                  .filter(unit => 
                    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    unit.type.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((unit) => (
                    <TableRow key={unit.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {unit.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {unit.type}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={unit.status} 
                          size="small" 
                          color={getStatusColor(unit.status) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {unit.personnel.toLocaleString('fa-IR')} نفر
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {unit.location}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small" color="primary">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                
                {/* Empty state */}
                {mockUnits.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">
                        هیچ واحدی یافت نشد
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Status Bar */}
      <Paper elevation={1} sx={{ p: 1, mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          مجموع واحدها: {mockUnits.length} | 
          سناریو: {scenario.name} | 
          آخرین به‌روزرسانی: {new Date(scenario.updatedAt).toLocaleDateString('fa-IR')}
        </Typography>
      </Paper>
    </Box>
  );
};

export default GridEditorView;