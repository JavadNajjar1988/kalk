import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  alpha,
  useTheme,
  Chip
} from '@mui/material';
import {
  TextFields as TextIcon,
  Numbers as NumberIcon,
  CheckBoxOutlined as ChoiceIcon,
  Link as ReferenceIcon
} from '@mui/icons-material';

import { 
  BaseFieldType, 
  SmartFieldConfig,
  FieldContext
} from '../../../types/smartFieldTypes';

// Import accessibility helpers
import { ARIA_LABELS, AriaHelper } from '../../../utils/accessibilityHelpers';

interface BaseTypeStepProps {
  config: Partial<SmartFieldConfig>;
  onConfigUpdate: (updates: Partial<SmartFieldConfig>) => void;
  fieldContext: FieldContext;
  errors: Record<string, string>;
  editingField?: SmartFieldConfig | null;
}

const BaseTypeStep: React.FC<BaseTypeStepProps> = ({
  config,
  onConfigUpdate,
  fieldContext,
  errors,
  editingField
}) => {
  const theme = useTheme();

  // Define base field types with detailed information
  const baseTypes = [
    {
      type: BaseFieldType.TEXT,
      title: 'متن',
      subtitle: 'فیلد متنی آزاد',
      description: 'برای دریافت متن‌های کوتاه یا بلند، ایمیل، آدرس و موارد مشابه',
      icon: TextIcon,
      color: theme.palette.success.main,
      examples: ['نام و نام خانوادگی', 'آدرس دقیق', 'ایمیل', 'توضیحات'],
      useCases: [
        'نام‌ها و عناوین',
        'آدرس و توضیحات',
        'ایمیل و وب‌سایت',
        'متن‌های قابل فرمت‌بندی'
      ],
      enhancements: ['چندخطی', 'فرمت‌بندی', 'ترکیبی'],
      recommended: fieldContext.categoryType === 'personnel'
    },
    {
      type: BaseFieldType.NUMBER,
      title: 'عدد',
      subtitle: 'فیلد عددی با محدوده',
      description: 'برای دریافت اعداد صحیح، اعشاری، سن، تعداد و موارد مشابه',
      icon: NumberIcon,
      color: theme.palette.info.main,
      examples: ['سن', 'تعداد', 'قیمت', 'امتیاز'],
      useCases: [
        'سن و تاریخ‌ها',
        'مقادیر و تعداد',
        'قیمت و هزینه',
        'رتبه و امتیاز'
      ],
      enhancements: ['محدوده', 'واحد', 'اعشار'],
      recommended: false
    },
    {
      type: BaseFieldType.CHOICE,
      title: 'انتخابی',
      subtitle: 'انتخاب از گزینه‌های از پیش تعیین شده',
      description: 'برای انتخاب از لیست مشخص، رادیو باتن، چک‌باکس و موارد مشابه',
      icon: ChoiceIcon,
      color: theme.palette.warning.main,
      examples: ['جنسیت', 'وضعیت تأهل', 'مدرک تحصیلی', 'رنگ'],
      useCases: [
        'دسته‌بندی‌های ثابت',
        'وضعیت‌ها',
        'اولویت‌ها',
        'انتخاب چندگانه'
      ],
      enhancements: ['چندگانه', 'جستجو', 'گروه‌بندی'],
      recommended: false
    },
    {
      type: BaseFieldType.REFERENCE,
      title: 'مرجع',
      subtitle: 'ارجاع به داده‌های دیگر',
      description: 'برای ارجاع به سایر دسته‌بندی‌ها، اطلاعات سلسله‌مراتبی و موارد مشابه',
      icon: ReferenceIcon,
      color: theme.palette.secondary.main,
      examples: ['استان و شهر', 'واحد سازمانی', 'درجه نظامی', 'تجهیزات'],
      useCases: [
        'ارجاع به دسته‌بندی‌ها',
        'ساختار سلسله‌مراتبی',
        'روابط بین داده‌ها',
        'انتخاب پیشرفته'
      ],
      enhancements: ['سلسله‌مراتبی', 'متن آزاد', 'جستجو'],
      recommended: fieldContext.categoryType === 'geographical'
    }
  ];

  // Handle base type selection
  const handleTypeSelect = (type: BaseFieldType) => {
    onConfigUpdate({
      baseType: type,
      // Reset dependent fields
      enhancements: [],
      dataSource: undefined
    });
  };

  // Get usage statistics for context
  const getUsageStats = (type: BaseFieldType): string => {
    const stats: Record<BaseFieldType, string> = {
      [BaseFieldType.TEXT]: '45%',
      [BaseFieldType.NUMBER]: '20%',
      [BaseFieldType.CHOICE]: '25%',
      [BaseFieldType.REFERENCE]: '10%'
    };
    return stats[type];
  };

  return (
    <Box sx={{ 
      py: { xs: 1, sm: 2 }, 
      height: '100%', 
      overflow: 'auto',
      pr: 1,
      '&::-webkit-scrollbar': {
        width: '6px'
      },
      '&::-webkit-scrollbar-track': {
        backgroundColor: 'transparent'
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: alpha(theme.palette.grey[400], 0.5),
        borderRadius: '3px',
        '&:hover': {
          backgroundColor: alpha(theme.palette.grey[500], 0.7)
        }
      }
    }}>
          
      <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 2, sm: 3 }, fontSize: '0.85rem' }}>
        بر اساس نوع اطلاعاتی که می‌خواهید دریافت کنید، یکی از 4 نوع پایه را انتخاب کنید.
        در مرحله بعد می‌توانید ویژگی‌های پیشرفته اضافه کنید.
      </Typography>

      {errors.baseType && (
        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
          {errors.baseType}
        </Typography>
      )}

      <Grid container spacing={{ xs: 1, sm: 1.5 }}>
        {baseTypes.map((type) => {
          const IconComponent = type.icon;
          const isSelected = config.baseType === type.type;
          
          return (
            <Grid item xs={6} sm={3} key={type.type}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: isSelected 
                    ? `2px solid ${type.color}` 
                    : `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  backgroundColor: isSelected 
                    ? alpha(type.color, 0.05) 
                    : 'background.paper',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(type.color, 0.2)}`,
                    borderColor: type.color
                  },
                  '&:focus-visible': {
                    outline: `2px solid ${type.color}`,
                    outlineOffset: '2px'
                  }
                }}
                onClick={() => handleTypeSelect(type.type)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTypeSelect(type.type);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`${type.title} - ${type.description}${isSelected ? ' (انتخاب شده)' : ''}`}
                aria-pressed={isSelected}
              >
                {type.recommended && (
                  <Chip
                    label="پیشنهادی"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: type.color,
                      color: 'white',
                      fontSize: '0.75rem'
                    }}
                  />
                )}

                <CardContent sx={{ p: { xs: 1, sm: 1.5 } }}>
                  {/* Header فشرده */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box
                      sx={{
                        p: 0.5,
                        borderRadius: 1,
                        backgroundColor: alpha(type.color, 0.1),
                        color: type.color,
                        mr: 1
                      }}
                    >
                      <IconComponent sx={{ fontSize: 16 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                        {type.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                        {type.subtitle}
                      </Typography>
                    </Box>
                    {isSelected && (
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          backgroundColor: type.color,
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px'
                        }}
                      >
                        ✓
                      </Box>
                    )}
                  </Box>

                  {/* Description فشرده */}
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ mb: 1, lineHeight: 1.3, fontSize: { xs: '0.7rem', sm: '0.75rem' }, display: { xs: 'none', sm: 'block' } }}
                  >
                    {type.description}
                  </Typography>

                  {/* Use Cases فشرده - فقط در دسکتاپ */}
                  <Box sx={{ mb: 1, display: { xs: 'none', sm: 'block' } }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ fontSize: '0.75rem' }}>
                      موارد استفاده:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.3 }}>
                      {type.useCases.slice(0, 1).map((useCase, index) => (
                        <Chip
                          key={index}
                          label={useCase}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: '0.6rem',
                            height: 16,
                            borderColor: alpha(type.color, 0.3),
                            color: type.color
                          }}
                        />
                      ))}
                    </Box>
                  </Box>

                  {/* Examples - فقط در موبایل */}
                  <Box sx={{ mb: 1, display: { xs: 'block', sm: 'none' } }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      مثال: {type.examples[0]}
                    </Typography>
                  </Box>

                  {/* Examples - در دسکتاپ */}
                  <Box sx={{ mb: 1, display: { xs: 'none', sm: 'block' } }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      مثال‌ها: {type.examples.slice(0, 2).join('، ')}
                    </Typography>
                  </Box>

                  {/* Usage Statistics فشرده */}
                  <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                      استفاده: {getUsageStats(type.type)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>


    </Box>
  );
};

export default BaseTypeStep;