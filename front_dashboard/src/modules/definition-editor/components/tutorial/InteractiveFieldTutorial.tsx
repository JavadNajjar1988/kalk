// Interactive Field Constructor Tutorial
// آموزش تعاملی Field Constructor

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Paper,
  Alert,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Divider,
  Fab,
  Tooltip
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  School as SchoolIcon,
  Code as CodeIcon,
  Visibility as PreviewIcon,
  ExpandMore as ExpandMoreIcon,
  Lightbulb as TipIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Help as HelpIcon
} from '@mui/icons-material';

import { FieldPreview } from '../fields/FieldPreview';
import type { FieldConstructorConfig } from '../../types/fieldConstructor';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  field?: FieldConstructorConfig;
  code: string;
  tips: string[];
  commonMistakes: string[];
  nextActions: string[];
}

interface TutorialProps {
  onComplete?: () => void;
  autoStart?: boolean;
  showCode?: boolean;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'basic-text-field',
    title: '1. ایجاد فیلد متنی ساده',
    description: 'یاد بگیرید چطور یک فیلد متنی ساده ایجاد کنید',
    field: {
      id: 'firstName',
      name: 'نام',
      inputType: 'text',
      isRequired: true,
      order: 1,
      inputEnhancement: {
        type: 'text',
        configuration: {
          placeholder: 'نام خود را وارد کنید',
          maxLength: 50
        }
      }
    },
    code: `const textField: FieldConstructorConfig = {
  id: 'firstName',
  name: 'نام',
  inputType: 'text',
  isRequired: true,
  order: 1,
  inputEnhancement: {
    type: 'text',
    configuration: {
      placeholder: 'نام خود را وارد کنید',
      maxLength: 50
    }
  }
};`,
    tips: [
      'همیشه id یکتا انتخاب کنید',
      'از placeholder برای راهنمایی کاربر استفاده کنید',
      'maxLength را برای محدود کردن ورودی تنظیم کنید'
    ],
    commonMistakes: [
      'فراموش کردن تنظیم isRequired',
      'استفاده از id تکراری',
      'عدم تنظیم order برای ترتیب نمایش'
    ],
    nextActions: [
      'فیلد را در فرم خود اضافه کنید',
      'اعتبارسنجی سفارشی اضافه کنید',
      'طراحی فیلد را سفارشی کنید'
    ]
  },
  {
    id: 'email-validation',
    title: '2. فیلد ایمیل با اعتبارسنجی',
    description: 'ایجاد فیلد ایمیل با قوانین اعتبارسنجی پیشرفته',
    field: {
      id: 'email',
      name: 'آدرس ایمیل',
      inputType: 'email',
      isRequired: true,
      order: 2,
      validation: [
        {
          type: 'pattern',
          pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$',
          message: 'فرمت ایمیل صحیح نیست'
        }
      ],
      inputEnhancement: {
        type: 'text',
        configuration: {
          placeholder: 'example@domain.com'
        }
      }
    },
    code: `const emailField: FieldConstructorConfig = {
  id: 'email',
  name: 'آدرس ایمیل',
  inputType: 'email',
  isRequired: true,
  order: 2,
  validation: [
    {
      type: 'pattern',
      pattern: '^[\\\\w-\\\\.]+@([\\\\w-]+\\\\.)+[\\\\w-]{2,4}$',
      message: 'فرمت ایمیل صحیح نیست'
    }
  ],
  inputEnhancement: {
    type: 'text',
    configuration: {
      placeholder: 'example@domain.com'
    }
  }
};`,
    tips: [
      'از inputType: "email" برای اعتبارسنجی خودکار استفاده کنید',
      'پیام خطای فارسی برای تجربه کاربری بهتر',
      'pattern regex را برای اعتبارسنجی دقیق‌تر استفاده کنید'
    ],
    commonMistakes: [
      'فراموش کردن escape کردن کاراکترهای خاص در regex',
      'عدم تست pattern با ایمیل‌های مختلف',
      'پیام خطای نامفهوم برای کاربر'
    ],
    nextActions: [
      'تست اعتبارسنجی با ایمیل‌های مختلف',
      'اضافه کردن اعتبارسنجی سمت سرور',
      'پیاده‌سازی تایید ایمیل'
    ]
  },
  {
    id: 'select-field',
    title: '3. فیلد انتخابی',
    description: 'ایجاد فیلد انتخابی با گزینه‌های متعدد',
    field: {
      id: 'gender',
      name: 'جنسیت',
      inputType: 'select',
      isRequired: true,
      order: 3,
      inputEnhancement: {
        type: 'select',
        configuration: {
          options: ['مرد', 'زن'],
          allowClear: true,
          placeholder: 'جنسیت خود را انتخاب کنید'
        }
      }
    },
    code: `const selectField: FieldConstructorConfig = {
  id: 'gender',
  name: 'جنسیت',
  inputType: 'select',
  isRequired: true,
  order: 3,
  inputEnhancement: {
    type: 'select',
    configuration: {
      options: ['مرد', 'زن'],
      allowClear: true,
      placeholder: 'جنسیت خود را انتخاب کنید'
    }
  }
};`,
    tips: [
      'از allowClear برای امکان پاک کردن انتخاب استفاده کنید',
      'options را بر اساس نیاز پروژه تنظیم کنید',
      'placeholder مناسب برای راهنمایی کاربر'
    ],
    commonMistakes: [
      'فراموش کردن تنظیم allowClear',
      'options خالی یا نامناسب',
      'عدم مدیریت حالت انتخاب نشده'
    ],
    nextActions: [
      'گزینه‌های بیشتر اضافه کنید',
      'از API برای بارگذاری گزینه‌ها استفاده کنید',
      'فیلد multiselect امتحان کنید'
    ]
  },
  {
    id: 'hierarchical-address',
    title: '4. آدرس سلسله‌مراتبی',
    description: 'ایجاد فیلد آدرس با ساختار سلسله‌مراتبی',
    field: {
      id: 'address',
      name: 'آدرس',
      inputType: 'hierarchical-address',
      isRequired: true,
      order: 4,
      inputEnhancement: {
        type: 'hierarchical',
        configuration: {
          rootCategory: 'geographical',
          maxDepth: 4,
          showPath: true,
          allowSearch: true,
          showCoordinates: false
        }
      },
      dataSource: {
        type: 'hierarchical',
        configuration: {
          rootCategory: 'geographical'
        }
      }
    },
    code: `const addressField: FieldConstructorConfig = {
  id: 'address',
  name: 'آدرس',
  inputType: 'hierarchical-address',
  isRequired: true,
  order: 4,
  inputEnhancement: {
    type: 'hierarchical',
    configuration: {
      rootCategory: 'geographical',
      maxDepth: 4,
      showPath: true,
      allowSearch: true,
      showCoordinates: false
    }
  },
  dataSource: {
    type: 'hierarchical',
    configuration: {
      rootCategory: 'geographical'
    }
  }
};`,
    tips: [
      'showPath برای نمایش مسیر انتخاب شده',
      'allowSearch برای جستجو در گزینه‌ها',
      'maxDepth برای محدود کردن عمق انتخاب'
    ],
    commonMistakes: [
      'فراموش کردن تنظیم dataSource',
      'rootCategory اشتباه',
      'عدم تنظیم maxDepth مناسب'
    ],
    nextActions: [
      'showCoordinates را فعال کنید',
      'دیتای جغرافیایی سفارشی اضافه کنید',
      'واکشی lazy برای بهبود عملکرد'
    ]
  },
  {
    id: 'array-field',
    title: '5. فیلد آرایه (لیست تلفن)',
    description: 'ایجاد فیلد آرایه برای مدیریت چندین مقدار',
    field: {
      id: 'phones',
      name: 'شماره تلفن‌ها',
      inputType: 'array',
      isRequired: false,
      order: 5,
      inputEnhancement: {
        type: 'array',
        configuration: {
          itemType: 'phone',
          minItems: 1,
          maxItems: 5,
          allowReorder: true,
          allowDuplicate: false
        }
      }
    },
    code: `const phoneArrayField: FieldConstructorConfig = {
  id: 'phones',
  name: 'شماره تلفن‌ها',
  inputType: 'array',
  isRequired: false,
  order: 5,
  inputEnhancement: {
    type: 'array',
    configuration: {
      itemType: 'phone',
      minItems: 1,
      maxItems: 5,
      allowReorder: true,
      allowDuplicate: false
    }
  }
};`,
    tips: [
      'minItems و maxItems برای کنترل تعداد آیتم‌ها',
      'allowReorder برای قابلیت مرتب‌سازی',
      'allowDuplicate برای جلوگیری از تکرار'
    ],
    commonMistakes: [
      'فراموش کردن تنظیم itemType',
      'محدودیت نامناسب برای تعداد آیتم‌ها',
      'عدم اعتبارسنجی آیتم‌های فردی'
    ],
    nextActions: [
      'اعتبارسنجی سفارشی برای هر آیتم',
      'امکان افزودن از طریق QR Code',
      'گروه‌بندی انواع مختلف تلفن'
    ]
  }
];

const InteractiveFieldTutorial: React.FC<TutorialProps> = ({
  onComplete,
  autoStart = false,
  showCode = true
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoStart);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTips, setShowTips] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTab, setCurrentTab] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const currentStep = tutorialSteps[activeStep];
  const isLastStep = activeStep === tutorialSteps.length - 1;

  // Auto-advance tutorial
  useEffect(() => {
    if (isPlaying && !isLastStep) {
      const timer = setTimeout(() => {
        handleNext();
      }, 8000); // 8 seconds per step

      return () => clearTimeout(timer);
    }
  }, [activeStep, isPlaying, isLastStep]);

  // Update progress
  useEffect(() => {
    setProgress((activeStep / (tutorialSteps.length - 1)) * 100);
  }, [activeStep]);

  const handleNext = () => {
    setCompletedSteps(prev => new Set([...prev, activeStep]));
    
    if (isLastStep) {
      setIsPlaying(false);
      onComplete?.();
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => Math.max(0, prev - 1));
  };

  const handleReset = () => {
    setActiveStep(0);
    setFormData({});
    setErrors({});
    setCompletedSteps(new Set());
    setIsPlaying(false);
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: ''
      }));
    }
  };

  const validateCurrentField = () => {
    if (!currentStep.field) return true;
    
    const value = formData[currentStep.field.id];
    
    if (currentStep.field.isRequired && (!value || value === '')) {
      setErrors(prev => ({
        ...prev,
        [currentStep.field!.id]: 'این فیلد اجباری است'
      }));
      return false;
    }
    
    return true;
  };

  const handleStepClick = (stepIndex: number) => {
    setActiveStep(stepIndex);
    setIsPlaying(false);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SchoolIcon sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" gutterBottom>
                آموزش Field Constructor
              </Typography>
              <Typography variant="subtitle1">
                راهنمای گام به گام ایجاد فیلدهای پیشرفته
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={isPlaying ? 'توقف' : 'شروع'}>
              <Fab
                size="small"
                color="secondary"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </Fab>
            </Tooltip>
            <Tooltip title="شروع مجدد">
              <Fab
                size="small"
                color="secondary"
                onClick={handleReset}
              >
                <RefreshIcon />
              </Fab>
            </Tooltip>
            <Tooltip title="راهنما">
              <Fab
                size="small"
                color="secondary"
                onClick={() => setShowTips(!showTips)}
              >
                <HelpIcon />
              </Fab>
            </Tooltip>
          </Box>
        </Box>
        
        {/* Progress Bar */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" gutterBottom>
            پیشرفت: {Math.round(progress)}% ({activeStep + 1} از {tutorialSteps.length})
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: 'rgba(255,255,255,0.3)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: 'white'
              }
            }} 
          />
        </Box>
      </Paper>

      {/* Tips Dialog */}
      <Dialog open={showTips} onClose={() => setShowTips(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TipIcon color="primary" />
            نکات مفید
          </Box>
        </DialogTitle>
        <DialogContent>
          <Tabs value={currentTab} onChange={(_, value) => setCurrentTab(value)}>
            <Tab label="نکات" />
            <Tab label="اشتباهات رایج" />
            <Tab label="اقدامات بعدی" />
          </Tabs>
          
          <Box sx={{ mt: 2 }}>
            {currentTab === 0 && (
              <List>
                {currentStep.tips.map((tip, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <TipIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={tip} />
                  </ListItem>
                ))}
              </List>
            )}
            
            {currentTab === 1 && (
              <List>
                {currentStep.commonMistakes.map((mistake, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <WarningIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText primary={mistake} />
                  </ListItem>
                ))}
              </List>
            )}
            
            {currentTab === 2 && (
              <List>
                {currentStep.nextActions.map((action, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <InfoIcon color="info" />
                    </ListItemIcon>
                    <ListItemText primary={action} />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTips(false)}>بستن</Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Stepper */}
        <Box sx={{ minWidth: 300 }}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              مراحل آموزش
            </Typography>
            <Stepper activeStep={activeStep} orientation="vertical">
              {tutorialSteps.map((step, index) => (
                <Step key={step.id} completed={completedSteps.has(index)}>
                  <StepLabel 
                    onClick={() => handleStepClick(index)}
                    sx={{ cursor: 'pointer' }}
                    StepIconComponent={({ active, completed }) => (
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: completed ? 'success.main' : active ? 'primary.main' : 'grey.300',
                          color: 'white',
                          fontSize: '0.875rem'
                        }}
                      >
                        {completed ? <CheckIcon sx={{ fontSize: 16 }} /> : index + 1}
                      </Box>
                    )}
                  >
                    {step.title}
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" color="text.secondary">
                      {step.description}
                    </Typography>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </Box>

        {/* Main Content */}
        <Box sx={{ flex: 1 }}>
          <Card elevation={2}>
            <CardContent>
              {/* Step Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Chip 
                  label={`مرحله ${activeStep + 1}`} 
                  color="primary" 
                  variant="filled"
                />
                <Typography variant="h5">
                  {currentStep.title}
                </Typography>
              </Box>
              
              <Typography variant="body1" paragraph>
                {currentStep.description}
              </Typography>

              {/* Field Preview */}
              {currentStep.field && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    <PreviewIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    پیش‌نمایش فیلد
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 3 }}>
                    <FieldPreview
                      field={currentStep.field}
                      value={formData[currentStep.field.id]}
                      onChange={handleFieldChange}
                      error={errors[currentStep.field.id]}
                    />
                  </Paper>
                </Box>
              )}

              {/* Code Display */}
              {showCode && (
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">
                      <CodeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      کد نمونه
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        backgroundColor: 'grey.50',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        overflow: 'auto'
                      }}
                    >
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                        {currentStep.code}
                      </pre>
                    </Paper>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Navigation */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button
                  onClick={handleBack}
                  disabled={activeStep === 0}
                  variant="outlined"
                >
                  قبلی
                </Button>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    onClick={() => setShowTips(true)}
                    variant="outlined"
                    startIcon={<TipIcon />}
                  >
                    نکات
                  </Button>
                  <Button
                    onClick={handleNext}
                    variant="contained"
                    endIcon={isLastStep ? <CheckIcon /> : undefined}
                  >
                    {isLastStep ? 'اتمام' : 'بعدی'}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default InteractiveFieldTutorial;