import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Grid,
  Typography,
  Box,
  Tabs,
  Tab,
  SelectChangeEvent,
  useTheme,
  alpha,
  IconButton,
  FormHelperText,
  Alert,
  Avatar,
} from '@mui/material';
import {
  Save,
  Close,
  Security,
  VpnKey,
  Person,
  AdminPanelSettings,
  Engineering,
  Visibility,
  AutoFixHigh,
  VisibilityOff,
  Home,
  LocationOn,
  AddCircleOutline,
  Edit,
  Delete,
  Check,
  CalendarToday,
  AccountCircle,
} from '@mui/icons-material';

import { 
  UserDialogProps, 
  UserProfile, 
  UserRole, 
  TCountry, 
  TState, 
  TCity,
  Address,
  CountryCode,
  BirthPlace,
  BirthDate, 
} from '../types';
import { convertToEnglishNumbers, convertToFarsiNumbers } from '../utils/formatters';
import { validateIranianNationalId, validatePasswordStrength, validateUserForm, generateUsernameFromEnglishName, generateStrongPassword } from '../utils/validators';
import { COUNTRY_CODES, MILITARY_AVATARS, getCountries, getStates, getCities } from '../utils/geo-data';
import { getAccessLevelsByRole } from '../utils/access-controls';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-tabpanel-${index}`}
      aria-labelledby={`user-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `user-tab-${index}`,
    'aria-controls': `user-tabpanel-${index}`,
  };
}

export const UserDialog: React.FC<UserDialogProps> = ({
  open,
  user,
  onClose,
  onSave,
  mode = 'full',
}) => {
  const theme = useTheme();

  // تابع helper برای تعیین رنگ پس‌زمینه فیلدها
  const getFieldBackgroundColor = () => {
    return theme.palette.mode === 'dark' ? theme.palette.grey[800] : 'white';
  };

  // وضعیت Tab ها
  const [tabValue, setTabValue] = useState(0);

  const [formData, setFormData] = useState<Partial<UserProfile>>({
    username: '',
    name: '',
    nameEn: '',
    email: '',
    role: 'viewer' as UserRole,
    department: '',
    position: '',
    phoneNumber: '',
    nationality: 'iranian',
    nationalId: '',
    securityClearance: 'none',
    isActive: true,
    permissions: [],
    avatar: 'none',
  });
  
  // وضعیت شماره تماس
  const [selectedCountryCode, setSelectedCountryCode] = useState<CountryCode>(
    COUNTRY_CODES.find(c => c.code === 'IR') || COUNTRY_CODES[0]
  );
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // آدرس‌دهی
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [currentAddress, setCurrentAddress] = useState<Partial<Address>>({
    title: '',
    country: '',
    state: '',
    city: '',
    postalCode: '',
    detailAddress: '',
  });
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  
  // کشور / استان / شهر انتخاب‌شده
  const [selectedCountry, setSelectedCountry] = useState<TCountry | null>(null);
  const [selectedState, setSelectedState] = useState<TState | null>(null);
  
  // آرایه‌های داده بارگیری‌شده
  const [countries, setCountries] = useState<TCountry[]>([]);
  const [states, setStates] = useState<TState[]>([]);
  const [cities, setCities] = useState<TCity[]>([]);
  const [stateError, setStateError] = useState(false);
  const [cityError, setCityError] = useState(false);

  // محل تولد
  const [birthPlaceCountry, setBirthPlaceCountry] = useState<TCountry | null>(null);
  const [birthPlaceState, setBirthPlaceState] = useState<TState | null>(null);
  const [birthPlaceCity, setBirthPlaceCity] = useState<TCity | null>(null);
  const [birthPlaceStates, setBirthPlaceStates] = useState<TState[]>([]);
  const [birthPlaceCities, setBirthPlaceCities] = useState<TCity[]>([]);
  const [birthPlaceStateError, setBirthPlaceStateError] = useState(false);
  const [birthPlaceCityError, setBirthPlaceCityError] = useState(false);

  // تاریخ تولد
  const [birthDateCalendarType, setBirthDateCalendarType] = useState<'shamsi' | 'miladi' | 'qamari'>('shamsi');
  const [birthDateYear, setBirthDateYear] = useState<number | null>(null);
  const [birthDateMonth, setBirthDateMonth] = useState<number | null>(null);
  const [birthDateDay, setBirthDateDay] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        ...user,
        avatar: user.avatar || 'none'
      });
      setAddresses(user.addresses || []);
      
      // تجزیه شماره تماس
      if (user.phoneNumber) {
        const phoneMatch = user.phoneNumber.match(/^(\+\d+)(.*)$/);
        if (phoneMatch) {
          const dialCode = phoneMatch[1];
          const number = phoneMatch[2];
          const country = COUNTRY_CODES.find(c => c.dialCode === dialCode);
          if (country) {
            setSelectedCountryCode(country);
            setPhoneNumber(number);
          } else {
            setPhoneNumber(user.phoneNumber);
          }
        } else {
          setPhoneNumber(user.phoneNumber);
        }
      } else {
        setPhoneNumber('');
      }
      
      // تنظیم تاریخ تولد
      if (user.birthDate) {
        setBirthDateCalendarType(user.birthDate.calendarType);
        setBirthDateYear(user.birthDate.year);
        setBirthDateMonth(user.birthDate.month);
        setBirthDateDay(user.birthDate.day);
      }

      setPassword('');
      setConfirmPassword('');
    } else {
      setFormData({
        username: '',
        name: '',
        nameEn: '',
        email: '',
        role: 'viewer' as UserRole,
        department: '',
        position: '',
        phoneNumber: '',
        nationality: 'iranian',
        nationalId: '',
        securityClearance: 'none',
        isActive: true,
        permissions: [],
        avatar: 'none',
      });
      setAddresses([{
        id: Date.now().toString(),
        title: 'آدرس ۱',
        country: 'IR',
        state: '',
        city: '',
        postalCode: '',
        detailAddress: '',
        isDefault: true
      }]);
      setSelectedCountryCode(COUNTRY_CODES.find(c => c.code === 'IR') || COUNTRY_CODES[0]);
      setPhoneNumber('');
      setPassword('');
      setConfirmPassword('');
      setBirthDateCalendarType('shamsi');
      setBirthDateYear(null);
      setBirthDateMonth(null);
      setBirthDateDay(null);
    }
    setShowPassword(false);
    setShowConfirmPassword(false);
    setTabValue(0);
  }, [user, open]);

  // بارگیری اولیه کشورها (یک بار)
  useEffect(() => {
    getCountries().then(setCountries);
  }, []);

  // Effect برای پاک کردن permissions هنگام انتخاب "بدون دسترسی"
  useEffect(() => {
    if (formData.securityClearance === 'none') {
      setFormData((prev: Partial<UserProfile>) => ({
        ...prev,
        permissions: []
      }));
    } else if (formData.role && formData.securityClearance && ['basic', 'secret', 'top_secret'].includes(formData.securityClearance)) {
      // اگر از "بدون دسترسی" به حالت عادی برگشت، permissions را بازیابی کن
      const rolePermissions = getAccessLevelsByRole(formData.role).map(access => access.key);
      setFormData((prev: Partial<UserProfile>) => ({
        ...prev,
        permissions: rolePermissions
      }));
    }
  }, [formData.securityClearance, formData.role]);

  // تغییر Tab
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSave = () => {
    // اگر فرم معتبر نیست، ذخیره نکن
    if (!isFormValid) {
      return;
    }
    
    // تشکیل محل تولد
    const birthPlace: BirthPlace | undefined = birthPlaceCountry ? {
      country: birthPlaceCountry.name,
      state: birthPlaceState?.name,
      city: birthPlaceCity?.name,
    } : undefined;

    // تشکیل تاریخ تولد
    const birthDate: BirthDate | undefined = (birthDateYear && birthDateMonth && birthDateDay) ? {
      calendarType: birthDateCalendarType,
      year: birthDateYear,
      month: birthDateMonth,
      day: birthDateDay,
    } : undefined;

    // اضافه کردن رمز عبور، آدرس‌ها و شماره تماس به داده‌ها
    const userData = { 
      ...formData, 
      birthDate,
      birthPlace,
      addresses,
      avatar: formData.avatar || 'none',
      phoneNumber: phoneNumber ? `${selectedCountryCode.dialCode}${phoneNumber}` : ''
    };
    if (password && validatePasswordStrength(password)) {
      (userData as any).password = password;
    }
    
    onSave(userData);
    onClose();
  };

  // بررسی معتبر بودن فرم
  const isFormValid = validateUserForm(
    formData,
    password,
    confirmPassword,
    phoneNumber,
    birthDateYear,
    birthDateMonth,
    birthDateDay,
    birthPlaceCountry,
    !user,
    mode
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          border: '3px solid',
          borderColor: theme.palette.primary.main,
        }
      }}
    >
      <DialogTitle sx={{ 
        fontSize: '1.5rem', 
        fontWeight: 'bold', 
        borderBottom: '2px solid',
        borderColor: theme.palette.primary.main,
        pb: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>
          {mode === 'permissions' ? 'مجوزها و سطوح دسترسی' : 
          mode === 'password' ? 'تنظیم مجدد رمز عبور' : 
          mode === 'edit' ? 'ویرایش اطلاعات کاربر' : 
          user ? 'ویرایش کاربر' : 'ایجاد کاربر جدید'}
        </span>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50', py: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              label="اطلاعات اصلی" 
              icon={<Person />} 
              iconPosition="start" 
              {...a11yProps(0)} 
              sx={{ fontWeight: 'bold' }}
            />
            <Tab 
              label="تاریخ و محل تولد" 
              icon={<CalendarToday />} 
              iconPosition="start" 
              {...a11yProps(1)} 
              sx={{ fontWeight: 'bold' }}
            />
            <Tab 
              label="آدرس‌ها" 
              icon={<LocationOn />} 
              iconPosition="start" 
              {...a11yProps(2)} 
              sx={{ fontWeight: 'bold' }}
            />
            <Tab 
              label="سطح دسترسی" 
              icon={<Security />} 
              iconPosition="start" 
              {...a11yProps(3)} 
              sx={{ fontWeight: 'bold' }}
            />
            <Tab 
              label="حساب کاربری" 
              icon={<AccountCircle />} 
              iconPosition="start" 
              {...a11yProps(4)} 
              sx={{ fontWeight: 'bold' }}
            />
          </Tabs>
        </Box>

        {/* Tab اطلاعات اصلی */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* ردیف اول: نام و نام خانوادگی */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="نام و نام خانوادگی"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: getFieldBackgroundColor()
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="نام و نام خانوادگی (انگلیسی)"
                value={formData.nameEn || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                  setFormData({ ...formData, nameEn: value });
                }}
                inputProps={{
                  dir: 'ltr',
                  style: { textAlign: 'left' }
                }}
                placeholder="First Name Last Name"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: getFieldBackgroundColor()
                  }
                }}
              />
            </Grid>
            
            {/* ردیف دوم: نام کاربری + ایمیل */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="نام کاربری"
                value={formData.username || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^a-zA-Z0-9._-]/g, '');
                  setFormData({ ...formData, username: value });
                }}
                required
                inputProps={{
                  dir: 'ltr',
                  style: { textAlign: 'left' }
                }}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => {
                        if (formData.nameEn) {
                          const generatedUsername = generateUsernameFromEnglishName(formData.nameEn);
                          setFormData({ ...formData, username: generatedUsername });
                        }
                      }}
                      edge="end"
                      size="small"
                      title="تولید نام کاربری از نام انگلیسی"
                      disabled={!formData.nameEn}
                    >
                      <AutoFixHigh />
                    </IconButton>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: getFieldBackgroundColor()
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ایمیل"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                inputProps={{
                  dir: 'ltr',
                  style: { textAlign: 'left' }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: getFieldBackgroundColor()
                  }
                }}
              />
            </Grid>
            
            {/* ردیف سوم: شماره تماس */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl sx={{ 
                  minWidth: 140, 
                  flex: '0 0 35%',
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: getFieldBackgroundColor()
                  }
                }}>
                  <InputLabel>کشور</InputLabel>
                  <Select
                    value={selectedCountryCode.code}
                    label="کشور"
                    onChange={(e) => {
                      const country = COUNTRY_CODES.find(c => c.code === e.target.value);
                      if (country) setSelectedCountryCode(country);
                    }}
                    sx={{
                      backgroundColor: getFieldBackgroundColor(),
                    }}
                    renderValue={(value) => {
                      const country = COUNTRY_CODES.find(c => c.code === value);
                      return country ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{country.flag}</span>
                          <span>{country.dialCode}</span>
                        </Box>
                      ) : '';
                    }}
                  >
                    {COUNTRY_CODES.map((country) => (
                      <MenuItem key={country.code} value={country.code}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{country.flag}</span>
                          <span>{country.dialCode}</span>
                          <span>{country.nameFa}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <TextField
                  sx={{ 
                    flex: '1',
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: getFieldBackgroundColor()
                    }
                  }}
                  label="شماره تماس"
                  value={convertToFarsiNumbers(phoneNumber)}
                  onChange={(e) => {
                    const convertedValue = convertToEnglishNumbers(e.target.value);
                    const value = convertedValue.replace(/[^\d]/g, '');
                    setPhoneNumber(value);
                  }}
                  required
                  inputProps={{
                    dir: 'ltr',
                    style: { textAlign: 'left' },
                    maxLength: 15
                  }}
                  placeholder="۹۱۲۳۴۵۶۷۸۹"
                  helperText={`شماره کامل: ${convertToFarsiNumbers(selectedCountryCode.dialCode)}${convertToFarsiNumbers(phoneNumber)}`}
                />
              </Box>
            </Grid>
            
            {/* ردیف چهارم: تابعیت و شماره ملی */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl sx={{ 
                  minWidth: 120, 
                  flex: '0 0 25%',
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: getFieldBackgroundColor()
                  }
                }}>
                  <InputLabel>تابعیت</InputLabel>
                  <Select
                    value={formData.nationality || 'iranian'}
                    label="تابعیت"
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      nationality: e.target.value as 'iranian' | 'non-iranian',
                      nationalId: ''
                    })}
                    sx={{
                      backgroundColor: getFieldBackgroundColor(),
                    }}
                  >
                    <MenuItem value="iranian">ایرانی</MenuItem>
                    <MenuItem value="non-iranian">غیر ایرانی</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField
                  sx={{ 
                    flex: '1',
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: getFieldBackgroundColor()
                    }
                  }}
                  label={formData.nationality === 'iranian' ? 'شماره ملی' : 'شماره پاسپورت/کد اتباع'}
                  value={convertToFarsiNumbers(formData.nationalId || '')}
                  onChange={(e) => {
                    if (formData.nationality === 'iranian') {
                      const convertedValue = convertToEnglishNumbers(e.target.value);
                      const value = convertedValue.replace(/[^\d]/g, '');
                      setFormData({ ...formData, nationalId: value });
                    } else {
                      setFormData({ ...formData, nationalId: e.target.value });
                    }
                  }}
                  required
                  inputProps={{
                    dir: 'ltr',
                    style: { textAlign: 'left' },
                    maxLength: formData.nationality === 'iranian' ? 10 : undefined
                  }}
                  error={Boolean(
                    formData.nationality === 'iranian' && 
                    formData.nationalId && 
                    !validateIranianNationalId(formData.nationalId)
                  )}
                  helperText={
                    formData.nationality === 'iranian' && 
                    formData.nationalId && 
                    !validateIranianNationalId(formData.nationalId) 
                      ? 'شماره ملی وارد شده معتبر نیست' 
                      : ''
                  }
                />
              </Box>
            </Grid>

            {/* ردیف پنجم: بخش و سمت */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="بخش"
                value={formData.department || ''}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: getFieldBackgroundColor()
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="سمت"
                value={formData.position || ''}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: getFieldBackgroundColor()
                  }
                }}
              />
            </Grid>

            {/* ردیف ششم: وضعیت فعال/غیرفعال */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={formData.isActive} 
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {formData.isActive ? 'کاربر فعال است' : 'کاربر غیرفعال است'}
                  </Typography>
                }
              />
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Tab تاریخ و محل تولد */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                تاریخ تولد
              </Typography>
              <Box sx={{ p: 2, backgroundColor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: getFieldBackgroundColor()
                      }
                    }}>
                      <InputLabel>نوع تقویم</InputLabel>
                      <Select
                        value={birthDateCalendarType}
                        label="نوع تقویم"
                        onChange={(e) => setBirthDateCalendarType(e.target.value as 'shamsi' | 'miladi' | 'qamari')}
                      >
                        <MenuItem value="shamsi">هجری شمسی</MenuItem>
                        <MenuItem value="miladi">میلادی</MenuItem>
                        <MenuItem value="qamari">هجری قمری</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        label="روز"
                        type="number"
                        value={birthDateDay !== null ? convertToFarsiNumbers(birthDateDay.toString()) : ''}
                        onChange={(e) => {
                          const value = convertToEnglishNumbers(e.target.value);
                          if (!value) {
                            setBirthDateDay(null);
                            return;
                          }
                          const day = parseInt(value, 10);
                          if (!isNaN(day) && day >= 1 && day <= 31) {
                            setBirthDateDay(day);
                          }
                        }}
                        InputProps={{ inputProps: { min: 1, max: 31 } }}
                        sx={{
                          flex: '1',
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: getFieldBackgroundColor()
                          }
                        }}
                      />
                      <TextField
                        label="ماه"
                        type="number"
                        value={birthDateMonth !== null ? convertToFarsiNumbers(birthDateMonth.toString()) : ''}
                        onChange={(e) => {
                          const value = convertToEnglishNumbers(e.target.value);
                          if (!value) {
                            setBirthDateMonth(null);
                            return;
                          }
                          const month = parseInt(value, 10);
                          if (!isNaN(month) && month >= 1 && month <= 12) {
                            setBirthDateMonth(month);
                          }
                        }}
                        InputProps={{ inputProps: { min: 1, max: 12 } }}
                        sx={{
                          flex: '1',
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: getFieldBackgroundColor()
                          }
                        }}
                      />
                      <TextField
                        label="سال"
                        type="number"
                        value={birthDateYear !== null ? convertToFarsiNumbers(birthDateYear.toString()) : ''}
                        onChange={(e) => {
                          const value = convertToEnglishNumbers(e.target.value);
                          if (!value) {
                            setBirthDateYear(null);
                            return;
                          }
                          const year = parseInt(value, 10);
                          if (!isNaN(year) && year > 0) {
                            setBirthDateYear(year);
                          }
                        }}
                        sx={{
                          flex: '1.5',
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: getFieldBackgroundColor()
                          }
                        }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                محل تولد
              </Typography>
              <Box sx={{ p: 2, backgroundColor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: getFieldBackgroundColor()
                      }
                    }}>
                      <InputLabel>کشور</InputLabel>
                      <Select
                        value={birthPlaceCountry ? birthPlaceCountry.code : ''}
                        label="کشور"
                        onChange={async (e) => {
                          const countryCode = e.target.value;
                          const country = countries.find(c => c.code === countryCode);
                          
                          if (country) {
                            setBirthPlaceCountry(country);
                            setBirthPlaceState(null);
                            setBirthPlaceCity(null);
                            
                            try {
                              const states = await getStates(countryCode);
                              setBirthPlaceStates(states);
                              setBirthPlaceStateError(false);
                            } catch (error) {
                              setBirthPlaceStates([]);
                              setBirthPlaceStateError(true);
                            }
                          }
                        }}
                      >
                        {countries.map((country) => (
                          <MenuItem key={country.code} value={country.code}>
                            {country.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: getFieldBackgroundColor()
                      }
                    }}>
                      <InputLabel>استان</InputLabel>
                      <Select
                        value={birthPlaceState ? birthPlaceState.code : ''}
                        label="استان"
                        onChange={async (e) => {
                          if (!birthPlaceCountry) return;
                          
                          const stateCode = e.target.value;
                          const state = birthPlaceStates.find(s => s.code === stateCode);
                          
                          if (state) {
                            setBirthPlaceState(state);
                            setBirthPlaceCity(null);
                            
                            try {
                              const cities = await getCities(birthPlaceCountry.code, stateCode);
                              setBirthPlaceCities(cities);
                              setBirthPlaceCityError(false);
                            } catch (error) {
                              setBirthPlaceCities([]);
                              setBirthPlaceCityError(true);
                            }
                          }
                        }}
                        disabled={!birthPlaceCountry || birthPlaceStates.length === 0}
                        error={birthPlaceStateError}
                      >
                        {birthPlaceStates.map((state) => (
                          <MenuItem key={state.code} value={state.code}>
                            {state.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {birthPlaceStateError && (
                        <FormHelperText error>خطا در بارگیری استان‌ها</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: getFieldBackgroundColor()
                      }
                    }}>
                      <InputLabel>شهر</InputLabel>
                      <Select
                        value={birthPlaceCity ? birthPlaceCity.code : ''}
                        label="شهر"
                        onChange={(e) => {
                          const cityCode = e.target.value;
                          const city = birthPlaceCities.find(c => c.code === cityCode);
                          if (city) {
                            setBirthPlaceCity(city);
                          }
                        }}
                        disabled={!birthPlaceState || birthPlaceCities.length === 0}
                        error={birthPlaceCityError}
                      >
                        {birthPlaceCities.map((city) => (
                          <MenuItem key={city.code} value={city.code}>
                            {city.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {birthPlaceCityError && (
                        <FormHelperText error>خطا در بارگیری شهرها</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab آدرس‌ها */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>آدرس‌ها</span>
                <Button
                  startIcon={<AddCircleOutline />}
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setCurrentAddress({
                      title: `آدرس ${addresses.length + 1}`,
                      country: '',
                      state: '',
                      city: '',
                      postalCode: '',
                      detailAddress: '',
                      isDefault: addresses.length === 0,
                    });
                    setEditingAddressId(null);
                    setSelectedCountry(null);
                    setSelectedState(null);
                    setStates([]);
                    setCities([]);
                  }}
                >
                  افزودن آدرس جدید
                </Button>
              </Typography>

              {/* لیست آدرس‌های موجود */}
              {addresses.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  {addresses.map((address, index) => (
                    <Box 
                      key={address.id} 
                      sx={{ 
                        p: 2, 
                        mb: 2, 
                        border: '1px solid',
                        borderColor: theme.palette.divider,
                        borderRadius: 2,
                        backgroundColor: address.isDefault 
                          ? alpha(theme.palette.success.light, 0.1) 
                          : 'background.paper',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        position: 'relative'
                      }}
                    >
                      {address.isDefault && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'success.main',
                            color: 'white',
                            fontSize: '0.7rem',
                            py: 0.2,
                            px: 1,
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <Check fontSize="inherit" sx={{ mr: 0.5 }} />
                          پیش‌فرض
                        </Box>
                      )}

                      <Typography variant="subtitle2" gutterBottom>
                        {address.title}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ mb: 1 }} color="text.secondary">
                        {address.city && address.state
                          ? `${address.city}، ${address.state}، ${address.country}`
                          : address.country}
                        {address.postalCode && ` (کدپستی: ${convertToFarsiNumbers(address.postalCode)})`}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {address.detailAddress}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                          startIcon={<Edit />} 
                          size="small" 
                          onClick={() => {
                            setCurrentAddress(address);
                            setEditingAddressId(address.id);
                            
                            // تنظیم کشور، استان و شهر انتخاب شده
                            const country = countries.find(c => c.code === address.country);
                            if (country) {
                              setSelectedCountry(country);
                              getStates(country.code).then(states => {
                                setStates(states);
                                
                                if (address.state) {
                                  const state = states.find(s => s.code === address.state);
                                  if (state) {
                                    setSelectedState(state);
                                    getCities(country.code, state.code).then(setCities);
                                  }
                                }
                              });
                            }
                          }}
                        >
                          ویرایش
                        </Button>
                        
                        <Button 
                          startIcon={<Delete />} 
                          color="error" 
                          size="small"
                          onClick={() => {
                            const newAddresses = addresses.filter(a => a.id !== address.id);
                            
                            // اگر آدرس پیش‌فرض حذف شد، اولین آدرس باقی‌مانده را پیش‌فرض کنیم
                            if (address.isDefault && newAddresses.length > 0) {
                              newAddresses[0] = { ...newAddresses[0], isDefault: true };
                            }
                            
                            setAddresses(newAddresses);
                          }}
                        >
                          حذف
                        </Button>
                        
                        {!address.isDefault && (
                          <Button 
                            size="small"
                            color="success"
                            onClick={() => {
                              const updatedAddresses = addresses.map(a => ({
                                ...a,
                                isDefault: a.id === address.id
                              }));
                              setAddresses(updatedAddresses);
                            }}
                          >
                            تنظیم به عنوان پیش‌فرض
                          </Button>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}

              {/* فرم اضافه کردن/ویرایش آدرس */}
              {(editingAddressId !== null || currentAddress.title) && (
                <Box sx={{ 
                  p: 3, 
                  border: '1px dashed',
                  borderColor: 'primary.main',
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.primary.main, 0.05)
                }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {editingAddressId ? 'ویرایش آدرس' : 'آدرس جدید'}
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="عنوان آدرس"
                        value={currentAddress.title}
                        onChange={(e) => setCurrentAddress({ ...currentAddress, title: e.target.value })}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: getFieldBackgroundColor()
                          }
                        }}
                        required
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: getFieldBackgroundColor()
                        }
                      }}>
                        <InputLabel>کشور</InputLabel>
                        <Select
                          value={selectedCountry ? selectedCountry.code : ''}
                          label="کشور"
                          onChange={async (e) => {
                            const countryCode = e.target.value;
                            const country = countries.find(c => c.code === countryCode);
                            
                            if (country) {
                              setSelectedCountry(country);
                              setSelectedState(null);
                              setCities([]);
                              
                              setCurrentAddress({
                                ...currentAddress,
                                country: country.code,
                                state: '',
                                city: ''
                              });
                              
                              try {
                                const states = await getStates(countryCode);
                                setStates(states);
                                setStateError(false);
                              } catch (error) {
                                setStates([]);
                                setStateError(true);
                              }
                            }
                          }}
                          required
                        >
                          {countries.map((country) => (
                            <MenuItem key={country.code} value={country.code}>
                              {country.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: getFieldBackgroundColor()
                        }
                      }}>
                        <InputLabel>استان</InputLabel>
                        <Select
                          value={selectedState ? selectedState.code : ''}
                          label="استان"
                          onChange={async (e) => {
                            if (!selectedCountry) return;
                            
                            const stateCode = e.target.value;
                            const state = states.find(s => s.code === stateCode);
                            
                            if (state) {
                              setSelectedState(state);
                              setCities([]);
                              
                              setCurrentAddress({
                                ...currentAddress,
                                state: state.code,
                                city: ''
                              });
                              
                              try {
                                const cities = await getCities(selectedCountry.code, stateCode);
                                setCities(cities);
                                setCityError(false);
                              } catch (error) {
                                setCities([]);
                                setCityError(true);
                              }
                            }
                          }}
                          disabled={!selectedCountry || states.length === 0}
                          error={stateError}
                        >
                          {states.map((state) => (
                            <MenuItem key={state.code} value={state.code}>
                              {state.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {stateError && (
                          <FormHelperText error>خطا در بارگیری استان‌ها</FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: getFieldBackgroundColor()
                        }
                      }}>
                        <InputLabel>شهر</InputLabel>
                        <Select
                          value={currentAddress.city || ''}
                          label="شهر"
                          onChange={(e) => {
                            setCurrentAddress({
                              ...currentAddress,
                              city: e.target.value
                            });
                          }}
                          disabled={!selectedState || cities.length === 0}
                          error={cityError}
                        >
                          {cities.map((city) => (
                            <MenuItem key={city.code} value={city.code}>
                              {city.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {cityError && (
                          <FormHelperText error>خطا در بارگیری شهرها</FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="کد پستی"
                        value={convertToFarsiNumbers(currentAddress.postalCode || '')}
                        onChange={(e) => {
                          const value = convertToEnglishNumbers(e.target.value);
                          setCurrentAddress({
                            ...currentAddress,
                            postalCode: value.replace(/[^\d]/g, '')
                          });
                        }}
                        inputProps={{
                          dir: 'ltr',
                          style: { textAlign: 'left' },
                          maxLength: 10
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: getFieldBackgroundColor()
                          }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={8}>
                      <TextField
                        fullWidth
                        label="آدرس کامل"
                        value={currentAddress.detailAddress || ''}
                        onChange={(e) => setCurrentAddress({
                          ...currentAddress,
                          detailAddress: e.target.value
                        })}
                        required
                        multiline
                        rows={2}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: getFieldBackgroundColor()
                          }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={currentAddress.isDefault || false}
                            onChange={(e) => setCurrentAddress({
                              ...currentAddress,
                              isDefault: e.target.checked
                            })}
                          />
                        }
                        label="آدرس پیش‌فرض"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          startIcon={<Save />}
                          onClick={() => {
                            // اعتبارسنجی فیلدهای ضروری
                            if (!currentAddress.title || 
                                !selectedCountry ||
                                !currentAddress.detailAddress) {
                              return;
                            }
                            
                            if (editingAddressId) {
                              // ویرایش آدرس موجود
                              const updatedAddresses = addresses.map(address => {
                                if (address.id === editingAddressId) {
                                  const isDefaultChanged = address.isDefault !== currentAddress.isDefault;
                                  return { 
                                    ...currentAddress, 
                                    id: address.id 
                                  };
                                }
                                
                                // اگر آدرس فعلی به عنوان پیش‌فرض انتخاب شده، بقیه را غیرپیش‌فرض کنیم
                                if (currentAddress.isDefault) {
                                  return { ...address, isDefault: false };
                                }
                                
                                return address;
                              });
                              
                              setAddresses(updatedAddresses);
                            } else {
                              // ایجاد آدرس جدید
                              const newAddress = {
                                ...currentAddress,
                                id: Date.now().toString()
                              };
                              
                              // اگر این آدرس جدید، پیش‌فرض است، بقیه را غیرپیش‌فرض کنیم
                              let updatedAddresses;
                              if (newAddress.isDefault) {
                                updatedAddresses = addresses.map(a => ({
                                  ...a,
                                  isDefault: false
                                }));
                              } else {
                                updatedAddresses = [...addresses];
                              }
                              
                              updatedAddresses.push(newAddress);
                              setAddresses(updatedAddresses);
                            }
                            
                            // پاک کردن فرم
                            setCurrentAddress({
                              title: '',
                              country: '',
                              state: '',
                              city: '',
                              postalCode: '',
                              detailAddress: '',
                              isDefault: false
                            });
                            setEditingAddressId(null);
                            setSelectedCountry(null);
                            setSelectedState(null);
                            setStates([]);
                            setCities([]);
                          }}
                        >
                          {editingAddressId ? 'به‌روزرسانی آدرس' : 'افزودن آدرس'}
                        </Button>
                        
                        <Button
                          variant="outlined"
                          color="secondary"
                          onClick={() => {
                            setCurrentAddress({
                              title: '',
                              country: '',
                              state: '',
                              city: '',
                              postalCode: '',
                              detailAddress: '',
                              isDefault: false
                            });
                            setEditingAddressId(null);
                            setSelectedCountry(null);
                            setSelectedState(null);
                            setStates([]);
                            setCities([]);
                          }}
                        >
                          انصراف
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}
              
              {addresses.length === 0 && !currentAddress.title && (
                <Alert severity="info">
                  هیچ آدرسی ثبت نشده است. برای ثبت آدرس جدید روی دکمه «افزودن آدرس جدید» کلیک کنید.
                </Alert>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab سطح دسترسی */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            {/* نقش کاربر */}
            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: getFieldBackgroundColor()
                  }
                }}
              >
                <InputLabel id="role-label">نقش کاربر</InputLabel>
                <Select
                  labelId="role-label"
                  value={formData.role || 'viewer'}
                  label="نقش کاربر"
                  onChange={(e: SelectChangeEvent) => {
                    const selectedRole = e.target.value as 'admin' | 'commander' | 'operator' | 'viewer';
                    const rolePermissions = getAccessLevelsByRole(selectedRole).map(p => p.key);
                    setFormData({
                      ...formData,
                      role: selectedRole,
                      permissions: rolePermissions
                    });
                  }}
                >
                  <MenuItem value="admin">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AdminPanelSettings fontSize="small" color="error" />
                      <span>مدیر کل</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="commander">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Security fontSize="small" color="success" />
                      <span>فرمانده</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="operator">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Engineering fontSize="small" color="primary" />
                      <span>اپراتور</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="viewer">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Visibility fontSize="small" color="info" />
                      <span>بیننده</span>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* سطح امنیتی */}
            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: getFieldBackgroundColor()
                  }
                }}
              >
                <InputLabel id="clearance-label">سطح امنیتی</InputLabel>
                <Select
                  labelId="clearance-label"
                  value={formData.securityClearance || 'none'}
                  label="سطح امنیتی"
                  onChange={(e) => setFormData({
                    ...formData,
                    securityClearance: e.target.value as 'none' | 'basic' | 'secret' | 'top_secret'
                  })}
                >
                  <MenuItem value="none">بدون دسترسی</MenuItem>
                  <MenuItem value="basic">عادی</MenuItem>
                  <MenuItem value="secret">محرمانه</MenuItem>
                  <MenuItem value="top_secret">فوق محرمانه</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* دسترسی‌ها */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                دسترسی‌ها:
              </Typography>
              <Box sx={{ 
                p: 3, 
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                borderRadius: 2
              }}>
                <Grid container spacing={1}>
                  {getAccessLevelsByRole(formData.role as 'admin' | 'commander' | 'operator' | 'viewer').map((permission) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={permission.key}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.permissions?.includes(permission.key) || false}
                            onChange={(e) => {
                              let newPermissions = [...(formData.permissions || [])];
                              if (e.target.checked) {
                                if (!newPermissions.includes(permission.key)) {
                                  newPermissions.push(permission.key);
                                }
                              } else {
                                newPermissions = newPermissions.filter(p => p !== permission.key);
                              }
                              setFormData({
                                ...formData,
                                permissions: newPermissions
                              });
                            }}
                            disabled={formData.securityClearance === 'none'}
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {permission.icon}
                            <Typography variant="caption">{permission.label}</Typography>
                          </Box>
                        }
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab رمز عبور */}
        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                تصویر نمایه (آواتار)
              </Typography>
              <Box sx={{ p: 2, backgroundColor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2, mb: 4 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Box sx={{ 
                      width: 120, 
                      height: 120, 
                      borderRadius: '50%', 
                      overflow: 'hidden',
                      border: '3px solid',
                      borderColor: theme.palette.primary.main,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'background.paper',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}>
                      {formData.avatar && formData.avatar !== 'none' ? (
                        <Avatar
                          src={MILITARY_AVATARS.find(a => a.id === formData.avatar)?.path || ''}
                          alt={formData.name || ''}
                          sx={{ width: '100%', height: '100%' }}
                        />
                      ) : (
                        <Person sx={{ fontSize: 80, color: alpha(theme.palette.text.primary, 0.5) }} />
                      )}
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={8}>
                    <Typography variant="body2" gutterBottom>
                      آواتار پیش‌فرض را انتخاب کنید:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      <Box 
                        onClick={() => setFormData({ ...formData, avatar: 'none' })}
                        sx={{ 
                          width: 50, 
                          height: 50, 
                          borderRadius: '50%', 
                          border: `2px solid ${formData.avatar === 'none' ? theme.palette.primary.main : theme.palette.divider}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          bgcolor: alpha(theme.palette.text.primary, 0.05),
                        }}
                      >
                        <Person />
                      </Box>
                      
                      {MILITARY_AVATARS.map(avatar => (
                        <Box 
                          key={avatar.id}
                          onClick={() => setFormData({ ...formData, avatar: avatar.id })}
                          sx={{ 
                            width: 50, 
                            height: 50, 
                            borderRadius: '50%', 
                            border: `2px solid ${formData.avatar === avatar.id ? theme.palette.primary.main : theme.palette.divider}`,
                            overflow: 'hidden',
                            cursor: 'pointer',
                          }}
                        >
                          <img 
                            src={avatar.path || ''} 
                            alt={avatar.name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <Typography variant="subtitle1" sx={{ mb: 2, mt: 3, fontWeight: 'bold' }}>
                رمز عبور
              </Typography>
              <Box sx={{ p: 2, backgroundColor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type={showPassword ? "text" : "password"}
                      label="رمز عبور"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={!user}
                      InputProps={{
                        endAdornment: (
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        ),
                      }}
                      error={Boolean(password && !validatePasswordStrength(password))}
                      helperText={
                        password && !validatePasswordStrength(password)
                          ? "رمز عبور باید حداقل 8 کاراکتر و شامل حروف بزرگ، حروف کوچک و اعداد باشد"
                          : "رمز عبور باید حداقل 8 کاراکتر و شامل حروف بزرگ، حروف کوچک و اعداد باشد"
                      }
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: getFieldBackgroundColor()
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type={showConfirmPassword ? "text" : "password"}
                      label="تکرار رمز عبور"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required={!user}
                      InputProps={{
                        endAdornment: (
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        ),
                      }}
                      error={Boolean(password && confirmPassword && password !== confirmPassword)}
                      helperText={
                        password && confirmPassword && password !== confirmPassword
                          ? "رمز عبور و تکرار آن مطابقت ندارند"
                          : ""
                      }
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: getFieldBackgroundColor()
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button 
                      variant="outlined" 
                      color="primary"
                      onClick={() => {
                        const newPassword = generateStrongPassword();
                        setPassword(newPassword);
                        setConfirmPassword(newPassword);
                      }}
                      startIcon={<AutoFixHigh />}
                    >
                      تولید رمز عبور تصادفی
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          startIcon={<Close />}
        >
          انصراف
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
          disabled={!isFormValid}
          startIcon={<Save />}
        >
          ذخیره
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 