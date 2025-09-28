import React, { useState, useCallback, useMemo } from 'react';
import {
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Switch, 
  Chip, 
  alpha,
  useTheme,
  Tabs,
  Tab,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton
} from '@mui/material';
import {
  Star as RecommendedIcon,
  Info as InfoIcon,
  Security as ValidationIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { 
  SmartFieldConfig, 
  FieldContext, 
  EnhancementType, 
  FieldEnhancement,
  ValidationRule 
} from '../../../types/smartFieldTypes';

// Import validation and enhancement components
import ValidationRuleBuilder from '../../validation/ValidationRuleBuilder';

// Import enhancement configuration components
import CompositeFieldConfig from '../../enhancements/CompositeFieldConfig';
import RangeConfig from '../../enhancements/RangeConfig';
import UnitConfig from '../../enhancements/UnitConfig';
import DecimalConfig from '../../enhancements/DecimalConfig';
import MultilineConfig from '../../enhancements/MultilineConfig';
import SearchableConfig from '../../enhancements/SearchableConfig';
import GroupedConfig from '../../enhancements/GroupedConfig';
import HierarchicalConfig from '../../enhancements/HierarchicalConfig';
import FreeTextConfig from '../../enhancements/FreeTextConfig';
import SearchableRefConfig from '../../enhancements/SearchableRefConfig';
import SingleConfig from '../../enhancements/SingleConfig';

interface EnhancementsStepProps {
  config: Partial<SmartFieldConfig>;
  onConfigUpdate: (updates: Partial<SmartFieldConfig>) => void;
  fieldContext: FieldContext;
  errors: Record<string, string>;
  editingField?: SmartFieldConfig | null;
}

const EnhancementsStep: React.FC<EnhancementsStepProps> = ({
  config,
  onConfigUpdate,
  fieldContext,
  errors,
  editingField
}) => {
  const theme = useTheme();
  const [expandedEnhancements, setExpandedEnhancements] = useState<Set<EnhancementType>>(new Set());
  const [currentTab, setCurrentTab] = useState(0);
  const [showCompositeConfig, setShowCompositeConfig] = useState(false);
  const [showRangeConfig, setShowRangeConfig] = useState(false);
  const [showUnitConfig, setShowUnitConfig] = useState(false);
  const [showDecimalConfig, setShowDecimalConfig] = useState(false);
  const [showMultilineConfig, setShowMultilineConfig] = useState(false);
  const [showSearchableConfig, setShowSearchableConfig] = useState(false);
  const [showGroupedConfig, setShowGroupedConfig] = useState(false);
  const [showHierarchicalConfig, setShowHierarchicalConfig] = useState(false);
  const [showFreeTextConfig, setShowFreeTextConfig] = useState(false);
  const [showSearchableRefConfig, setShowSearchableRefConfig] = useState(false);
  const [showSingleConfig, setShowSingleConfig] = useState(false);
  const [compositeConfig, setCompositeConfig] = useState({
    parts: [{ id: 'part1', label: 'بخش اول', type: 'text', required: true }],
    separator: ' ',
    displayFormat: ''
  });

  // Handle validation rules change
  const handleValidationRulesChange = useCallback((rules: ValidationRule[]) => {
    onConfigUpdate({
      validation: rules
    });
  }, [onConfigUpdate]);

  // Advanced Context-Aware Enhancement System
  const getContextAwareEnhancements = () => {
    const baseType = config.baseType;
    const category = fieldContext.categoryType;
    const existingFields = fieldContext.existingFields || [];

    const allEnhancements = [
      {
        enhancement: EnhancementType.MULTILINE,
        title: 'چندخطی',
        description: 'متن بلند و چندخطی برای توضیحات',
        icon: '📝',
        relevanceScore: calculateRelevanceScore(EnhancementType.MULTILINE, baseType, category),
        contextReason: getContextReason(EnhancementType.MULTILINE, baseType, category)
      },

      {
        enhancement: EnhancementType.COMPOSITE,
        title: 'ترکیبی',
        description: 'فیلد ترکیبی از چندین بخش (نام + نام خانوادگی)',
        icon: '🔗',
        relevanceScore: calculateRelevanceScore(EnhancementType.COMPOSITE, baseType, category),
        contextReason: getContextReason(EnhancementType.COMPOSITE, baseType, category)
      },
      {
        enhancement: EnhancementType.RANGE,
        title: 'محدوده',
        description: 'تعریف حداقل و حداکثر مقدار',
        icon: '📊',
        relevanceScore: calculateRelevanceScore(EnhancementType.RANGE, baseType, category),
        contextReason: getContextReason(EnhancementType.RANGE, baseType, category)
      },
      {
        enhancement: EnhancementType.UNIT,
        title: 'واحد',
        description: 'نمایش واحد اندازه‌گیری (کیلوگرم، متر)',
        icon: '📏',
        relevanceScore: calculateRelevanceScore(EnhancementType.UNIT, baseType, category),
        contextReason: getContextReason(EnhancementType.UNIT, baseType, category)
      },
      {
        enhancement: EnhancementType.DECIMAL,
        title: 'اعشاری',
        description: 'پشتیبانی از اعداد اعشاری',
        icon: '🔢',
        relevanceScore: calculateRelevanceScore(EnhancementType.DECIMAL, baseType, category),
        contextReason: getContextReason(EnhancementType.DECIMAL, baseType, category)
      },
      {
        enhancement: EnhancementType.SINGLE,
        title: 'انتخاب تکی',
        description: 'انتخاب یک گزینه از میان گزینه‌ها',
        icon: '📋',
        relevanceScore: calculateRelevanceScore(EnhancementType.SINGLE, baseType, category),
        contextReason: getContextReason(EnhancementType.SINGLE, baseType, category)
      },
      {
        enhancement: EnhancementType.MULTIPLE,
        title: 'انتخاب چندگانه',
        description: 'امکان انتخاب چند گزینه همزمان',
        icon: '☑️',
        relevanceScore: calculateRelevanceScore(EnhancementType.MULTIPLE, baseType, category),
        contextReason: getContextReason(EnhancementType.MULTIPLE, baseType, category)
      },
      {
        enhancement: EnhancementType.SEARCHABLE,
        title: 'جستجوپذیر',
        description: 'قابلیت جستجو در لیست گزینه‌ها',
        icon: '🔍',
        relevanceScore: calculateRelevanceScore(EnhancementType.SEARCHABLE, baseType, category),
        contextReason: getContextReason(EnhancementType.SEARCHABLE, baseType, category)
      },
      {
        enhancement: EnhancementType.GROUPED,
        title: 'گروه‌بندی شده',
        description: 'نمایش گزینه‌ها در گروه‌های منطقی',
        icon: '📂',
        relevanceScore: calculateRelevanceScore(EnhancementType.GROUPED, baseType, category),
        contextReason: getContextReason(EnhancementType.GROUPED, baseType, category)
      },
      {
        enhancement: EnhancementType.HIERARCHICAL,
        title: 'سلسله‌مراتبی',
        description: 'ساختار درختی برای انتخاب',
        icon: '🌳',
        relevanceScore: calculateRelevanceScore(EnhancementType.HIERARCHICAL, baseType, category),
        contextReason: getContextReason(EnhancementType.HIERARCHICAL, baseType, category)
      },
      {
        enhancement: EnhancementType.FREE_TEXT,
        title: 'متن آزاد',
        description: 'امکان ورود متن دلخواه علاوه بر انتخاب',
        icon: '✏️',
        relevanceScore: calculateRelevanceScore(EnhancementType.FREE_TEXT, baseType, category),
        contextReason: getContextReason(EnhancementType.FREE_TEXT, baseType, category)
      },
      {
        enhancement: EnhancementType.SEARCHABLE_REF,
        title: 'مرجع جستجوپذیر',
        description: 'جستجوی پیشرفته در داده‌های مرجع',
        icon: '🔎',
        relevanceScore: calculateRelevanceScore(EnhancementType.SEARCHABLE_REF, baseType, category),
        contextReason: getContextReason(EnhancementType.SEARCHABLE_REF, baseType, category)
      }
    ];

    return allEnhancements
      .filter(e => e.relevanceScore > 20)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  };

  // Calculate relevance score based on context
  const calculateRelevanceScore = (enhancement: EnhancementType, baseType?: string, category?: string): number => {
    let score = 30; // Base score

    // Base type compatibility
    switch (enhancement) {
      case EnhancementType.MULTILINE:
      case EnhancementType.COMPOSITE:
        score = baseType === 'text' ? 85 : 15;
        break;
      case EnhancementType.RANGE:
      case EnhancementType.UNIT:
      case EnhancementType.DECIMAL:
        score = baseType === 'number' ? 85 : 15;
        break;
      case EnhancementType.SINGLE:
      case EnhancementType.MULTIPLE:
      case EnhancementType.SEARCHABLE:
      case EnhancementType.GROUPED:
        score = baseType === 'choice' ? 80 : 20;
        break;
      case EnhancementType.HIERARCHICAL:
      case EnhancementType.FREE_TEXT:
      case EnhancementType.SEARCHABLE_REF:
        score = baseType === 'reference' ? 85 : 15;
        break;
    }

    // Category-specific boosts
    if (category) {
      switch (category) {
        case 'personnel':
        case 'personal':
          if (enhancement === EnhancementType.COMPOSITE) score += 10; // For full names
          if (enhancement === EnhancementType.MULTILINE) score += 8; // For descriptions
          break;
        case 'equipment':
        case 'logistics':
          if (enhancement === EnhancementType.UNIT) score += 15; // For quantities
          if (enhancement === EnhancementType.HIERARCHICAL) score += 10; // For categories
          if (enhancement === EnhancementType.SEARCHABLE) score += 10; // For large lists
          break;
        case 'geographical':
          if (enhancement === EnhancementType.HIERARCHICAL) score += 20; // Province > City
          if (enhancement === EnhancementType.SEARCHABLE) score += 15; // Search cities
          break;
        case 'military':
          if (enhancement === EnhancementType.HIERARCHICAL) score += 15; // Rank hierarchy
          if (enhancement === EnhancementType.GROUPED) score += 10; // Group by branch
          break;
      }
    }

    return Math.min(score, 100);
  };

  // Get context-aware explanation
  const getContextReason = (enhancement: EnhancementType, baseType?: string, category?: string): string => {
    const baseReasons: Record<EnhancementType, string> = {
      [EnhancementType.MULTILINE]: 'برای متون بلند مانند توضیحات و یادداشت‌ها',
      [EnhancementType.COMPOSITE]: 'برای فیلدهای ترکیبی مانند نام کامل',
      [EnhancementType.RANGE]: 'برای محدود کردن مقادیر عددی',
      [EnhancementType.UNIT]: 'برای نمایش واحدهای اندازه‌گیری',
      [EnhancementType.DECIMAL]: 'برای اعداد اعشاری و دقیق',
      [EnhancementType.SINGLE]: 'برای انتخاب یک گزینه از میان گزینه‌ها',
      [EnhancementType.MULTIPLE]: 'برای انتخاب چندین گزینه همزمان',
      [EnhancementType.SEARCHABLE]: 'برای لیست‌های طولانی',
      [EnhancementType.GROUPED]: 'برای سازماندهی گزینه‌ها',
      [EnhancementType.HIERARCHICAL]: 'برای ساختارهای درختی',
      [EnhancementType.FREE_TEXT]: 'برای انعطاف بیشتر در ورودی',
      [EnhancementType.SEARCHABLE_REF]: 'برای جستجوی پیشرفته در مراجع'
    };

    let reason = baseReasons[enhancement];

    // Add category-specific context
    if (category) {
      switch (category) {
        case 'personnel':
        case 'personal':
          if (enhancement === EnhancementType.COMPOSITE) reason += ' (مانند نام و نام خانوادگی)';
          if (enhancement === EnhancementType.MULTILINE) reason += ' (برای توضیحات بلند)';
          break;
        case 'equipment':
        case 'logistics':
          if (enhancement === EnhancementType.UNIT) reason += ' (وزن، طول، حجم)';
          if (enhancement === EnhancementType.HIERARCHICAL) reason += ' (دسته‌بندی تجهیزات)';
          break;
        case 'geographical':
          if (enhancement === EnhancementType.HIERARCHICAL) reason += ' (استان، شهر، منطقه)';
          break;
        case 'military':
          if (enhancement === EnhancementType.HIERARCHICAL) reason += ' (رتبه‌بندی نظامی)';
          break;
      }
    }

    return reason;
  };

  const availableEnhancements = getContextAwareEnhancements();
  const currentEnhancements = config.enhancements || [];

  // Check if enhancement is enabled
  const isEnhancementEnabled = (enhancementType: EnhancementType): boolean => {
    return currentEnhancements.some(e => e.type === enhancementType && e.enabled);
  };

  // Toggle enhancement
  const toggleEnhancement = (enhancementType: EnhancementType, enabled: boolean) => {
    let newEnhancements: FieldEnhancement[];
    
    if (enabled) {
      // Add enhancement if not already present
      const existingEnhancement = currentEnhancements.find(e => e.type === enhancementType);
      if (existingEnhancement) {
        // Update existing enhancement
        newEnhancements = currentEnhancements.map(e => 
          e.type === enhancementType ? { ...e, enabled: true } : e
        );
      } else {
        // Add new enhancement with empty config
        newEnhancements = [
          ...currentEnhancements,
          {
            type: enhancementType,
            config: {},
            enabled: true
          }
        ];
      }
      
      // Show configuration dialog for specific enhancements
      if (enhancementType === EnhancementType.COMPOSITE) {
        setShowCompositeConfig(true);
      } else if (enhancementType === EnhancementType.RANGE) {
        setShowRangeConfig(true);
      } else if (enhancementType === EnhancementType.UNIT) {
        setShowUnitConfig(true);
      } else if (enhancementType === EnhancementType.DECIMAL) {
        setShowDecimalConfig(true);
      } else if (enhancementType === EnhancementType.MULTILINE) {
        setShowMultilineConfig(true);
      } else if (enhancementType === EnhancementType.SEARCHABLE) {
        setShowSearchableConfig(true);
      } else if (enhancementType === EnhancementType.GROUPED) {
        setShowGroupedConfig(true);
      } else if (enhancementType === EnhancementType.HIERARCHICAL) {
        setShowHierarchicalConfig(true);
      } else if (enhancementType === EnhancementType.FREE_TEXT) {
        setShowFreeTextConfig(true);
      } else if (enhancementType === EnhancementType.SEARCHABLE_REF) {
        setShowSearchableRefConfig(true);
      } else if (enhancementType === EnhancementType.SINGLE) {
        setShowSingleConfig(true);
      }
    } else {
      // Disable enhancement
      newEnhancements = currentEnhancements.map(e => 
        e.type === enhancementType ? { ...e, enabled: false } : e
      );
    }
    
    onConfigUpdate({ enhancements: newEnhancements });
  };

  // Handle composite config save
  const handleCompositeConfigSave = (config: any) => {
    const newEnhancements = currentEnhancements.map(e => 
      e.type === EnhancementType.COMPOSITE 
        ? { ...e, config, enabled: true }
        : e
    );
    onConfigUpdate({ enhancements: newEnhancements });
  };

  // Handle range config save
  const handleRangeConfigSave = (config: any) => {
    const newEnhancements = currentEnhancements.map(e => 
      e.type === EnhancementType.RANGE 
        ? { ...e, config, enabled: true }
        : e
    );
    onConfigUpdate({ enhancements: newEnhancements });
  };

  // Handle unit config save
  const handleUnitConfigSave = (config: any) => {
    const newEnhancements = currentEnhancements.map(e => 
      e.type === EnhancementType.UNIT 
        ? { ...e, config, enabled: true }
        : e
    );
    onConfigUpdate({ enhancements: newEnhancements });
  };

  // Handle decimal config save
  const handleDecimalConfigSave = (config: any) => {
    const newEnhancements = currentEnhancements.map(e => 
      e.type === EnhancementType.DECIMAL 
        ? { ...e, config, enabled: true }
        : e
    );
    onConfigUpdate({ enhancements: newEnhancements });
  };

  // Handle multiline config save
  const handleMultilineConfigSave = (config: any) => {
    const newEnhancements = currentEnhancements.map(e => 
      e.type === EnhancementType.MULTILINE 
        ? { ...e, config, enabled: true }
        : e
    );
    onConfigUpdate({ enhancements: newEnhancements });
  };

  // Handle searchable config save
  const handleSearchableConfigSave = (config: any) => {
    const newEnhancements = currentEnhancements.map(e => 
      e.type === EnhancementType.SEARCHABLE 
        ? { ...e, config, enabled: true }
        : e
    );
    onConfigUpdate({ enhancements: newEnhancements });
  };

  // Handle grouped config save
  const handleGroupedConfigSave = (config: any) => {
    const newEnhancements = currentEnhancements.map(e => 
      e.type === EnhancementType.GROUPED 
        ? { ...e, config, enabled: true }
        : e
    );
    onConfigUpdate({ enhancements: newEnhancements });
  };

  // Handle hierarchical config save
  const handleHierarchicalConfigSave = (config: any) => {
    const newEnhancements = currentEnhancements.map(e => 
      e.type === EnhancementType.HIERARCHICAL 
        ? { ...e, config, enabled: true }
        : e
    );
    onConfigUpdate({ enhancements: newEnhancements });
  };

  // Handle free text config save
  const handleFreeTextConfigSave = (config: any) => {
    const newEnhancements = currentEnhancements.map(e => 
      e.type === EnhancementType.FREE_TEXT 
        ? { ...e, config, enabled: true }
        : e
    );
    onConfigUpdate({ enhancements: newEnhancements });
  };

  // Handle searchable ref config save
  const handleSearchableRefConfigSave = (config: any) => {
    const newEnhancements = currentEnhancements.map(e => 
      e.type === EnhancementType.SEARCHABLE_REF 
        ? { ...e, config, enabled: true }
        : e
    );
    onConfigUpdate({ enhancements: newEnhancements });
  };

  // Handle single config save
  const handleSingleConfigSave = (config: any) => {
    const newEnhancements = currentEnhancements.map(e => 
      e.type === EnhancementType.SINGLE 
        ? { ...e, config, enabled: true }
        : e
    );
    onConfigUpdate({ enhancements: newEnhancements });
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
        ویژگی‌های اضافی و قوانین اعتبارسنجی مورد نظر را تعریف کنید
      </Typography>

      {/* Tab Navigation */}
      <Tabs 
        value={currentTab} 
        onChange={(_, newValue) => setCurrentTab(newValue)}
        sx={{ 
          mb: 2,
          borderBottom: 1, 
          borderColor: 'divider',
          '& .MuiTab-root': {
            minHeight: 40,
            fontSize: { xs: '0.8rem', sm: '0.9rem' },
            fontWeight: 500,
            textTransform: 'none',
            px: { xs: 1, sm: 2 },
            mx: 0.5
          },
          '& .MuiTabs-indicator': {
            height: 2
          }
        }}
      >
        <Tab label="ویژگی‌های هوشمند" />
        <Tab 
          label="قوانین اعتبارسنجی" 
          icon={<ValidationIcon />} 
          iconPosition="start"
        />
      </Tabs>

      {/* Tab Content */}
      {currentTab === 0 && (
        <Box>
      {/* Enhancement Cards */}
      <Grid container spacing={1.5}>
        {availableEnhancements.map((enhancement) => {
          const isEnabled = isEnhancementEnabled(enhancement.enhancement);
          
          return (
            <Grid item xs={6} sm={4} key={enhancement.enhancement}>
              <Card
                sx={{
                  border: isEnabled 
                    ? `2px solid ${theme.palette.primary.main}` 
                    : `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  backgroundColor: isEnabled 
                    ? alpha(theme.palette.primary.main, 0.05) 
                    : 'background.paper',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CardContent sx={{ p: 1.5 }}>
                  {/* Enhancement Header */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mr: 1, fontSize: { xs: '0.8rem', sm: '0.9rem' }}}>
                          {enhancement.icon} {enhancement.title}
                        </Typography>
                        {enhancement.relevanceScore > 80 && (
                          <Chip 
                            size="small" 
                            label="پیشنهادی" 
                            color="primary" 
                            icon={<RecommendedIcon />}
                            sx={{ fontSize: '0.6rem', height: 16 }}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: { xs: '0.75rem', sm: '0.8rem' }, lineHeight: 1.3 }}>
                        {enhancement.description}
                      </Typography>
                      
                      {/* Context-aware reasoning */}
                      {enhancement.relevanceScore > 70 && (
                        <Typography variant="caption" color="primary.main" sx={{ display: 'block', mt: 0.5, fontSize: { xs: '0.65rem', sm: '0.7rem' } }}>
                          💡 {enhancement.contextReason}
                        </Typography>
                      )}
                    </Box>
                    
                    <Switch
                      checked={isEnabled}
                      onChange={(e) => toggleEnhancement(enhancement.enhancement, e.target.checked)}
                      color="primary"
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    {/* دکمه تنظیمات برای فیلد ترکیبی */}
                    {enhancement.enhancement === EnhancementType.COMPOSITE && isEnabled && (
                      <IconButton
                        size="small"
                        onClick={() => setShowCompositeConfig(true)}
                        sx={{ ml: 1 }}
                      >
                        <SettingsIcon fontSize="small" />
                      </IconButton>
                    )}
                    {/* دکمه تنظیمات برای فیلد محدوده */}
                    {enhancement.enhancement === EnhancementType.RANGE && isEnabled && (
                      <IconButton
                        size="small"
                        onClick={() => setShowRangeConfig(true)}
                        sx={{ ml: 1 }}
                      >
                        <SettingsIcon fontSize="small" />
                      </IconButton>
                    )}
                    {/* دکمه تنظیمات برای فیلد واحد */}
                    {enhancement.enhancement === EnhancementType.UNIT && isEnabled && (
                      <IconButton
                        size="small"
                        onClick={() => setShowUnitConfig(true)}
                        sx={{ ml: 1 }}
                      >
                        <SettingsIcon fontSize="small" />
                      </IconButton>
                    )}
                    {/* دکمه تنظیمات برای فیلد اعشاری */}
                    {enhancement.enhancement === EnhancementType.DECIMAL && isEnabled && (
                      <IconButton
                        size="small"
                        onClick={() => setShowDecimalConfig(true)}
                        sx={{ ml: 1 }}
                      >
                        <SettingsIcon fontSize="small" />
                      </IconButton>
                    )}
                    {/* دکمه تنظیمات برای فیلد چندخطی */}
                    {enhancement.enhancement === EnhancementType.MULTILINE && isEnabled && (
                      <IconButton
                        size="small"
                        onClick={() => setShowMultilineConfig(true)}
                        sx={{ ml: 1 }}
                      >
                        <SettingsIcon fontSize="small" />
                      </IconButton>
                    )}
                    {/* دکمه تنظیمات برای فیلد جستجوپذیر */}
                    {enhancement.enhancement === EnhancementType.SEARCHABLE && isEnabled && (
                      <IconButton
                        size="small"
                        onClick={() => setShowSearchableConfig(true)}
                        sx={{ ml: 1 }}
                      >
                        <SettingsIcon fontSize="small" />
                      </IconButton>
                    )}
                    {/* دکمه تنظیمات برای فیلد گروه‌بندی شده */}
                    {enhancement.enhancement === EnhancementType.GROUPED && isEnabled && (
                      <IconButton
                        size="small"
                        onClick={() => setShowGroupedConfig(true)}
                        sx={{ ml: 1 }}
                      >
                        <SettingsIcon fontSize="small" />
                      </IconButton>
                    )}
                    {/* دکمه تنظیمات برای فیلد سلسله‌مراتبی */}
                    {enhancement.enhancement === EnhancementType.HIERARCHICAL && isEnabled && (
                      <IconButton
                        size="small"
                        onClick={() => setShowHierarchicalConfig(true)}
                        sx={{ ml: 1 }}
                      >
                        <SettingsIcon fontSize="small" />
                      </IconButton>
                    )}
                    {/* دکمه تنظیمات برای فیلد متن آزاد */}
                    {enhancement.enhancement === EnhancementType.FREE_TEXT && isEnabled && (
                      <IconButton
                        size="small"
                        onClick={() => setShowFreeTextConfig(true)}
                        sx={{ ml: 1 }}
                      >
                        <SettingsIcon fontSize="small" />
                      </IconButton>
                    )}
                    {/* دکمه تنظیمات برای فیلد مرجع جستجوپذیر */}
                    {enhancement.enhancement === EnhancementType.SEARCHABLE_REF && isEnabled && (
                      <IconButton
                        size="small"
                        onClick={() => setShowSearchableRefConfig(true)}
                        sx={{ ml: 1 }}
                      >
                        <SettingsIcon fontSize="small" />
                      </IconButton>
                    )}
                    {/* دکمه تنظیمات برای فیلد انتخاب تکی */}
                    {enhancement.enhancement === EnhancementType.SINGLE && isEnabled && (
                      <IconButton
                        size="small"
                        onClick={() => setShowSingleConfig(true)}
                        sx={{ ml: 1 }}
                      >
                        <SettingsIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Summary */}
      {currentEnhancements.length > 0 && (
        <Box
          sx={{
            mt: 3,
            p: 2,
            backgroundColor: alpha(theme.palette.success.main, 0.1),
            borderRadius: 1,
            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
          }}
        >
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            <InfoIcon sx={{ mr: 1, fontSize: 16 }} />
            ویژگی‌های انتخاب شده
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {currentEnhancements.map((enhancement) => (
              <Chip
                key={enhancement.type}
                label={availableEnhancements.find(e => e.enhancement === enhancement.type)?.title || enhancement.type}
                size="small"
                color="success"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      )}


        </Box>
      )}

      {/* Validation Rules Tab */}
      {currentTab === 1 && (
        <ValidationRuleBuilder
          fieldConfig={config}
          rules={config.validation || []}
          onRulesChange={handleValidationRulesChange}
          existingFields={fieldContext.existingFields}
        />
      )}
      
      {/* دیالوگ کانفیگ فیلد ترکیبی */}
      <CompositeFieldConfig
        open={showCompositeConfig}
        onClose={() => setShowCompositeConfig(false)}
        onSave={handleCompositeConfigSave}
        initialConfig={currentEnhancements.find(e => e.type === EnhancementType.COMPOSITE)?.config as any}
      />
      
      {/* دیالوگ کانفیگ محدوده عددی */}
      <RangeConfig
        open={showRangeConfig}
        onClose={() => setShowRangeConfig(false)}
        onSave={handleRangeConfigSave}
        initialConfig={{
          min: undefined,
          max: undefined,
          step: 1,
          showSlider: true,
          allowDecimals: false,
          ...(currentEnhancements.find(e => e.type === EnhancementType.RANGE)?.config || {})
        }}
      />
      
      {/* دیالوگ کانفیگ واحد اندازه‌گیری */}
      <UnitConfig
        open={showUnitConfig}
        onClose={() => setShowUnitConfig(false)}
        onSave={handleUnitConfigSave}
        initialConfig={{
          unit: '',
          display: 'after',
          customUnits: [],
          ...(currentEnhancements.find(e => e.type === EnhancementType.UNIT)?.config || {})
        }}
      />
      
      {/* دیالوگ کانفیگ اعداد اعشاری */}
      <DecimalConfig
        open={showDecimalConfig}
        onClose={() => setShowDecimalConfig(false)}
        onSave={handleDecimalConfigSave}
        initialConfig={{
          places: 2,
          separator: '.',
          thousandsSeparator: ',',
          allowNegative: true,
          displayLeadingZeros: false,
          ...(currentEnhancements.find(e => e.type === EnhancementType.DECIMAL)?.config || {})
        }}
      />
      
      {/* دیالوگ کانفیگ فیلد چندخطی */}
      <MultilineConfig
        open={showMultilineConfig}
        onClose={() => setShowMultilineConfig(false)}
        onSave={handleMultilineConfigSave}
        initialConfig={{
          rows: 3,
          maxRows: 6,
          autoResize: true,
          ...(currentEnhancements.find(e => e.type === EnhancementType.MULTILINE)?.config || {})
        }}
      />
      
      {/* دیالوگ کانفیگ فیلد جستجوپذیر */}
      <SearchableConfig
        open={showSearchableConfig}
        onClose={() => setShowSearchableConfig(false)}
        onSave={handleSearchableConfigSave}
        initialConfig={{
          minChars: 2,
          maxSuggestions: 10,
          caseSensitive: false,
          showPreview: true,
          highlightMatches: true,
          ...(currentEnhancements.find(e => e.type === EnhancementType.SEARCHABLE)?.config || {})
        }}
      />
      
      {/* دیالوگ کانفیگ فیلد گروه‌بندی شده */}
      <GroupedConfig
        open={showGroupedConfig}
        onClose={() => setShowGroupedConfig(false)}
        onSave={handleGroupedConfigSave}
        availableOptions={config.dataSource?.config.items?.map(item => item.label) || ['گزینه ۱', 'گزینه ۲', 'گزینه ۳', 'گزینه ۴', 'گزینه ۵']}
        initialConfig={{
          groups: [],
          showGroupHeaders: true,
          allowUngrouped: true,
          groupSortOrder: 'alphabetical',
          ...(currentEnhancements.find(e => e.type === EnhancementType.GROUPED)?.config || {})
        }}
      />
      
      {/* دیالوگ کانفیگ فیلد سلسله‌مراتبی */}
      <HierarchicalConfig
        open={showHierarchicalConfig}
        onClose={() => setShowHierarchicalConfig(false)}
        onSave={handleHierarchicalConfigSave}
        initialConfig={{
          maxDepth: 5,
          showFullPath: true,
          allowRootSelection: false,
          expandOnLoad: false,
          showCount: true,
          lazyLoad: true,
          ...(currentEnhancements.find(e => e.type === EnhancementType.HIERARCHICAL)?.config || {})
        }}
      />
      
      {/* دیالوگ کانفیگ فیلد متن آزاد */}
      <FreeTextConfig
        open={showFreeTextConfig}
        onClose={() => setShowFreeTextConfig(false)}
        onSave={handleFreeTextConfigSave}
        initialConfig={{
          minLength: undefined,
          maxLength: undefined,
          placeholder: '',
          showSuggestions: true,
          suggestionLimit: 5,
          allowOnlySuggestions: false,
          ...(currentEnhancements.find(e => e.type === EnhancementType.FREE_TEXT)?.config || {})
        }}
      />
      
      {/* دیالوگ کانفیگ فیلد مرجع جستجوپذیر */}
      <SearchableRefConfig
        open={showSearchableRefConfig}
        onClose={() => setShowSearchableRefConfig(false)}
        onSave={handleSearchableRefConfigSave}
        initialConfig={{
          minChars: 2,
          maxSuggestions: 10,
          searchFields: ['name', 'code'],
          caseSensitive: false,
          highlightMatches: true,
          showFullPathInResults: false,
          ...(currentEnhancements.find(e => e.type === EnhancementType.SEARCHABLE_REF)?.config || {})
        }}
      />
      
      {/* دیالوگ کانفیگ فیلد انتخاب تکی */}
      <SingleConfig
        open={showSingleConfig}
        onClose={() => setShowSingleConfig(false)}
        onSave={handleSingleConfigSave}
        initialConfig={{
          displayStyle: 'dropdown',
          showIcons: false,
          compact: false,
          ...(currentEnhancements.find(e => e.type === EnhancementType.SINGLE)?.config || {})
        }}
      />
    </Box>
  );
};

export default EnhancementsStep;