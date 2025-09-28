import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Tooltip,
  IconButton,
  Badge,
  alpha
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Star as StarIcon,
  Visibility as PreviewIcon,
  Add as AddIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

// Types and Data
import type { 
  FieldTemplate, 
  FieldTemplateCategory, 
  TemplateGalleryConfig 
} from '../../types/fieldTemplates';
import { 
  FIELD_TEMPLATES, 
  getTemplatesByCategory, 
  getTemplateById,
  getPopularTemplates,
  searchTemplates 
} from '../../data/fieldTemplates';
import { 
  CATEGORY_ICONS, 
  CATEGORY_LABELS, 
  DIFFICULTY_COLORS, 
  DIFFICULTY_LABELS,
  POPULAR_TEMPLATES 
} from '../../types/fieldTemplates';
import type { FieldConstructorConfig } from '../../types/fieldConstructor';
import {
  TextFields as TextFieldsIcon,
  Numbers as NumbersIcon,
  List as ListIcon,
  Link as LinkIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  FormatListNumbered as ArrayIcon,
  AccountTree as HierarchicalIcon,
  Merge as CompositeIcon,
  Settings as AdvancedIcon,
  Language as LanguageIcon,
  CalendarToday as DateIcon,
  Lock as PasswordIcon,
  Description as TextareaIcon,
  AttachFile as FileIcon,
  ToggleOn as BooleanIcon,
  Help as HelpIcon,
  Apps as AppsIcon
} from '@mui/icons-material';

// Dynamic Icons mapping
const ICON_MAP: Record<string, React.ComponentType> = {
  TextFields: TextFieldsIcon,
  Numbers: NumbersIcon,
  List: ListIcon,
  Link: LinkIcon,
  Email: EmailIcon,
  Phone: PhoneIcon,
  LocationOn: LocationIcon,
  Person: PersonIcon,
  Security: SecurityIcon,
  FormatListNumbered: ArrayIcon,
  AccountTree: HierarchicalIcon,
  Merge: CompositeIcon,
  Settings: AdvancedIcon,
  Language: LanguageIcon,
  CalendarToday: DateIcon,
  Lock: PasswordIcon,
  Description: TextareaIcon,
  AttachFile: FileIcon,
  ToggleOn: BooleanIcon,
  Help: HelpIcon,
  Apps: AppsIcon,
  Star: StarIcon
};

// Dynamic Icons
const DynamicIcon = ({ iconName, ...props }: { iconName: string; [key: string]: any }) => {
  const IconComponent = ICON_MAP[iconName] || HelpIcon;
  return <IconComponent {...props} />;
};

interface FieldTemplateGalleryProps {
  onTemplateSelect: (template: FieldTemplate) => void;
  onCancel: () => void;
  config?: Partial<TemplateGalleryConfig>;
  selectedCategory?: FieldTemplateCategory;
}

const FieldTemplateGallery: React.FC<FieldTemplateGalleryProps> = ({
  onTemplateSelect,
  onCancel,
  config = {},
  selectedCategory
}) => {
  const [activeCategory, setActiveCategory] = useState<FieldTemplateCategory | 'all' | 'popular'>(
    selectedCategory || config.defaultCategory || 'popular'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<FieldTemplate | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  // Gallery configuration with defaults
  const galleryConfig: TemplateGalleryConfig = {
    showCategories: ['basic', 'text', 'validation', 'array', 'hierarchical', 'reference', 'composite', 'specialized'],
    showDifficulty: true,
    showTags: true,
    searchEnabled: true,
    previewEnabled: true,
    ...config
  };

  // Available categories for tabs
  const availableCategories = [
    { id: 'popular', label: 'محبوب', icon: 'Star' },
    { id: 'all', label: 'همه', icon: 'Apps' },
    ...galleryConfig.showCategories.map(cat => ({
      id: cat,
      label: CATEGORY_LABELS[cat],
      icon: CATEGORY_ICONS[cat]
    }))
  ];

  // Filter templates based on current category and search
  const filteredTemplates = useMemo(() => {
    let templates = FIELD_TEMPLATES;

    // Filter by category
    if (activeCategory === 'popular') {
      templates = getPopularTemplates();
    } else if (activeCategory !== 'all') {
      templates = getTemplatesByCategory(activeCategory as string);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      templates = searchTemplates(searchQuery);
    }

    return templates;
  }, [activeCategory, searchQuery]);

  // Handle template selection
  const handleTemplateSelect = (template: FieldTemplate) => {
    // Create a copy of the template config with unique ID
    const configWithId: FieldConstructorConfig = {
      ...template.config,
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: template.name,
      englishName: template.englishName
    };

    onTemplateSelect({
      ...template,
      config: configWithId
    });
  };

  // Handle template preview
  const handlePreview = (template: FieldTemplate) => {
    setPreviewTemplate(template);
    setShowPreviewDialog(true);
  };

  // Render template card
  const renderTemplateCard = (template: FieldTemplate) => {
    const isPopular = POPULAR_TEMPLATES.includes(template.id);
    const difficultyColor = DIFFICULTY_COLORS[template.difficulty];

    return (
      <Grid item xs={12} sm={6} md={4} key={template.id}>
        <Card
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            position: 'relative',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: (theme) => `0 8px 25px ${alpha(theme.palette.primary.main, 0.15)}`
            }
          }}
        >
          {/* Popular Badge */}
          {isPopular && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 1
              }}
            >
              <Chip
                icon={<StarIcon fontSize="small" />}
                label="محبوب"
                size="small"
                color="warning"
                variant="filled"
              />
            </Box>
          )}

          <CardContent sx={{ flexGrow: 1, pt: isPopular ? 4 : 2 }}>
            {/* Template Icon and Title */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: alpha(difficultyColor, 0.1),
                  color: difficultyColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2
                }}
              >
                <DynamicIcon iconName={template.icon} />
              </Box>
              <Box>
                <Typography variant="h6" component="h3" gutterBottom>
                  {template.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {template.englishName}
                </Typography>
              </Box>
            </Box>

            {/* Description */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {template.description}
            </Typography>

            {/* Difficulty and Category */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Chip
                label={DIFFICULTY_LABELS[template.difficulty]}
                size="small"
                sx={{
                  backgroundColor: alpha(difficultyColor, 0.1),
                  color: difficultyColor,
                  fontWeight: 'bold'
                }}
              />
              <Chip
                label={CATEGORY_LABELS[template.category]}
                size="small"
                variant="outlined"
                color="primary"
              />
            </Box>

            {/* Tags */}
            {galleryConfig.showTags && template.tags.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                {template.tags.slice(0, 3).map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="small"
                    variant="outlined"
                    color="default"
                    sx={{ fontSize: '0.7rem' }}
                  />
                ))}
                {template.tags.length > 3 && (
                  <Chip
                    label={`+${template.tags.length - 3}`}
                    size="small"
                    variant="outlined"
                    color="default"
                    sx={{ fontSize: '0.7rem' }}
                  />
                )}
              </Box>
            )}

            {/* Examples */}
            {template.examples.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                  مثال‌ها:
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {template.examples.slice(0, 2).join('، ')}
                  {template.examples.length > 2 && '...'}
                </Typography>
              </Box>
            )}
          </CardContent>

          <CardActions sx={{ p: 2, pt: 0 }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleTemplateSelect(template)}
            >
              انتخاب قالب
            </Button>
            {galleryConfig.previewEnabled && (
              <Tooltip title="پیش‌نمایش">
                <IconButton
                  onClick={() => handlePreview(template)}
                  color="primary"
                >
                  <PreviewIcon />
                </IconButton>
              </Tooltip>
            )}
          </CardActions>
        </Card>
      </Grid>
    );
  };

  return (
    <Box sx={{ width: '100%', height: '70vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            🎨 گالری قالب‌های فیلد
          </Typography>
          <Typography variant="body2" color="text.secondary">
            از قالب‌های آماده برای ایجاد سریع فیلدها استفاده کنید
          </Typography>
        </Box>
        <IconButton onClick={onCancel} color="default">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Search Bar */}
      {galleryConfig.searchEnabled && (
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="جستجو در قالب‌ها..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setSearchQuery('')}
                    edge="end"
                    size="small"
                  >
                    <CloseIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Box>
      )}

      {/* Category Tabs */}
      <Box sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeCategory}
          onChange={(e, newValue) => setActiveCategory(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {availableCategories.map((category) => (
            <Tab
              key={category.id}
              value={category.id}
              label={category.label}
              icon={<DynamicIcon iconName={category.icon} fontSize="small" />}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Box>

      {/* Templates Grid */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', pr: 1 }}>
        {filteredTemplates.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            {searchQuery ? 
              `هیچ قالبی با جستجوی "${searchQuery}" یافت نشد.` :
              'هیچ قالبی در این دسته‌بندی موجود نیست.'
            }
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {filteredTemplates.map(renderTemplateCard)}
          </Grid>
        )}
      </Box>

      {/* Template Preview Dialog */}
      <Dialog
        open={showPreviewDialog}
        onClose={() => setShowPreviewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          پیش‌نمایش قالب: {previewTemplate?.name}
        </DialogTitle>
        <Divider />
        <DialogContent>
          {previewTemplate && (
            <Box>
              {/* Template Info */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  اطلاعات قالب
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>نام:</strong> {previewTemplate.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>نام انگلیسی:</strong> {previewTemplate.englishName}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>دسته‌بندی:</strong> {CATEGORY_LABELS[previewTemplate.category]}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>سطح:</strong> {DIFFICULTY_LABELS[previewTemplate.difficulty]}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>توضیح:</strong> {previewTemplate.description}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Configuration Preview */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  تنظیمات فیلد
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50' }}>
                  <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(previewTemplate.config, null, 2)}
                  </Typography>
                </Paper>
              </Box>

              {/* Examples */}
              {previewTemplate.examples.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    مثال‌های کاربرد
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {previewTemplate.examples.map((example, index) => (
                      <Chip key={index} label={example} variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreviewDialog(false)}>
            بستن
          </Button>
          {previewTemplate && (
            <Button
              variant="contained"
              onClick={() => {
                handleTemplateSelect(previewTemplate);
                setShowPreviewDialog(false);
              }}
              startIcon={<AddIcon />}
            >
              انتخاب قالب
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FieldTemplateGallery;