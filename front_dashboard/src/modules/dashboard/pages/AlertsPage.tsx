import React from 'react';
import { Box, Typography, Paper, Breadcrumbs, Link, Alert } from '@mui/material';
import { Home as HomeIcon, Warning as WarningIcon, NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { alerts as mockAlerts } from '@/config/alertsData';
import { Alert as AlertType } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Collapse,
  Button,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

const getSeverityChipColor = (severity: AlertType['severity']) => {
  switch (severity) {
    case 'critical':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
      return 'primary';
    default:
      return 'default';
  }
};

const AlertRow: React.FC<{ alert: AlertType }> = ({ alert }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {alert.title}
        </TableCell>
        <TableCell>
          <Chip label={alert.severity} color={getSeverityChipColor(alert.severity)} size="small" />
        </TableCell>
        <TableCell>{new Date(alert.timestamp).toLocaleString('fa-IR')}</TableCell>
        <TableCell>{alert.source}</TableCell>
        <TableCell>{alert.acknowledged ? 'بله' : 'خیر'}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                جزئیات هشدار
              </Typography>
              <Typography variant="body2">{alert.description}</Typography>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};


const AlertsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [severityFilter, setSeverityFilter] = React.useState<AlertType['severity'] | 'all'>('all');

  const filteredAlerts = mockAlerts.filter((alert) => {
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          alert.source.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = severityFilter === 'all' || alert.severity === severityFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <Box sx={{ p: 4 }}>
      {/* Breadcrumbs for navigation */}
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 4 }}>
        <Link component={RouterLink} to="/dashboard" sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          داشبورد
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <WarningIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          مرکز هشدارهای امنیتی
        </Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          مرکز هشدارهای امنیتی
        </Typography>
        <Typography variant="body1" color="text.secondary">
          در این بخش تمامی رخدادها و هشدارهای امنیتی سیستم ثبت و مدیریت می‌شوند.
        </Typography>
      </Box>

      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, gap: 2 }}>
          <TextField
            label="جستجو در هشدارها"
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl variant="outlined" sx={{ minWidth: 200 }}>
            <InputLabel>سطح اهمیت</InputLabel>
            <Select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as AlertType['severity'] | 'all')}
              label="سطح اهمیت"
            >
              <MenuItem value="all">همه</MenuItem>
              <MenuItem value="critical">بحرانی</MenuItem>
              <MenuItem value="high">بالا</MenuItem>
              <MenuItem value="medium">متوسط</MenuItem>
              <MenuItem value="low">پایین</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <TableContainer>
          <Table aria-label="collapsible table">
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>عنوان هشدار</TableCell>
                <TableCell>سطح اهمیت</TableCell>
                <TableCell>زمان</TableCell>
                <TableCell>منبع</TableCell>
                <TableCell>تایید شده</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAlerts.map((alert) => (
                <AlertRow key={alert.id} alert={alert} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default AlertsPage; 