import React, { useState, useEffect } from 'react';
import { keyframes } from '@mui/system';
import { 
  Box, 
  Typography, 
  Avatar, 
  Button, 
  Divider,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Autocomplete,
  SelectChangeEvent,
  Alert,
} from '@mui/material';

// Animation برای چرخش
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;
import {
  ExitToApp,
  AccountCircle,
  Settings,
  Close,
  Person,
  Save,
  Edit,
  LocationOn,
  CalendarToday,
  Phone,
  Badge,
  AutoFixHigh,
  Add,
  Delete,
  CheckCircle,
  Cancel,
  VpnKey,
  Visibility,
  VisibilityOff,
  Refresh,
  Check,
  Clear,
  Assignment,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '@/store';
import { selectUser, logout, updateUser } from '@/store/slices/authSlice';
import { showSuccessNotification } from '@/store/slices/uiSlice';
import { useNavigate } from 'react-router-dom';
import moment from 'jalali-moment';
import { useScenarioDialog } from '@/components/common/ScenarioDialogContext';

interface ProfilePanelProps {
  onClose?: () => void;
}

// تایپ‌های مورد نیاز
interface Address {
  id: string;
  title: string;
  country: string;
  state?: string;
  city?: string;
  postalCode?: string;
  detailAddress: string;
  isDefault?: boolean;
}

interface BirthPlace {
  country: string;
  state?: string;
  city?: string;
}

interface BirthDate {
  calendarType: 'shamsi' | 'miladi' | 'qamari';
  year: number;
  month: number;
  day: number;
}

interface CountryCode {
  code: string;
  dialCode: string;
  nameEn: string;
  nameFa: string;
  flag: string;
}

interface TCountry {
  code: string;
  name: string;
}

interface TState {
  code: string;
  name: string;
}

interface TCity {
  code: string;
  name: string;
}

// تابع تبدیل اعداد انگلیسی به فارسی
const convertToFarsiNumbers = (str: string | number): string => {
  if (!str) return '';
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.toString().replace(/[0-9]/g, (match) => {
    return farsiDigits[parseInt(match)];
  });
};

// تابع تبدیل اعداد فارسی به انگلیسی
const convertToEnglishNumbers = (str: string): string => {
  if (!str) return '';
  const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  
  return str.replace(/[۰-۹]/g, (match) => {
    const index = farsiDigits.indexOf(match);
    return englishDigits[index];
  });
};

// لیست کشورها
const COUNTRY_CODES: CountryCode[] = [
  { code: 'IR', dialCode: '+98', nameEn: 'Iran', nameFa: 'ایران', flag: '🇮🇷' },
  { code: 'AF', dialCode: '+93', nameEn: 'Afghanistan', nameFa: 'افغانستان', flag: '🇦🇫' },
  { code: 'US', dialCode: '+1', nameEn: 'United States', nameFa: 'ایالات متحده آمریکا', flag: '🇺🇸' },
  { code: 'DE', dialCode: '+49', nameEn: 'Germany', nameFa: 'آلمان', flag: '🇩🇪' },
  { code: 'FR', dialCode: '+33', nameEn: 'France', nameFa: 'فرانسه', flag: '🇫🇷' },
  { code: 'GB', dialCode: '+44', nameEn: 'United Kingdom', nameFa: 'انگلستان', flag: '🇬🇧' },
  { code: 'TR', dialCode: '+90', nameEn: 'Turkey', nameFa: 'ترکیه', flag: '🇹🇷' },
  { code: 'IQ', dialCode: '+964', nameEn: 'Iraq', nameFa: 'عراق', flag: '🇮🇶' },
  { code: 'SA', dialCode: '+966', nameEn: 'Saudi Arabia', nameFa: 'عربستان سعودی', flag: '🇸🇦' },
  { code: 'AE', dialCode: '+971', nameEn: 'UAE', nameFa: 'امارات متحده عربی', flag: '🇦🇪' },
];

// Mock geography functions
const getCountries = async (): Promise<TCountry[]> => {
  return [
    { code: 'IR', name: 'ایران' },
    { code: 'US', name: 'ایالات متحده آمریکا' },
    { code: 'DE', name: 'آلمان' },
    { code: 'FR', name: 'فرانسه' },
    { code: 'GB', name: 'انگلستان' },
    { code: 'TR', name: 'ترکیه' },
    { code: 'IQ', name: 'عراق' },
    { code: 'SA', name: 'عربستان سعودی' },
  ];
};

const getStates = async (countryCode: string): Promise<TState[]> => {
  if (countryCode === 'IR') {
    return [
      { code: 'tehran', name: 'تهران' },
      { code: 'isfahan', name: 'اصفهان' },
      { code: 'shiraz', name: 'شیراز' },
      { code: 'tabriz', name: 'تبریز' },
    ];
  }
  return [];
};

const getCities = async (stateCode: string): Promise<TCity[]> => {
  if (stateCode === 'tehran') {
    return [
      { code: 'tehran', name: 'تهران' },
      { code: 'karaj', name: 'کرج' },
      { code: 'varamin', name: 'ورامین' },
    ];
  }
  return [];
};

// تولید نام کاربری از نام انگلیسی
const generateUsernameFromEnglishName = (nameEn: string): string => {
  if (!nameEn) return '';
  return nameEn.toLowerCase().replace(/\s+/g, '.');
};

// آواتارهای نظامی
const MILITARY_AVATARS = [
  { id: 'none', name: 'بدون آواتار', path: null },
  { id: 'officer1', name: 'افسر 1', path: '/avatars/officer1.png' },
  { id: 'officer2', name: 'افسر 2', path: '/avatars/officer2.png' },
  { id: 'soldier1', name: 'سرباز 1', path: '/avatars/soldier1.png' },
  { id: 'soldier2', name: 'سرباز 2', path: '/avatars/soldier2.png' },
];

// کامپوننت دیالوگ تغییر رمز عبور
interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (passwordData: any) => void;
}

const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({ open, onClose, onSave }) => {
  const theme = useTheme();
  
  // تابع helper برای تعیین رنگ پس‌زمینه فیلدها
  const getFieldBackgroundColor = () => {
    return theme.palette.mode === 'dark' ? theme.palette.grey[800] : 'white';
  };

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    verificationCode: ''
  });

  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    verificationCode: ''
  });

  // وضعیت نمایش رمز عبور
  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });

  // دو عدد رندوم برای کد صحت سنجی
  const [mathQuestion, setMathQuestion] = useState({
    number1: 0,
    number2: 0,
    operation: '+' as '+' | '-',
    correctAnswer: 0
  });

  // وضعیت تأیید پاسخ
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'checking' | 'correct' | 'incorrect' | 'locked'>('pending');
  // شمارنده تلاش اشتباه
  const [wrongAttempts, setWrongAttempts] = useState(0);
  // زمان باقی‌مانده قفل
  const [lockTime, setLockTime] = useState(0);
  // تایمر قفل
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (verificationStatus === 'locked' && lockTime > 0) {
      timer = setInterval(() => {
        setLockTime((prev) => {
          if (prev <= 1) {
            setVerificationStatus('pending');
            setWrongAttempts(0);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [verificationStatus, lockTime]);

  // تولید سوال ریاضی جدید
  const generateMathQuestion = () => {
    const num1 = Math.floor(Math.random() * 20) + 1; // عدد بین 1 تا 20
    const num2 = Math.floor(Math.random() * 20) + 1; // عدد بین 1 تا 20
    const operation = Math.random() < 0.5 ? '+' : '-'; // انتخاب تصادفی عملیات
    
    let answer;
    let firstNumber, secondNumber;
    
    if (operation === '+') {
      firstNumber = num1;
      secondNumber = num2;
      answer = num1 + num2;
    } else {
      // برای تفریق، عدد بزرگتر را اول قرار می‌دهیم تا حاصل منفی نشود
      firstNumber = Math.max(num1, num2);
      secondNumber = Math.min(num1, num2);
      answer = firstNumber - secondNumber;
    }
    
    setMathQuestion({
      number1: firstNumber,
      number2: secondNumber,
      operation: operation,
      correctAnswer: answer
    });
    setVerificationStatus('pending');
  };

  // بررسی پاسخ کاربر
  const checkAnswer = () => {
    if (!formData.verificationCode || verificationStatus === 'locked') return;
    setVerificationStatus('checking');
    
    const userAnswer = parseInt(formData.verificationCode);
    const correctAnswer = mathQuestion.correctAnswer;
    
    if (userAnswer === correctAnswer) {
      setVerificationStatus('correct');
      setWrongAttempts(0);
    } else {
      const newAttempts = wrongAttempts + 1;
      setWrongAttempts(newAttempts);
      setVerificationStatus('incorrect');
      if (newAttempts >= 3) {
        setVerificationStatus('locked');
        setLockTime(60);
        setFormData(prev => ({ ...prev, verificationCode: '' }));
        return;
      }
      setTimeout(() => {
        generateMathQuestion();
        setFormData(prev => ({ ...prev, verificationCode: '' }));
      }, 1000);
    }
  };

  // تولید رمز عبور قوی
  const generateStrongPassword = () => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';
    
    // اطمینان از وجود حداقل یک کاراکتر از هر نوع
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // تکمیل رمز عبور تا 12 کاراکتر
    for (let i = 4; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // مخلوط کردن کاراکترها
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  // تولید سوال ریاضی در هنگام باز شدن دیالوگ
  useEffect(() => {
    if (open) {
      generateMathQuestion();
      setVerificationStatus('pending');
    }
  }, [open]);

  useEffect(() => {
    if (
      formData.verificationCode &&
      verificationStatus !== 'locked' &&
      verificationStatus !== 'checking'
    ) {
      const userAnswer = parseInt(formData.verificationCode);
      const correctAnswerStr = mathQuestion.correctAnswer.toString();
      if (formData.verificationCode.length === correctAnswerStr.length) {
        if (userAnswer === mathQuestion.correctAnswer) {
          setVerificationStatus('correct');
          setWrongAttempts(0);
        } else {
          const newAttempts = wrongAttempts + 1;
          setWrongAttempts(newAttempts);
          setVerificationStatus('incorrect');
          if (newAttempts >= 3) {
            setVerificationStatus('locked');
            setLockTime(60);
            setFormData(prev => ({ ...prev, verificationCode: '' }));
          } else {
            setTimeout(() => {
              generateMathQuestion();
              setFormData(prev => ({ ...prev, verificationCode: '' }));
            }, 1000);
          }
        }
      } else {
        setVerificationStatus('pending');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.verificationCode, mathQuestion.correctAnswer]);

  const validateForm = () => {
    const newErrors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      verificationCode: ''
    };

    // بررسی رمز عبور قدیمی
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'رمز عبور قدیمی الزامی است';
    }

    // بررسی رمز عبور جدید
    if (!formData.newPassword) {
      newErrors.newPassword = 'رمز عبور جدید الزامی است';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'رمز عبور باید حداقل 8 کاراکتر باشد';
    } else if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]*$/.test(formData.newPassword)) {
      newErrors.newPassword = 'فقط حروف انگلیسی، اعداد و علائم مجاز هستند';
    }

    // بررسی تکرار رمز عبور
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'تکرار رمز عبور الزامی است';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'رمز عبور و تکرار آن باید یکسان باشند';
    }

    // بررسی کد صحت سنجی
    if (verificationStatus !== 'correct') {
      newErrors.verificationCode = 'لطفاً پاسخ صحیح را وارد کنید';
    }

    setErrors(newErrors);
    return Object.values(newErrors).every(error => !error);
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
      // پاک کردن فرم
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        verificationCode: ''
      });
      setVerificationStatus('pending');
      setMathQuestion({
        number1: 0,
        number2: 0,
        operation: '+',
        correctAnswer: 0
      });
      onClose();
    }
  };

  const handleClose = () => {
    // پاک کردن فرم و خطاها
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      verificationCode: ''
    });
    setErrors({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      verificationCode: ''
    });
    setShowPassword({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false
    });
    setVerificationStatus('pending');
    setMathQuestion({
      number1: 0,
      number2: 0,
      operation: '+',
      correctAnswer: 0
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        }
      }}
    >
      <DialogTitle sx={{ 
        fontSize: '1.3rem', 
        fontWeight: 'bold',
        borderBottom: '1px solid',
        borderColor: 'divider',
        pb: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <VpnKey />
        تغییر رمز عبور
      </DialogTitle>
      
      <DialogContent sx={{ pt: 1, pb: 1 }}>
        <Grid container spacing={1.2}>
          
          {/* رمز عبور قدیمی */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="رمز عبور قدیمی"
              type={showPassword.currentPassword ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              error={!!errors.currentPassword}
              helperText={errors.currentPassword}
              sx={{ '& .MuiOutlinedInput-root': { backgroundColor: getFieldBackgroundColor() } }}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPassword({ ...showPassword, currentPassword: !showPassword.currentPassword })}
                    edge="end"
                    size="small"
                  >
                    {showPassword.currentPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                )
              }}
            />
          </Grid>

          {/* رمز عبور جدید */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="رمز عبور جدید"
              type={showPassword.newPassword ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={(e) => {
                const value = e.target.value.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/g, '');
                setFormData({ ...formData, newPassword: value });
              }}
              error={!!errors.newPassword}
              helperText={errors.newPassword}
              sx={{ '& .MuiOutlinedInput-root': { backgroundColor: getFieldBackgroundColor() } }}
              InputProps={{
                endAdornment: (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton
                      onClick={() => {
                        const strongPassword = generateStrongPassword();
                        setFormData({ 
                          ...formData, 
                          newPassword: strongPassword,
                          confirmPassword: strongPassword 
                        });
                      }}
                      edge="end"
                      size="small"
                      title="تولید رمز عبور قوی"
                    >
                      <AutoFixHigh />
                    </IconButton>
                    <IconButton
                      onClick={() => setShowPassword({ ...showPassword, newPassword: !showPassword.newPassword })}
                      edge="end"
                      size="small"
                    >
                      {showPassword.newPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </Box>
                )
              }}
            />
          </Grid>

          {/* تکرار رمز عبور جدید */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="تکرار رمز عبور جدید"
              type={showPassword.confirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => {
                const value = e.target.value.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/g, '');
                setFormData({ ...formData, confirmPassword: value });
              }}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              sx={{ '& .MuiOutlinedInput-root': { backgroundColor: getFieldBackgroundColor() } }}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPassword({ ...showPassword, confirmPassword: !showPassword.confirmPassword })}
                    edge="end"
                    size="small"
                  >
                    {showPassword.confirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                )
              }}
            />
          </Grid>

          {/* کد صحت سنجی */}
          {verificationStatus !== 'correct' && (
            <Grid item xs={12}>
              {verificationStatus === 'locked' && (
                <Alert severity="error" sx={{ mb: 1, fontSize: '0.95rem' }}>
                  به دلیل ۳ بار اشتباه، امکان پاسخ‌دهی به مدت {lockTime} ثانیه غیرفعال شد.
                </Alert>
              )}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                gap: 1, 
                p: 1.5,
                border: '1px solid',
                borderColor: verificationStatus === 'incorrect' ? 'error.main' : 'divider',
                borderRadius: 2,
                bgcolor: verificationStatus === 'incorrect' 
                  ? 'error.50' 
                  : theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100'
              }}>
                <IconButton
                  onClick={checkAnswer}
                  size="small"
                  title="تأیید پاسخ"
                  disabled={!formData.verificationCode || verificationStatus === 'checking' || verificationStatus === 'locked'}
                  sx={{ 
                    bgcolor: 'success.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'success.dark' },
                    '&:disabled': { bgcolor: 'grey.300' }
                  }}
                >
                  {verificationStatus === 'checking' ? (
                    <Refresh fontSize="small" sx={{ animation: `${spin} 1s linear infinite` }} />
                  ) : verificationStatus === 'incorrect' ? (
                    <Clear fontSize="small" />
                  ) : (
                    <Check fontSize="small" />
                  )}
                </IconButton>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    value={convertToFarsiNumbers(formData.verificationCode)}
                    onChange={(e) => {
                      const value = convertToEnglishNumbers(e.target.value).replace(/[^0-9]/g, '');
                      setFormData({ ...formData, verificationCode: value });
                      setVerificationStatus('pending');
                    }}
                    error={!!errors.verificationCode}
                    helperText={errors.verificationCode}
                    disabled={verificationStatus === 'checking' || verificationStatus === 'incorrect' || verificationStatus === 'locked'}
                    inputProps={{ 
                      style: { 
                        textAlign: 'center', 
                        fontSize: '1rem',
                        fontWeight: 'bold'
                      },
                      maxLength: 4
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        backgroundColor: getFieldBackgroundColor(),
                        borderRadius: 1
                      },
                      width: '80px',
                      '& .MuiInputBase-input': {
                        padding: '8px 12px'
                      }
                    }}
                  />
                  <Typography variant="body1" color="primary.main" sx={{ fontWeight: 'bold' }}>
                    =
                  </Typography>
                  <Typography variant="body1" color="primary.main" sx={{ fontWeight: 'bold' }}>
                    {convertToFarsiNumbers(mathQuestion.number2)}
                  </Typography>
                  <Typography variant="body1" color="primary.main" sx={{ fontWeight: 'bold' }}>
                    {mathQuestion.operation}
                  </Typography>
                  <Typography variant="body1" color="primary.main" sx={{ fontWeight: 'bold' }}>
                    {convertToFarsiNumbers(mathQuestion.number1)}
                  </Typography>
                </Box>
                <IconButton
                  onClick={generateMathQuestion}
                  size="small"
                  title="تولید سوال جدید"
                  disabled={verificationStatus === 'locked'}
                  sx={{ 
                    bgcolor: 'white',
                    boxShadow: 1,
                    '&:hover': { bgcolor: 'grey.100' }
                  }}
                >
                  <Refresh fontSize="small" />
                </IconButton>
              </Box>
            </Grid>
          )}
          
          {/* نمایش وضعیت موفقیت */}
          {verificationStatus === 'correct' && (
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: 1,
                p: 2,
                border: '1px solid',
                borderColor: 'success.main',
                borderRadius: 2,
                bgcolor: 'success.50'
              }}>
                <CheckCircle color="success" />
                <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                  پاسخ شما صحیح است
                </Typography>
              </Box>
            </Grid>
          )}

          {/* هشدار امنیتی */}
          <Grid item xs={12}>
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              <Typography variant="body2">
                • رمز عبور باید حداقل 8 کاراکتر باشد
                <br />
                • فقط حروف انگلیسی (a-z, A-Z)، اعداد (0-9) و علائم (!@#$%^&*...) مجاز هستند
                <br />
                • از ترکیب حروف بزرگ، کوچک، اعداد و علائم استفاده کنید
                <br />
                • رمز عبور را در اختیار دیگران قرار ندهید
              </Typography>
            </Alert>
          </Grid>

        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          startIcon={<Close />}
          sx={{ borderRadius: 2, minWidth: 100 }}
        >
          انصراف
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<Save />}
          disabled={verificationStatus === 'locked'}
          sx={{ borderRadius: 2, minWidth: 100 }}
        >
          تغییر رمز عبور
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// کامپوننت دیالوگ اطلاعات حساب کاربر
interface UserProfileDialogProps {
  open: boolean;
  user: any;
  onClose: () => void;
  onSave: (userData: any) => void;
}

const UserProfileDialog: React.FC<UserProfileDialogProps> = ({ open, user, onClose, onSave }) => {
  const theme = useTheme();
  
  // تابع helper برای تعیین رنگ پس‌زمینه فیلدها
  const getFieldBackgroundColor = () => {
    return theme.palette.mode === 'dark' ? theme.palette.grey[800] : 'white';
  };

  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    username: '',
    department: '',
    position: '',
    phoneNumber: '',
    nationality: 'iranian' as 'iranian' | 'non-iranian',
    nationalId: '',
    avatar: 'none',
    isActive: true,
  });

  // وضعیت شماره تماس
  const [selectedCountryCode, setSelectedCountryCode] = useState<CountryCode>(
    COUNTRY_CODES.find(c => c.code === 'IR') || COUNTRY_CODES[0]
  );
  const [phoneNumber, setPhoneNumber] = useState('');

  // آدرس‌دهی
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<TCountry | null>(null);
  const [selectedState, setSelectedState] = useState<TState | null>(null);
  const [countries, setCountries] = useState<TCountry[]>([]);
  const [states, setStates] = useState<TState[]>([]);
  const [cities, setCities] = useState<TCity[]>([]);

  // محل تولد
  const [birthPlaceCountry, setBirthPlaceCountry] = useState<TCountry | null>(null);
  const [birthPlaceState, setBirthPlaceState] = useState<TState | null>(null);
  const [birthPlaceCity, setBirthPlaceCity] = useState<TCity | null>(null);
  const [birthPlaceStates, setBirthPlaceStates] = useState<TState[]>([]);
  const [birthPlaceCities, setBirthPlaceCities] = useState<TCity[]>([]);

  // تاریخ تولد
  const [birthDateCalendarType, setBirthDateCalendarType] = useState<'shamsi' | 'miladi' | 'qamari'>('shamsi');
  const [birthDateYear, setBirthDateYear] = useState<number | null>(null);
  const [birthDateMonth, setBirthDateMonth] = useState<number | null>(null);
  const [birthDateDay, setBirthDateDay] = useState<number | null>(null);

  // بارگیری اولیه کشورها
  useEffect(() => {
    getCountries().then(setCountries);
  }, []);

  // مقداردهی اولیه از داده‌های کاربر
  useEffect(() => {
    if (user && open) {
      setFormData({
        name: user.name || '',
        nameEn: user.nameEn || '',
        username: user.username || '',
        department: user.department || '',
        position: user.position || '',
        phoneNumber: user.phoneNumber || '',
        nationality: user.nationality || 'iranian',
        nationalId: user.nationalId || '',
        avatar: user.avatar || 'none',
        isActive: user.isActive ?? true,
      });

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

      // تجزیه آدرس‌ها
      setAddresses(user.addresses || [{
        id: Date.now().toString(),
        title: 'آدرس ۱',
        country: 'IR',
        state: '',
        city: '',
        postalCode: '',
        detailAddress: '',
        isDefault: true
      }]);

      // تجزیه محل تولد
      if (user.birthPlace) {
        const birthCountry = countries.find(c => c.name === user.birthPlace.country);
        setBirthPlaceCountry(birthCountry || null);
        // می‌توانید استان و شهر را نیز بازیابی کنید
      }

      // تجزیه تاریخ تولد
      if (user.birthDate) {
        setBirthDateCalendarType(user.birthDate.calendarType);
        setBirthDateYear(user.birthDate.year);
        setBirthDateMonth(user.birthDate.month);
        setBirthDateDay(user.birthDate.day);
      }
    }
  }, [user, open, countries]);



  // اضافه کردن آدرس جدید
  const addAddress = () => {
    setAddresses([...addresses, {
      id: Date.now().toString(),
      title: `آدرس ${addresses.length + 1}`,
      country: 'IR',
      state: '',
      city: '',
      postalCode: '',
      detailAddress: '',
      isDefault: false
    }]);
  };

  // حذف آدرس
  const removeAddress = (id: string) => {
    setAddresses(addresses.filter(addr => addr.id !== id));
  };

  // تغییر آدرس
  const updateAddress = (id: string, field: keyof Address, value: string | boolean) => {
    setAddresses(addresses.map(addr => 
      addr.id === id ? { ...addr, [field]: value } : addr
    ));
  };

  const handleSave = () => {
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

    // تشکیل داده‌های کاربر
    const userData = {
      ...formData,
      phoneNumber: phoneNumber ? `${selectedCountryCode.dialCode}${phoneNumber}` : '',
      birthDate,
      birthPlace,
      addresses,
    };

    onSave(userData);
    onClose();
  };

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
        }
      }}
    >
      <DialogTitle sx={{ 
        fontSize: '1.3rem', 
        fontWeight: 'bold',
        borderBottom: '1px solid',
        borderColor: 'divider',
        pb: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <Person />
        اطلاعات حساب کاربر
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          
          {/* اطلاعات پایه */}
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Person sx={{ mr: 1 }} />
                اطلاعات شخصی
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="نام و نام خانوادگی"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    sx={{ '& .MuiOutlinedInput-root': { backgroundColor: getFieldBackgroundColor() } }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="نام و نام خانوادگی (انگلیسی)"
                    value={formData.nameEn}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                      setFormData({ ...formData, nameEn: value });
                    }}
                    inputProps={{ dir: 'ltr', style: { textAlign: 'left' } }}
                    placeholder="First Name Last Name"
                    sx={{ '& .MuiOutlinedInput-root': { backgroundColor: getFieldBackgroundColor() } }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="نام کاربری"
                    value={formData.username}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-Z0-9._-]/g, '');
                      setFormData({ ...formData, username: value });
                    }}
                    inputProps={{ dir: 'ltr', style: { textAlign: 'left' } }}
                    sx={{ '& .MuiOutlinedInput-root': { backgroundColor: getFieldBackgroundColor() } }}
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
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl sx={{ minWidth: 120, flex: '0 0 40%' }}>
                      <InputLabel>تابعیت</InputLabel>
                      <Select
                        value={formData.nationality}
                        label="تابعیت"
                        onChange={(e) => setFormData({ ...formData, nationality: e.target.value as 'iranian' | 'non-iranian' })}
                        sx={{ backgroundColor: getFieldBackgroundColor() }}
                      >
                        <MenuItem value="iranian">ایرانی</MenuItem>
                        <MenuItem value="non-iranian">غیر ایرانی</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <TextField
                      sx={{ flex: '1' }}
                      label={formData.nationality === 'iranian' ? 'شماره ملی' : 'شماره پاسپورت'}
                      value={formData.nationalId}
                      onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    />
                  </Box>
                </Grid>
                
                {/* تاریخ تولد */}
                <Grid item xs={12} md={6}>
                  <Grid container spacing={1}>
                    <Grid item xs={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>تقویم</InputLabel>
                        <Select
                          value={birthDateCalendarType}
                          label="تقویم"
                          onChange={(e) => setBirthDateCalendarType(e.target.value as 'shamsi' | 'miladi' | 'qamari')}
                          sx={{ backgroundColor: getFieldBackgroundColor() }}
                        >
                          <MenuItem value="shamsi">شمسی</MenuItem>
                          <MenuItem value="miladi">میلادی</MenuItem>
                          <MenuItem value="qamari">قمری</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        label="سال"
                        size="small"
                        value={birthDateYear || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          if (value.length <= 4) {
                            setBirthDateYear(value ? parseInt(value) : null);
                          }
                        }}
                        inputProps={{ maxLength: 4 }}
                        sx={{ '& .MuiOutlinedInput-root': { backgroundColor: getFieldBackgroundColor() } }}
                      />
                    </Grid>
                    
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        label="ماه"
                        size="small"
                        value={birthDateMonth || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          const numValue = parseInt(value);
                          if (value === '' || (numValue >= 1 && numValue <= 12)) {
                            setBirthDateMonth(value ? numValue : null);
                          }
                        }}
                        inputProps={{ maxLength: 2 }}
                        sx={{ '& .MuiOutlinedInput-root': { backgroundColor: getFieldBackgroundColor() } }}
                      />
                    </Grid>
                    
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        label="روز"
                        size="small"
                        value={birthDateDay || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          const numValue = parseInt(value);
                          if (value === '' || (numValue >= 1 && numValue <= 31)) {
                            setBirthDateDay(value ? numValue : null);
                          }
                        }}
                        inputProps={{ maxLength: 2 }}
                        sx={{ '& .MuiOutlinedInput-root': { backgroundColor: getFieldBackgroundColor() } }}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                {/* محل تولد */}
                <Grid item xs={12} md={6}>
                  <Grid container spacing={1}>
                    <Grid item xs={4}>
                      <Autocomplete
                        options={countries}
                        getOptionLabel={(option) => option.name}
                        value={birthPlaceCountry}
                        onChange={(event, newValue) => {
                          setBirthPlaceCountry(newValue);
                          setBirthPlaceState(null);
                          setBirthPlaceCity(null);
                          if (newValue) {
                            getStates(newValue.code).then(setBirthPlaceStates);
                          }
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="کشور محل تولد"
                            size="small"
                            sx={{ 
                              '& .MuiOutlinedInput-root': { backgroundColor: getFieldBackgroundColor() },
                              '& .MuiInputLabel-root': { fontSize: '0.75rem' }
                            }}
                          />
                        )}
                      />
                    </Grid>
                    
                    <Grid item xs={4}>
                      <Autocomplete
                        options={birthPlaceStates}
                        getOptionLabel={(option) => option.name}
                        value={birthPlaceState}
                        onChange={(event, newValue) => {
                          setBirthPlaceState(newValue);
                          setBirthPlaceCity(null);
                          if (newValue) {
                            getCities(newValue.code).then(setBirthPlaceCities);
                          }
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="استان محل تولد"
                            size="small"
                            sx={{ 
                              '& .MuiOutlinedInput-root': { backgroundColor: getFieldBackgroundColor() },
                              '& .MuiInputLabel-root': { fontSize: '0.75rem' }
                            }}
                          />
                        )}
                      />
                    </Grid>
                    
                    <Grid item xs={4}>
                      <Autocomplete
                        options={birthPlaceCities}
                        getOptionLabel={(option) => option.name}
                        value={birthPlaceCity}
                        onChange={(event, newValue) => setBirthPlaceCity(newValue)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="شهر محل تولد"
                            size="small"
                            sx={{ 
                              '& .MuiOutlinedInput-root': { backgroundColor: getFieldBackgroundColor() },
                              '& .MuiInputLabel-root': { fontSize: '0.75rem' }
                            }}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>آواتار</InputLabel>
                    <Select
                      value={formData.avatar}
                      onChange={(e: SelectChangeEvent) => setFormData({ ...formData, avatar: e.target.value })}
                      label="آواتار"
                      sx={{ backgroundColor: getFieldBackgroundColor() }}
                    >
                      {MILITARY_AVATARS.map((avatar) => (
                        <MenuItem key={avatar.id} value={avatar.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {avatar.path ? (
                              <Avatar
                                src={avatar.path}
                                sx={{ width: 32, height: 32 }}
                              />
                            ) : (
                              <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.300' }}>
                                بدون
                              </Avatar>
                            )}
                            <span>{avatar.name}</span>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl sx={{ minWidth: 140, flex: '0 0 35%' }}>
                      <InputLabel>کشور</InputLabel>
                      <Select
                        value={selectedCountryCode.code}
                        label="کشور"
                        onChange={(e) => {
                          const country = COUNTRY_CODES.find(c => c.code === e.target.value);
                          if (country) setSelectedCountryCode(country);
                        }}
                        sx={{ backgroundColor: getFieldBackgroundColor() }}
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
                      sx={{ flex: '1' }}
                      label="شماره تماس"
                      value={convertToFarsiNumbers(phoneNumber)}
                      onChange={(e) => {
                        const convertedValue = convertToEnglishNumbers(e.target.value);
                        const value = convertedValue.replace(/[^\d]/g, '');
                        setPhoneNumber(value);
                      }}
                      inputProps={{ dir: 'ltr', style: { textAlign: 'left' }, maxLength: 15 }}
                      placeholder="۹۱۲۳۴۵۶۷۸۹"
                      helperText={`شماره کامل: ${convertToFarsiNumbers(selectedCountryCode.dialCode)}${convertToFarsiNumbers(phoneNumber)}`}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* اطلاعات شغلی */}
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Badge sx={{ mr: 1 }} />
                اطلاعات شغلی
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="بخش"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    sx={{ '& .MuiOutlinedInput-root': { backgroundColor: getFieldBackgroundColor() } }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="سمت"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    sx={{ '& .MuiOutlinedInput-root': { backgroundColor: getFieldBackgroundColor() } }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* آدرس‌ها */}
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOn sx={{ mr: 1 }} />
                  آدرس‌ها
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Add />}
                  onClick={addAddress}
                >
                  افزودن آدرس
                </Button>
              </Box>
              
              {addresses.map((address, index) => (
                <Box key={address.id} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="عنوان آدرس"
                        value={address.title}
                        onChange={(e) => updateAddress(address.id, 'title', e.target.value)}
                        size="small"
                        sx={{ '& .MuiOutlinedInput-root': { backgroundColor: getFieldBackgroundColor() } }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="کد پستی"
                        value={address.postalCode}
                        onChange={(e) => updateAddress(address.id, 'postalCode', e.target.value)}
                        size="small"
                        sx={{ '& .MuiOutlinedInput-root': { backgroundColor: getFieldBackgroundColor() } }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="آدرس کامل"
                        value={address.detailAddress}
                        onChange={(e) => updateAddress(address.id, 'detailAddress', e.target.value)}
                        multiline
                        rows={2}
                        size="small"
                        sx={{ '& .MuiOutlinedInput-root': { backgroundColor: getFieldBackgroundColor() } }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={address.isDefault || false}
                              onChange={(e) => updateAddress(address.id, 'isDefault', e.target.checked)}
                              size="small"
                            />
                          }
                          label="آدرس پیش‌فرض"
                        />
                        {addresses.length > 1 && (
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<Delete />}
                            onClick={() => removeAddress(address.id)}
                          >
                            حذف آدرس
                          </Button>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Paper>
          </Grid>


        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          startIcon={<Close />}
          sx={{ borderRadius: 2, minWidth: 100 }}
        >
          انصراف
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<Save />}
          sx={{ borderRadius: 2, minWidth: 100 }}
        >
          ذخیره تغییرات
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ProfilePanel: React.FC<ProfilePanelProps> = ({ onClose }) => {
  const theme = useTheme();
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const { openDialog: openScenarioDialog } = useScenarioDialog();

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('user');
    navigate('/auth/login');
    if (onClose) onClose();
  };

  const handleManageAccount = () => {
    setProfileDialogOpen(true);
  };

  const handleSaveProfile = (userData: any) => {
    // تبدیل داده‌های UserProfile به فرمت User در authSlice
    const updatedUserData = {
      id: userData.id,
      username: userData.username,
      name: userData.name,
      role: userData.role,
      rank: userData.position,
      unit: userData.department,
      avatar: userData.avatar,
      permissions: userData.permissions,
    };
    
    dispatch(updateUser(updatedUserData));
    dispatch(showSuccessNotification('اطلاعات حساب کاربری با موفقیت به‌روزرسانی شد'));
  };

  const handleChangePassword = () => {
    setChangePasswordDialogOpen(true);
  };

  const handleSavePassword = (passwordData: any) => {
    // اینجا باید درخواست API برای تغییر رمز عبور ارسال شود
    console.log('Password change data:', passwordData);
    dispatch(showSuccessNotification('رمز عبور با موفقیت تغییر یافت'));
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'مدیر کل';
      case 'commander': return 'فرمانده';
      case 'operator': return 'اپراتور';
      case 'viewer': return 'بیننده';
      default: return 'کاربر';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'commander': return 'warning';
      case 'operator': return 'info';
      case 'viewer': return 'success';
      default: return 'default';
    }
  };

  // تبدیل user از authSlice به فرمت UserProfile برای سازگاری با مدیریت کاربران
  const getUserProfileData = () => {
    if (!user) return null;
    
    return {
      id: user.id,
      username: user.username,
      email: `${user.username}@sajed.mil`,
      firstName: user.name?.split(' ')[0] || '',
      lastName: user.name?.split(' ').slice(1).join(' ') || '',
      name: user.name,
      nameEn: user.name, // در صورت نیاز می‌توان از فیلد جداگانه استفاده کرد
      avatar: user.avatar || 'none',
      role: user.role,
      department: user.unit || 'نامشخص',
      position: user.rank || 'نامشخص',
      phoneNumber: '',
      nationality: 'iranian' as const,
      nationalId: '',
      securityClearance: 'basic' as const,
      isActive: true,
      permissions: user.permissions || [],
      lastLogin: new Date(),
      loginCount: 0,
      birthDate: undefined,
      birthPlace: undefined,
      addresses: [],
      emergencyContact: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  if (!user) {
    return (
      <Paper elevation={8} data-component="profile-panel" sx={{ 
        width: 240, 
        p: 2, 
        textAlign: 'center', 
        borderRadius: 3
      }}>
        <Typography variant="caption" color="text.secondary">
          کاربری وارد نشده است
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper 
      elevation={8}
      data-component="profile-panel"
      sx={{ 
        width: 240, 
        borderRadius: 3, 
        overflow: 'hidden',
        bgcolor: 'background.paper'
      }}
    >
      {/* Header with close button */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 1,
        bgcolor: theme.palette.primary.main,
        color: 'white'
      }}>
        <Typography variant="body2" sx={{ opacity: 0.8, fontSize: '0.8rem' }}>
          {user.username}@sajed.mil
        </Typography>
        {onClose && (
          <IconButton 
            onClick={onClose} 
            size="small" 
            sx={{ color: 'white' }}
          >
            <Close />
          </IconButton>
        )}
      </Box>

      {/* Main Profile Section */}
      <Box sx={{ p: 1.5, textAlign: 'center', bgcolor: theme.palette.primary.main, color: 'white' }}>
        <Avatar
          sx={{
            width: 56,
            height: 56,
            mx: 'auto',
            mb: 1,
            bgcolor: '#1976d2', // رنگ ثابت آبی
            fontSize: '1.4rem',
            fontWeight: 'bold',
            border: '2px solid white'
          }}
        >
          {user.name?.charAt(0) || user.username[0]}
        </Avatar>
        
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5, color: 'white', fontSize: '1rem' }}>
          {user.name}
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 1.5, opacity: 0.8, fontSize: '0.75rem' }}>
          {user.rank} - {user.unit}
        </Typography>
        
        <Button
          variant="outlined"
          size="small"
          onClick={handleManageAccount}
          startIcon={<Edit />}
          sx={{
            borderColor: 'white',
            color: 'white',
            borderRadius: 20,
            px: 1.5,
            py: 0.3,
            fontSize: '0.7rem',
            '&:hover': {
              borderColor: 'grey.300',
              bgcolor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          مدیریت حساب کاربری
        </Button>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ p: 1, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
          <Button
            variant="outlined"
            startIcon={<VpnKey />}
            size="small"
            onClick={handleChangePassword}
            sx={{
              flex: 1,
              borderRadius: 20,
              py: 0.3,
              fontSize: '0.7rem',
              borderColor: 'grey.400',
              color: 'text.primary',
              '&:hover': {
                borderColor: 'grey.600',
                bgcolor: 'grey.50'
              }
            }}
          >
            تغییر رمز عبور
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<ExitToApp />}
            onClick={handleLogout}
            size="small"
            sx={{
              flex: 1,
              borderRadius: 20,
              py: 0.3,
              fontSize: '0.7rem',
              borderColor: 'grey.400',
              color: 'text.primary',
              '&:hover': {
                borderColor: 'grey.600',
                bgcolor: 'grey.50'
              }
            }}
          >
            خروج
          </Button>
        </Box>

        {/* Scenario Buttons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            size="small"
            onClick={() => {
              openScenarioDialog();
            }}
            sx={{
              borderRadius: 2,
              py: 0.3,
              fontSize: '0.7rem',
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                borderColor: 'primary.dark',
                bgcolor: 'primary.50'
              }
            }}
          >
            سناریوی جدید
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Assignment />}
            size="small"
            onClick={() => {
              navigate('/dashboard/scenarios');
              // در صفحه سناریوها می‌توان فیلتر «سناریوهای من» را فعال کرد
            }}
            sx={{
              borderRadius: 2,
              py: 0.3,
              fontSize: '0.7rem',
              borderColor: 'grey.400',
              color: 'text.primary',
              '&:hover': {
                borderColor: 'grey.600',
                bgcolor: 'grey.50'
              }
            }}
          >
            سناریوهای من
          </Button>
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ 
        p: 1, 
        textAlign: 'center', 
        bgcolor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
          حریم خصوصی • شرایط استفاده
        </Typography>
      </Box>
      
      {/* دیالوگ اطلاعات حساب کاربر */}
      <UserProfileDialog
        open={profileDialogOpen}
        user={getUserProfileData()}
        onClose={() => setProfileDialogOpen(false)}
        onSave={handleSaveProfile}
      />
      
      {/* دیالوگ تغییر رمز عبور */}
      <ChangePasswordDialog
        open={changePasswordDialogOpen}
        onClose={() => setChangePasswordDialogOpen(false)}
        onSave={handleSavePassword}
      />
    </Paper>
  );
};

export default ProfilePanel; 