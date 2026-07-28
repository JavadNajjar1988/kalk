import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Button,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Grid,
} from '@mui/material';
import PersianCalendarField from '@/components/common/PersianCalendarField';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// داده تستی برای جستجو
const mockUsers = [
  {
    id: 1,
    name: 'علی رضایی',
    status: 'active',
    role: 'admin',
    createdAt: '2023-12-01',
  },
  {
    id: 2,
    name: 'مریم محمدی',
    status: 'inactive',
    role: 'operator',
    createdAt: '2024-01-10',
  },
];
const mockScenarios = [
  {
    id: 1,
    name: 'عملیات والفجر',
    status: 'inprogress',
    createdAt: '2024-02-01',
  },
  { id: 2, name: 'رزمایش فتح', status: 'completed', createdAt: '2023-11-20' },
];
const mockEquipments = [
  { id: 1, name: 'تانک T-72', status: 'active', createdAt: '2023-10-15' },
  { id: 2, name: 'نفربر BMP-2', status: 'inactive', createdAt: '2024-01-05' },
];

const statusOptions = [
  { value: 'all', label: 'همه' },
  { value: 'active', label: 'فعال' },
  { value: 'inactive', label: 'غیرفعال' },
  { value: 'inprogress', label: 'در حال انجام' },
  { value: 'completed', label: 'تکمیل شده' },
];

const typeOptions = [
  { value: 'all', label: 'همه داده‌ها' },
  { value: 'user', label: 'کاربران' },
  { value: 'scenario', label: 'سناریوها' },
  { value: 'equipment', label: 'تجهیزات' },
];

const SearchPage: React.FC = () => {
  const query = useQuery();
  const initialQ = query.get('q') || '';

  // state جستجو
  const [q, setQ] = useState(initialQ);
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [results, setResults] = useState<any>(null);

  // تابع جستجوی ساده روی داده تستی
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let users = mockUsers.filter(u => u.name.includes(q));
    let scenarios = mockScenarios.filter(s => s.name.includes(q));
    let equipments = mockEquipments.filter(eq => eq.name.includes(q));
    if (status !== 'all') {
      users = users.filter(u => u.status === status);
      scenarios = scenarios.filter(s => s.status === status);
      equipments = equipments.filter(eq => eq.status === status);
    }
    if (dateFrom) {
      users = users.filter(u => u.createdAt >= dateFrom);
      scenarios = scenarios.filter(s => s.createdAt >= dateFrom);
      equipments = equipments.filter(eq => eq.createdAt >= dateFrom);
    }
    if (dateTo) {
      users = users.filter(u => u.createdAt <= dateTo);
      scenarios = scenarios.filter(s => s.createdAt <= dateTo);
      equipments = equipments.filter(eq => eq.createdAt <= dateTo);
    }
    setResults({
      users: type === 'all' || type === 'user' ? users : [],
      scenarios: type === 'all' || type === 'scenario' ? scenarios : [],
      equipments: type === 'all' || type === 'equipment' ? equipments : [],
    });
  };

  React.useEffect(() => {
    handleSearch();
    // eslint-disable-next-line
  }, []);

  return (
    <Box sx={{ p: 4 }}>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
          جستجوی پیشرفته
        </Typography>
        <form onSubmit={handleSearch}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="عبارت جستجو"
                value={q}
                onChange={e => setQ(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>نوع داده</InputLabel>
                <Select
                  value={type}
                  label="نوع داده"
                  onChange={e => setType(e.target.value)}
                >
                  {typeOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>وضعیت</InputLabel>
                <Select
                  value={status}
                  label="وضعیت"
                  onChange={e => setStatus(e.target.value)}
                >
                  {statusOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <PersianCalendarField
                label="از تاریخ"
                value={dateFrom}
                onChange={setDateFrom}
                dateOnly
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <PersianCalendarField
                label="تا تاریخ"
                value={dateTo}
                onChange={setDateTo}
                dateOnly
              />
            </Grid>
            <Grid item xs={12} md={12}>
              <Button type="submit" variant="contained" color="primary">
                جستجو
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {results && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            نتایج جستجو
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List subheader={<ListSubheader>کاربران</ListSubheader>}>
            {results.users.length === 0 && (
              <ListItem>
                <ListItemText primary="نتیجه‌ای یافت نشد" />
              </ListItem>
            )}
            {results.users.map((u: any) => (
              <ListItem key={u.id}>
                <ListItemText
                  primary={u.name}
                  secondary={`وضعیت: ${u.status} | نقش: ${u.role}`}
                />
                <Chip label="کاربر" color="info" size="small" />
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 2 }} />
          <List subheader={<ListSubheader>سناریوها</ListSubheader>}>
            {results.scenarios.length === 0 && (
              <ListItem>
                <ListItemText primary="نتیجه‌ای یافت نشد" />
              </ListItem>
            )}
            {results.scenarios.map((s: any) => (
              <ListItem key={s.id}>
                <ListItemText
                  primary={s.name}
                  secondary={`وضعیت: ${s.status}`}
                />
                <Chip label="سناریو" color="primary" size="small" />
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 2 }} />
          <List subheader={<ListSubheader>تجهیزات</ListSubheader>}>
            {results.equipments.length === 0 && (
              <ListItem>
                <ListItemText primary="نتیجه‌ای یافت نشد" />
              </ListItem>
            )}
            {results.equipments.map((eq: any) => (
              <ListItem key={eq.id}>
                <ListItemText
                  primary={eq.name}
                  secondary={`وضعیت: ${eq.status}`}
                />
                <Chip label="تجهیزات" color="warning" size="small" />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default SearchPage;
