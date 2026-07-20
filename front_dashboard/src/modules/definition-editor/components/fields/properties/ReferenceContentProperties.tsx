import { memo, useMemo, useState, useCallback, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  TextField, 
  FormControlLabel, 
  Switch, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormHelperText,
  Autocomplete,
  Chip,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Checkbox
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import HelpTooltip from '../shared/HelpTooltip';
import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';
import { useAvailableReferenceCategories, useReferenceData } from '@/hooks/useReferenceData';

interface Props {
  formData: ExtendedCustomFieldDefinition;
  onChange: (key: keyof ExtendedCustomFieldDefinition, value: any) => void;
  updateRefConfig: (partial: any) => void;
  updateRefDataSource: (partial: any) => void;
  refCfg: NonNullable<ExtendedCustomFieldDefinition['referenceConfig']>;
}

const MAX_NAME = 64;

function sanitizeList(input: string): string[] {
  return (input || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);
}

// Node Browser Component for selecting specific nodes
interface NodeBrowserProps {
  categoryId: string;
  selectedNodeIds: string[];
  onNodeSelectionChange: (nodeIds: string[]) => void;
}

const NodeBrowser: React.FC<NodeBrowserProps> = ({
  categoryId,
  selectedNodeIds,
  onNodeSelectionChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: referenceData, loading } = useReferenceData(categoryId, 'both');

  // Filter nodes based on debounced search term
  const filteredNodes = useMemo(() => {
    if (!referenceData?.items) return [];
    
    if (!debouncedSearchTerm) return referenceData.items;
    
    return referenceData.items.filter(item => 
      item.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      item.englishName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [referenceData?.items, debouncedSearchTerm]);

  // Group nodes by level for better organization
  const nodesByLevel = useMemo(() => {
    const grouped: { [level: number]: Array<{id: string; name: string; description?: string; level?: number}> } = {};
    filteredNodes.forEach(node => {
      const level = node.level || 0;
      if (!grouped[level]) grouped[level] = [];
      grouped[level].push(node);
    });
    return grouped;
  }, [filteredNodes]);

  const handleNodeToggle = useCallback((nodeId: string) => {
    const newSelection = selectedNodeIds.includes(nodeId)
      ? selectedNodeIds.filter(id => id !== nodeId)
      : [...selectedNodeIds, nodeId];
    onNodeSelectionChange(newSelection);
  }, [selectedNodeIds, onNodeSelectionChange]);

  // Remove unused function

  if (loading) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography>در حال بارگذاری نودها...</Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        مرورگر نودها - انتخاب نودهای خاص
      </Typography>
      
      {/* Search */}
      <TextField
        fullWidth
        size="small"
        placeholder="جستجو در نودها..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
              <Typography variant="body2" color="text.secondary">
                🔍
              </Typography>
            </Box>
          ),
        }}
      />

      {/* Selected nodes count */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip 
          label={`${selectedNodeIds.length} نود انتخاب شده`} 
          size="small" 
          color="primary" 
        />
        {selectedNodeIds.length > 0 && (
          <Button
            size="small"
            onClick={() => onNodeSelectionChange([])}
            sx={{ color: 'error.main' }}
          >
            پاک کردن همه
          </Button>
        )}
      </Box>

      {/* Nodes by level */}
      <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
        {Object.entries(nodesByLevel)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([level, nodes]) => (
            <Box key={level} sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                سطح {level} ({nodes.length} نود)
              </Typography>
              {nodes.map(node => (
                <Box
                  key={node.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    borderRadius: 1,
                    bgcolor: selectedNodeIds.includes(node.id) ? 'primary.light' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover' },
                    cursor: 'pointer'
                  }}
                  onClick={() => handleNodeToggle(node.id)}
                >
                  <Checkbox
                    checked={selectedNodeIds.includes(node.id)}
                    size="small"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2">
                      {node.name}
                    </Typography>
                    {node.description && (
                      <Typography variant="caption" color="text.secondary">
                        {node.description}
                      </Typography>
                    )}
                  </Box>
                  <Chip label={node.id} size="small" variant="outlined" />
                </Box>
              ))}
            </Box>
          ))}
      </Box>
    </Paper>
  );
};

const ReferenceContentProperties = memo<Props>(({ updateRefConfig, updateRefDataSource, refCfg }) => {
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('reference-field-expanded-sections');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback to default
      }
    }
    return {
      category: true,
      dataSource: false,
      adminFilter: false,
      displayFields: false
    };
  });

  // Get available categories
  const { categories, loading: categoriesLoading } = useAvailableReferenceCategories();

  const isTable = refCfg.dataSource?.type === 'table';
  const isApi = refCfg.dataSource?.type === 'api';
  const isCategory = refCfg.dataSource?.type === 'category';
  const tableValueField = refCfg.dataSource?.table?.valueField || '';
  const apiValueField = refCfg.dataSource?.api?.valueField || '';
  const tableDisplayFields = (refCfg.dataSource?.table?.displayFields || []).join(',');
  const apiDisplayFields = (refCfg.dataSource?.api?.displayFields || []).join(',');

  // Get selected category info
  const selectedCategory = categories.find(cat => cat.id === refCfg.dataSource?.category?.categoryId);

  const sortBy = isTable ? refCfg.dataSource?.table?.sort?.by : refCfg.dataSource?.api?.sort?.by;
  const sortField = isTable ? refCfg.dataSource?.table?.sort?.field : refCfg.dataSource?.api?.sort?.field;
  const sortFieldError = useMemo(() => {
    if (sortBy === 'custom' && !sortField?.trim()) return 'در حالت سفارشی، فیلد مرتب‌سازی الزامی است';
    return '';
  }, [sortBy, sortField]);

  const apiLazy = !!refCfg.dataSource?.api?.lazy;
  const apiQueryParam = refCfg.dataSource?.api?.queryParam || '';
  const queryParamHelper = useMemo(() => {
    if (isApi && apiLazy && !apiQueryParam.trim()) return "در حالت Lazy بهتر است پارامتر جستجو تعیین شود؛ پیش‌فرض 'q'";
    return '';
  }, [isApi, apiLazy, apiQueryParam]);

  // static items validation with real-time feedback
  const [staticItemsInput, setStaticItemsInput] = useState('');
  const [staticItemsError, setStaticItemsError] = useState('');

  const validateStaticItems = useCallback((input: string) => {
    if (refCfg.dataSource?.type !== 'static') {
      setStaticItemsError('');
      return;
    }

    if (!input.trim()) {
      setStaticItemsError('آیتم‌ها الزامی است');
      return;
    }

    try {
      const items = JSON.parse(input);
      if (!Array.isArray(items)) {
        setStaticItemsError('items باید آرایه باشد');
        return;
      }

      if (items.length === 0) {
        setStaticItemsError('حداقل یک آیتم لازم است');
        return;
      }

      if (items.length > 1000) {
        setStaticItemsError('حداکثر 1000 آیتم مجاز است');
        return;
      }

      for (const it of items) {
        if (typeof it !== 'object' || it == null) {
          setStaticItemsError('هر آیتم باید شیء باشد');
          return;
        }
        if (typeof it.value !== 'string' || typeof it.label !== 'string') {
          setStaticItemsError('value و label باید رشته باشند');
          return;
        }
        if (!it.value.trim() || !it.label.trim()) {
          setStaticItemsError('value و label نمی‌توانند خالی باشند');
          return;
        }
        if (it.value.length > 100 || it.label.length > 200) {
          setStaticItemsError('value حداکثر 100 و label حداکثر 200 کاراکتر');
          return;
        }
      }

      // unique values
      const values = items.map((i: any) => i.value);
      const unique = new Set(values);
      if (unique.size !== values.length) {
        setStaticItemsError('value تکراری در لیست وجود دارد');
        return;
      }

      setStaticItemsError('');
    } catch (error) {
      if (error instanceof SyntaxError) {
        setStaticItemsError('فرمت JSON نامعتبر است: ' + error.message);
      } else {
        setStaticItemsError('خطا در پردازش JSON');
      }
    }
  }, [refCfg.dataSource?.type]);

  // Update static items input when data source changes
  useEffect(() => {
    if (refCfg.dataSource?.type === 'static') {
      const items = refCfg.dataSource?.static?.items || [];
      setStaticItemsInput(JSON.stringify(items, null, 2));
      validateStaticItems(JSON.stringify(items, null, 2));
    } else {
      setStaticItemsInput('');
      setStaticItemsError('');
    }
  }, [refCfg.dataSource?.type, refCfg.dataSource?.static?.items, validateStaticItems]);

  // displayFields empty errors
  const tableDisplayError = useMemo(() => {
    if (!isTable) return '';
    const list = sanitizeList(tableDisplayFields);
    if (list.length === 0) return 'حداقل یک فیلد نمایشی لازم است';
    return '';
  }, [isTable, tableDisplayFields]);

  const apiDisplayError = useMemo(() => {
    if (!isApi) return '';
    const list = sanitizeList(apiDisplayFields);
    if (list.length === 0) return 'حداقل یک فیلد نمایشی لازم است';
    return '';
  }, [isApi, apiDisplayFields]);

  // Enhanced input validation
  const valueFieldError = useMemo(() => {
    if (isTable && !tableValueField.trim()) return 'valueField الزامی است';
    if (isApi && !apiValueField.trim()) return 'valueField الزامی است';
    if (tableValueField.length > MAX_NAME || apiValueField.length > MAX_NAME) return `حداکثر ${MAX_NAME} کاراکتر`;
    
    // Validate field names (no special characters)
    const fieldNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (isTable && tableValueField && !fieldNameRegex.test(tableValueField)) {
      return 'نام فیلد باید با حرف یا _ شروع شود و فقط شامل حروف، اعداد و _ باشد';
    }
    if (isApi && apiValueField && !fieldNameRegex.test(apiValueField)) {
      return 'نام فیلد باید با حرف یا _ شروع شود و فقط شامل حروف، اعداد و _ باشد';
    }
    
    return '';
  }, [isTable, isApi, tableValueField, apiValueField]);

  // Table name validation
  const tableNameError = useMemo(() => {
    if (!isTable) return '';
    const tableName = refCfg.dataSource?.table?.tableName || '';
    if (!tableName.trim()) return 'نام جدول الزامی است';
    if (tableName.length > MAX_NAME) return `حداکثر ${MAX_NAME} کاراکتر`;
    
    const tableNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (tableName && !tableNameRegex.test(tableName)) {
      return 'نام جدول باید با حرف یا _ شروع شود و فقط شامل حروف، اعداد و _ باشد';
    }
    
    return '';
  }, [isTable, refCfg.dataSource?.table?.tableName]);

  // API endpoint validation
  const apiEndpointError = useMemo(() => {
    if (!isApi) return '';
    const endpoint = refCfg.dataSource?.api?.endpoint || '';
    if (!endpoint.trim()) return 'Endpoint الزامی است';
    
    try {
      new URL(endpoint);
      return '';
    } catch {
      return 'فرمت URL نامعتبر است';
    }
  }, [isApi, refCfg.dataSource?.api?.endpoint]);

  const handleSectionToggle = useCallback((section: string) => {
    setExpandedSections(prev => {
      const newState = {
        ...prev,
        [section]: !prev[section]
      };
      // Save to localStorage
      localStorage.setItem('reference-field-expanded-sections', JSON.stringify(newState));
      return newState;
    });
  }, []);

  return (
    <Box>
      {/* Category Selection */}
      <Accordion 
        expanded={expandedSections.category} 
        onChange={() => handleSectionToggle('category')}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            🗂️ انتخاب دسته‌بندی مرجع
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <FormControl fullWidth>
              <InputLabel>منبع داده</InputLabel>
              <Select
                label="منبع داده"
                value={refCfg.dataSource?.type || ''}
                onChange={(e) => updateRefDataSource({ type: e.target.value })}
              >
                    <MenuItem value={'category'}>دسته‌بندی موجود (18 دسته‌بندی)</MenuItem>
                <MenuItem value={'static'}>لیست ثابت (Static List)</MenuItem>
                <MenuItem value={'table'}>جدول داخلی (Database Table)</MenuItem>
                <MenuItem value={'api'}>API خارجی</MenuItem>
              </Select>
            </FormControl>
                <HelpTooltip title="منبع داده" description="نوع منبع تأمین داده‌های مرجع" example="Category برای دسته‌بندی‌های موجود، Static برای لیست محدود، Table برای جداول داخلی، API برای سرویس بیرونی" />
          </Box>
        </Grid>

            {/* Category Selection */}
            {isCategory && (
              <Grid item xs={12}>
                <Autocomplete
                  options={categories}
                  getOptionLabel={(option) => `${option.icon} ${option.name}`}
                  value={selectedCategory || null}
                  onChange={(_, newValue) => {
                    updateRefDataSource({ 
                      category: { 
                        categoryId: newValue?.id || '',
                        sections: refCfg.dataSource?.category?.sections || 'both'
                      } 
                    });
                  }}
                  loading={categoriesLoading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="انتخاب دسته‌بندی"
                      placeholder="جستجو در دسته‌بندی‌ها..."
                      helperText="یکی از 18 دسته‌بندی موجود در ویرایشگر تعاریف را انتخاب کنید"
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Typography sx={{ fontSize: '1.2rem' }}>{option.icon}</Typography>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1">{option.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.description}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {option.hasHierarchy && <Chip label="سلسله‌مراتبی" size="small" color="primary" />}
                          {option.hasData && <Chip label="داده" size="small" color="secondary" />}
                        </Box>
                      </Box>
                    </Box>
                  )}
                />
              </Grid>
            )}

            {/* Category Sections Selection */}
            {isCategory && selectedCategory && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>بخش‌های قابل نمایش</InputLabel>
                  <Select
                    label="بخش‌های قابل نمایش"
                    value={refCfg.dataSource?.category?.sections || 'both'}
                    onChange={(e) => updateRefDataSource({ 
                      category: { 
                        ...refCfg.dataSource?.category,
                        sections: e.target.value 
                      } 
                    })}
                  >
                    <MenuItem value="hierarchy">فقط سطوح سلسله‌مراتبی</MenuItem>
                    <MenuItem value="data">فقط داده‌ها</MenuItem>
                    <MenuItem value="both">هر دو بخش</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Category Info Display */}
            {isCategory && selectedCategory && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    اطلاعات دسته‌بندی انتخاب شده:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip 
                      label={`${selectedCategory.icon} ${selectedCategory.name}`} 
                      size="small" 
                      color="primary" 
                    />
                    <Chip 
                      label={`${selectedCategory.maxLevels} سطح`} 
                      size="small" 
                      variant="outlined" 
                    />
                    {selectedCategory.hasHierarchy && (
                      <Chip 
                        label="سلسله‌مراتبی" 
                        size="small" 
                        color="secondary" 
                      />
                    )}
                    {selectedCategory.hasData && (
                      <Chip 
                        label="داده" 
                        size="small" 
                        color="secondary" 
                      />
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                    {selectedCategory.description}
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Data Source Configuration */}
      <Accordion 
        expanded={expandedSections.dataSource} 
        onChange={() => handleSectionToggle('dataSource')}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            ⚙️ پیکربندی منبع داده
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>

        {/* Static items */}
        {refCfg.dataSource?.type === 'static' && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                label="آیتم‌ها (JSON)"
                placeholder='[{"value":"1","label":"گزینه 1"}]'
                value={staticItemsInput}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setStaticItemsInput(newValue);
                  
                  // Debounce validation to avoid too many updates
                  const timeoutId = setTimeout(() => {
                    validateStaticItems(newValue);
                    
                    // Only update if valid
                    if (!staticItemsError) {
                      try {
                        const parsed = JSON.parse(newValue || '[]');
                        updateRefDataSource({ static: { items: parsed } });
                      } catch {
                        // Ignore parsing errors during typing
                      }
                    }
                  }, 500);
                  
                  return () => clearTimeout(timeoutId);
                }}
                multiline
                minRows={3}
                error={!!staticItemsError}
                helperText={staticItemsError || 'فرمت صحیح: [{"value":"1","label":"گزینه 1"}]'}
                inputProps={{
                  'aria-invalid': !!staticItemsError,
                  'aria-describedby': staticItemsError ? 'static-items-error' : undefined
                }}
              />
              <HelpTooltip title="لیست ثابت" description="فهرست آیتم‌ها به صورت JSON" example='[{"value":"IR","label":"ایران"}]' />
            </Box>
          </Grid>
        )}

        {/* Table config */}
        {refCfg.dataSource?.type === 'table' && (
          <>
            <Grid item xs={12} md={6}>
              <TextField 
                fullWidth 
                label="نام جدول" 
                value={refCfg.dataSource?.table?.tableName || ''} 
                onChange={(e) => updateRefDataSource({ table: { ...(refCfg.dataSource?.table || {}), tableName: e.target.value.slice(0, MAX_NAME) } })}
                error={!!tableNameError}
                helperText={tableNameError || 'نام جدول در دیتابیس'}
                inputProps={{ 'aria-invalid': !!tableNameError }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="کلید مرجع (Value Field)" value={tableValueField} onChange={(e) => updateRefDataSource({ table: { ...(refCfg.dataSource?.table || {}), valueField: e.target.value.slice(0, MAX_NAME) } })} error={!!valueFieldError} helperText={valueFieldError} inputProps={{ 'aria-invalid': !!valueFieldError }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="فیلدهای نمایشی (با کاما جدا کنید)" value={tableDisplayFields} onChange={(e) => updateRefDataSource({ table: { ...(refCfg.dataSource?.table || {}), displayFields: sanitizeList(e.target.value) } })} placeholder="name,code" error={!!tableDisplayError} helperText={tableDisplayError || ''} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="فیلتر پیش‌فرض منبع (JSON)" placeholder='[{"field":"active","op":"eq","value":true}]' value={JSON.stringify(refCfg.dataSource?.table?.defaultFilter || [], null, 0)} onChange={(e) => { try { const parsed = JSON.parse(e.target.value || '[]'); updateRefDataSource({ table: { ...(refCfg.dataSource?.table || {}), defaultFilter: parsed } }); } catch {} }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControl fullWidth error={!!(isTable && sortFieldError)}>
                  <InputLabel>مرتب‌سازی نتایج</InputLabel>
                  <Select label="مرتب‌سازی نتایج" value={refCfg.dataSource?.table?.sort?.by || 'alphabetical'} onChange={(e) => updateRefDataSource({ table: { ...(refCfg.dataSource?.table || {}), sort: { ...(refCfg.dataSource?.table?.sort || {}), by: e.target.value } } })}>
                    <MenuItem value={'alphabetical'}>الفبایی</MenuItem>
                    <MenuItem value={'priority'}>بر اساس اولویت</MenuItem>
                    <MenuItem value={'custom'}>سفارشی</MenuItem>
                  </Select>
                  {!!(isTable && sortFieldError) && <FormHelperText>{sortFieldError}</FormHelperText>}
                </FormControl>
                <HelpTooltip 
                  title="مرتب‌سازی نتایج" 
                  description="نحوه مرتب‌سازی آیتم‌های نمایش داده شده" 
                  example="alphabetical: بر اساس فیلدهای نمایشی، priority: بر اساس فیلد اولویت، custom: بر اساس فیلد مشخص‌شده" 
                />
              </Box>
            </Grid>
            {refCfg.dataSource?.table?.sort?.by === 'custom' && (
              <>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TextField fullWidth label="فیلد مرتب‌سازی" value={refCfg.dataSource?.table?.sort?.field || ''} onChange={(e) => updateRefDataSource({ table: { ...(refCfg.dataSource?.table || {}), sort: { ...(refCfg.dataSource?.table?.sort || {}), field: e.target.value } } })} placeholder="priority" error={!!sortFieldError} helperText={sortFieldError} inputProps={{ 'aria-invalid': !!sortFieldError }} />
                    <HelpTooltip 
                      title="فیلد مرتب‌سازی سفارشی" 
                      description="نام ستون جدول که بر اساس آن مرتب‌سازی انجام می‌شود" 
                      example="باید یکی از ستون‌های جدول باشد، مثلاً: priority, order, created_at" 
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>جهت</InputLabel>
                    <Select label="جهت" value={refCfg.dataSource?.table?.sort?.direction || 'asc'} onChange={(e) => updateRefDataSource({ table: { ...(refCfg.dataSource?.table || {}), sort: { ...(refCfg.dataSource?.table?.sort || {}), direction: e.target.value } } })}>
                      <MenuItem value={'asc'}>صعودی</MenuItem>
                      <MenuItem value={'desc'}>نزولی</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
          </>
        )}

        {/* API config */}
        {refCfg.dataSource?.type === 'api' && (
          <>
            <Grid item xs={12} md={8}>
              <TextField 
                fullWidth 
                label="Endpoint" 
                value={refCfg.dataSource?.api?.endpoint || ''} 
                onChange={(e) => updateRefDataSource({ api: { ...(refCfg.dataSource?.api || {}), endpoint: e.target.value } })}
                placeholder="https://.../search"
                error={!!apiEndpointError}
                helperText={apiEndpointError || 'آدرس API برای دریافت داده‌ها'}
                inputProps={{ 'aria-invalid': !!apiEndpointError }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Method</InputLabel>
                <Select label="Method" value={refCfg.dataSource?.api?.method || 'GET'} onChange={(e) => updateRefDataSource({ api: { ...(refCfg.dataSource?.api || {}), method: e.target.value } })}>
                  <MenuItem value={'GET'}>GET</MenuItem>
                  <MenuItem value={'POST'}>POST</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="کلید مرجع (Value Field)" value={apiValueField} onChange={(e) => updateRefDataSource({ api: { ...(refCfg.dataSource?.api || {}), valueField: e.target.value.slice(0, MAX_NAME) } })} error={!!valueFieldError} helperText={valueFieldError} inputProps={{ 'aria-invalid': !!valueFieldError }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="فیلدهای نمایشی (با کاما)" value={apiDisplayFields} onChange={(e) => updateRefDataSource({ api: { ...(refCfg.dataSource?.api || {}), displayFields: sanitizeList(e.target.value) } })} placeholder="name,code" error={!!apiDisplayError} helperText={apiDisplayError || ''} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="پارامتر جستجو (Query Param)" value={apiQueryParam} onChange={(e) => updateRefDataSource({ api: { ...(refCfg.dataSource?.api || {}), queryParam: e.target.value || (apiLazy ? 'q' : '') } })} placeholder="q" helperText={queryParamHelper} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel control={<Switch checked={!!refCfg.dataSource?.api?.lazy} onChange={(e) => updateRefDataSource({ api: { ...(refCfg.dataSource?.api || {}), lazy: e.target.checked, queryParam: (refCfg.dataSource?.api?.queryParam || 'q') } })} />} label="Lazy Loading" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="فیلتر پیش‌فرض منبع (JSON)" placeholder='[{"field":"active","op":"eq","value":true}]' value={JSON.stringify(refCfg.dataSource?.api?.defaultFilter || [], null, 0)} onChange={(e) => { try { const parsed = JSON.parse(e.target.value || '[]'); updateRefDataSource({ api: { ...(refCfg.dataSource?.api || {}), defaultFilter: parsed } }); } catch {} }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControl fullWidth error={!!(isApi && sortFieldError)}>
                  <InputLabel>مرتب‌سازی نتایج</InputLabel>
                  <Select label="مرتب‌سازی نتایج" value={refCfg.dataSource?.api?.sort?.by || 'alphabetical'} onChange={(e) => updateRefDataSource({ api: { ...(refCfg.dataSource?.api || {}), sort: { ...(refCfg.dataSource?.api?.sort || {}), by: e.target.value } } })}>
                    <MenuItem value={'alphabetical'}>الفبایی</MenuItem>
                    <MenuItem value={'priority'}>بر اساس اولویت</MenuItem>
                    <MenuItem value={'custom'}>سفارشی</MenuItem>
                  </Select>
                  {!!(isApi && sortFieldError) && <FormHelperText>{sortFieldError}</FormHelperText>}
                </FormControl>
                <HelpTooltip 
                  title="مرتب‌سازی نتایج API" 
                  description="نحوه مرتب‌سازی آیتم‌های دریافتی از API" 
                  example="alphabetical: بر اساس فیلدهای نمایشی، priority: بر اساس فیلد اولویت، custom: بر اساس فیلد مشخص‌شده در پاسخ API" 
                />
              </Box>
            </Grid>
            {refCfg.dataSource?.api?.sort?.by === 'custom' && (
              <>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TextField fullWidth label="فیلد مرتب‌سازی" value={refCfg.dataSource?.api?.sort?.field || ''} onChange={(e) => updateRefDataSource({ api: { ...(refCfg.dataSource?.api || {}), sort: { ...(refCfg.dataSource?.api?.sort || {}), field: e.target.value } } })} placeholder="priority" error={!!sortFieldError} helperText={sortFieldError} inputProps={{ 'aria-invalid': !!sortFieldError }} />
                    <HelpTooltip 
                      title="فیلد مرتب‌سازی سفارشی API" 
                      description="نام فیلد در پاسخ API که بر اساس آن مرتب‌سازی انجام می‌شود" 
                      example="باید یکی از فیلدهای موجود در پاسخ API باشد، مثلاً: priority, order, created_at" 
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>جهت</InputLabel>
                    <Select label="جهت" value={refCfg.dataSource?.api?.sort?.direction || 'asc'} onChange={(e) => updateRefDataSource({ api: { ...(refCfg.dataSource?.api || {}), sort: { ...(refCfg.dataSource?.api?.sort || {}), direction: e.target.value } } })}>
                      <MenuItem value={'asc'}>صعودی</MenuItem>
                      <MenuItem value={'desc'}>نزولی</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
          </>
        )}

          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Admin Filter Configuration */}
      <Accordion 
        expanded={expandedSections.adminFilter} 
        onChange={() => handleSectionToggle('adminFilter')}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            🔍 فیلتر ادمین
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {/* Level-based Filtering */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                محدودسازی بر اساس سطح:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!refCfg.adminFilter?.levelLimit?.enabled}
                        onChange={(e) => updateRefConfig({
                          adminFilter: {
                            ...refCfg.adminFilter,
                            levelLimit: {
                              ...refCfg.adminFilter?.levelLimit,
                              enabled: e.target.checked
                            }
                          }
                        })}
                      />
                    }
                    label="محدود کردن بر اساس سطح"
                  />
                </Grid>
                {refCfg.adminFilter?.levelLimit?.enabled && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="حداکثر سطح"
                      value={refCfg.adminFilter?.levelLimit?.maxLevel || 3}
                      onChange={(e) => updateRefConfig({
                        adminFilter: {
                          ...refCfg.adminFilter,
                          levelLimit: {
                            ...refCfg.adminFilter?.levelLimit,
                            maxLevel: parseInt(e.target.value) || 3
                          }
                        }
                      })}
                      helperText="فقط نودهای تا این سطح نمایش داده می‌شوند"
                    />
                  </Grid>
                )}
              </Grid>
            </Grid>

            {/* Specific Node Selection */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                انتخاب نودهای خاص:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!refCfg.adminFilter?.specificNodes?.enabled}
                        onChange={(e) => updateRefConfig({
                          adminFilter: {
                            ...refCfg.adminFilter,
                            specificNodes: {
                              ...refCfg.adminFilter?.specificNodes,
                              enabled: e.target.checked
                            }
                          }
                        })}
                      />
                    }
                    label="انتخاب نودهای خاص"
                  />
                </Grid>
                {refCfg.adminFilter?.specificNodes?.enabled && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="شناسه‌های نودها (با کاما جدا کنید)"
                      value={(refCfg.adminFilter?.specificNodes?.nodeIds || []).join(',')}
                      onChange={(e) => updateRefConfig({
                        adminFilter: {
                          ...refCfg.adminFilter,
                          specificNodes: {
                            ...refCfg.adminFilter?.specificNodes,
                            nodeIds: e.target.value.split(',').map(id => id.trim()).filter(Boolean)
                          }
                        }
                      })}
                      placeholder="node1,node2,node3"
                      helperText="فقط این نودها به کاربر نمایش داده می‌شوند"
                    />
                  </Grid>
                )}
              </Grid>
              
              {/* Node Browser for Category Selection */}
              {refCfg.adminFilter?.specificNodes?.enabled && isCategory && selectedCategory && (
                <Grid item xs={12}>
                  <NodeBrowser
                    categoryId={refCfg.dataSource?.category?.categoryId || ''}
                    selectedNodeIds={refCfg.adminFilter?.specificNodes?.nodeIds || []}
                    onNodeSelectionChange={(nodeIds) => updateRefConfig({
                      adminFilter: {
                        ...refCfg.adminFilter,
                        specificNodes: {
                          ...refCfg.adminFilter?.specificNodes,
                          nodeIds
                        }
                      }
                    })}
                  />
                </Grid>
              )}
            </Grid>

            {/* Category-based Filtering */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                فیلتر بر اساس دسته‌بندی:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!refCfg.adminFilter?.categoryFilter?.enabled}
                        onChange={(e) => updateRefConfig({
                          adminFilter: {
                            ...refCfg.adminFilter,
                            categoryFilter: {
                              ...refCfg.adminFilter?.categoryFilter,
                              enabled: e.target.checked
                            }
                          }
                        })}
                      />
                    }
                    label="فیلتر بر اساس دسته‌بندی"
                  />
                </Grid>
                {refCfg.adminFilter?.categoryFilter?.enabled && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="دسته‌بندی‌های مجاز (با کاما جدا کنید)"
                      value={(refCfg.adminFilter?.categoryFilter?.allowedCategories || []).join(',')}
                      onChange={(e) => updateRefConfig({
                        adminFilter: {
                          ...refCfg.adminFilter,
                          categoryFilter: {
                            ...refCfg.adminFilter?.categoryFilter,
                            allowedCategories: e.target.value.split(',').map(cat => cat.trim()).filter(Boolean)
                          }
                        }
                      })}
                      placeholder="military,civilian,government"
                      helperText="فقط نودهای این دسته‌بندی‌ها نمایش داده می‌شوند"
                    />
                  </Grid>
                )}
              </Grid>
            </Grid>

            {/* Advanced JSON Filter */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                فیلتر پیشرفته (JSON):
              </Typography>
              <TextField
                fullWidth
                label="فیلتر پیشرفته (JSON)"
                placeholder='[{"field":"active","op":"eq","value":true}]'
                value={JSON.stringify(refCfg.adminFilter?.advancedFilter || [], null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value || '[]');
                    updateRefConfig({
                      adminFilter: {
                        ...refCfg.adminFilter,
                        advancedFilter: parsed
                      }
                    });
                  } catch {
                    // Ignore invalid JSON while typing
                  }
                }}
                multiline
                minRows={3}
                helperText="فیلترهای پیشرفته برای موارد خاص"
              />
            </Grid>

            {/* Filter Examples */}
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                مثال‌های فیلتر:
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip 
                  label="فقط 3 سطح اول" 
                  size="small" 
                  onClick={() => updateRefConfig({
                    adminFilter: {
                      ...refCfg.adminFilter,
                      levelLimit: { enabled: true, maxLevel: 3 }
                    }
                  })}
                  sx={{ cursor: 'pointer' }}
                />
                <Chip 
                  label="نودهای خاص" 
                  size="small" 
                  onClick={() => updateRefConfig({
                    adminFilter: {
                      ...refCfg.adminFilter,
                      specificNodes: { enabled: true, nodeIds: ['node1', 'node2'] }
                    }
                  })}
                  sx={{ cursor: 'pointer' }}
                />
                <Chip 
                  label="فقط نظامی" 
                  size="small" 
                  onClick={() => updateRefConfig({
                    adminFilter: {
                      ...refCfg.adminFilter,
                      categoryFilter: { enabled: true, allowedCategories: ['military'] }
                    }
                  })}
                  sx={{ cursor: 'pointer' }}
                />
                <Chip 
                  label="فقط فعال‌ها" 
                  size="small" 
                  onClick={() => updateRefConfig({
                    adminFilter: {
                      ...refCfg.adminFilter,
                      advancedFilter: [{ field: 'active', op: 'eq', value: true }]
                    }
                  })}
                  sx={{ cursor: 'pointer' }}
                />
                <Chip 
                  label="پاک کردن همه" 
                  size="small" 
                  onClick={() => updateRefConfig({ adminFilter: {} })}
                  sx={{ cursor: 'pointer', color: 'error.main' }}
                />
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Display Fields Configuration */}
      <Accordion 
        expanded={expandedSections.displayFields} 
        onChange={() => handleSectionToggle('displayFields')}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            🎨 فیلدهای نمایشی
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="فیلدهای قابل نمایش (با کاما جدا کنید)"
                value={(refCfg.displayFields || []).join(',')}
                onChange={(e) => updateRefConfig({ displayFields: sanitizeList(e.target.value) })}
                placeholder="name,code,description"
                helperText="فیلدهایی که کاربر می‌تواند ببیند و جستجو کند"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="فیلد اصلی نمایش"
                value={refCfg.primaryDisplayField || ''}
                onChange={(e) => updateRefConfig({ primaryDisplayField: e.target.value })}
                placeholder="name"
                helperText="فیلدی که به عنوان برچسب اصلی نمایش داده می‌شود"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="فیلد جستجو"
                value={refCfg.searchFields || ''}
                onChange={(e) => updateRefConfig({ searchFields: e.target.value })}
                placeholder="name,englishName,description"
                helperText="فیلدهایی که در جستجو استفاده می‌شوند"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel 
                control={
                  <Switch 
                    checked={!!refCfg.showDescription} 
                    onChange={(e) => updateRefConfig({ showDescription: e.target.checked })} 
                  />
                } 
                label="نمایش توضیحات" 
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Selection Configuration */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          ⚙️ تنظیمات انتخاب
        </Typography>
        <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
            <FormControlLabel 
              control={
                <Switch 
                  checked={!!refCfg.selection?.multiple} 
                  onChange={(e) => updateRefConfig({ 
                    selection: { 
                      ...refCfg.selection,
                      multiple: e.target.checked 
                    } 
                  })} 
                />
              } 
              label="چندانتخابی" 
            />
        </Grid>
        <Grid item xs={12} md={6}>
            <FormControlLabel 
              control={
                <Switch 
                  checked={!!refCfg.behavior?.allowCustomEntry} 
                  onChange={(e) => updateRefConfig({ 
                    behavior: { 
                      ...refCfg.behavior,
                      allowCustomEntry: e.target.checked 
                    } 
                  })} 
                />
              } 
              label="اجازه ایجاد گزینه جدید توسط کاربر" 
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
});

ReferenceContentProperties.displayName = 'ReferenceContentProperties';
export default ReferenceContentProperties;


