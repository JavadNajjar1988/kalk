import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  TextField,
  InputAdornment,
  Collapse,
  Divider,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Slider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  AccountTree as AccountTreeIcon,
  Hub as HubIcon,
  ViewList as ViewListIcon,
} from '@mui/icons-material';
import { CategoryType, DefinitionNode, SearchFilters, TreeDisplayMode, ViewMode } from '../../types';
import { IconButton } from '@mui/material';
// import EditIcon from '@mui/icons-material/Edit';
// import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface TreeViewBaseProps {
  categoryType: CategoryType;
  viewMode?: ViewMode;
  treeDisplayMode?: TreeDisplayMode;
  filters?: Partial<SearchFilters>;
  maxLevel?: number; // برای نشان دادن محدوده سطح
  nodes?: DefinitionNode[];
  // levels?: ExtendedHierarchyLevel[];
  loading?: boolean;
  error?: string | null;
  onViewModeChange?: (mode: ViewMode) => void;
  onTreeDisplayModeChange?: (mode: TreeDisplayMode) => void;
  onFiltersChange?: (filters: Partial<SearchFilters>) => void;
  onAdd?: (parentId?: string) => void;
  expandedNodes?: string[];
  onToggleExpand?: (nodeId: string, open: boolean) => void;
}

const TreeViewBase: React.FC<TreeViewBaseProps> = ({
  categoryType,
  viewMode,
  treeDisplayMode,
  filters,
  maxLevel,
  nodes,
  // levels,
  loading,
  error,
  onViewModeChange,
  onTreeDisplayModeChange,
  onFiltersChange,
  onAdd,
  // onEditNode,
  // onDeleteNode,
  expandedNodes,
  onToggleExpand,
}) => {
  // پیش‌فرض‌های داخلی اگر props داده نشود
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>(viewMode || ViewMode.TREE);
  const [internalTreeDisplay, setInternalTreeDisplay] = useState<TreeDisplayMode>(treeDisplayMode || TreeDisplayMode.HIERARCHY);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [query, setQuery] = useState(filters?.query || '');
  const [searchIn, setSearchIn] = useState<SearchFilters['searchIn']>(filters?.searchIn || 'both');
  const [levelRange, setLevelRange] = useState<[number, number]>(filters?.levelRange || [1, maxLevel || 9]);
  const [hasChildren, setHasChildren] = useState<SearchFilters['hasChildren']>(filters?.hasChildren || 'all');
  const [hasCoordinates, setHasCoordinates] = useState<SearchFilters['hasCoordinates']>(filters?.hasCoordinates || 'all');

  const resolvedMaxLevel = useMemo(() => maxLevel || levelRange[1] || 9, [maxLevel, levelRange]);

  // ساخت درخت از لیست
  const nodesByParent = useMemo(() => {
    const map: Record<string, DefinitionNode[]> = {};
    (nodes || []).forEach(n => {
      const pid = n.parentId || 'root';
      if (!map[pid]) map[pid] = [];
      map[pid].push(n);
    });
    Object.keys(map).forEach(pid => {
      map[pid].sort((a, b) => (a.level - b.level) || a.name.localeCompare(b.name, 'fa'));
    });
    return map;
  }, [nodes]);

  // فیلتر کردن بر اساس فیلترها
  const filterNode = (n: DefinitionNode): boolean => {
    const q = query.trim().toLowerCase();
    const matchText = q === '' || (
      (searchIn === 'both' || searchIn === 'name') && n.name.toLowerCase().includes(q)
    ) || (
      (searchIn === 'both' || searchIn === 'description') && (n.description || '').toLowerCase().includes(q)
    );
    const matchLevel = n.level >= levelRange[0] && n.level <= levelRange[1];
    const hasKidsBool = ((n.children?.length ?? 0) > 0);
    const matchChildren = hasChildren === 'all' || (hasChildren === 'with' ? hasKidsBool : !hasKidsBool);
    const hasCoord = n.coordinates != null;
    const matchCoord = hasCoordinates === 'all' || (hasCoordinates === 'with' ? hasCoord : !hasCoord);
    return Boolean(matchText && matchLevel && matchChildren && matchCoord);
  };

  // مدیریت باز/بسته
  const [expanded, setExpanded] = useState<Record<string, boolean | undefined>>({});
  const expandedSet = useMemo(() => new Set(expandedNodes || []), [expandedNodes]);
  const toggle = (id: string) => {
    if (onToggleExpand) {
      const open = expandedSet.has(id) ? false : true;
      onToggleExpand(id, open);
    } else {
      setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    }
  };

  const isNodeOpen = (nodeId: string, hasKids: boolean, depth: number): boolean => {
    if (!hasKids) return false;
    if (expandedNodes) return expandedSet.has(nodeId) || depth < 1;
    const val = expanded[nodeId];
    return typeof val === 'boolean' ? val : depth < 1;
  };

  // رندر بازگشتی
  const renderBranch = (parentId: string | 'root', depth = 0) => {
    const list = nodesByParent[parentId] || [];
    return (
      <>
        {list.filter(filterNode).map(n => {
          const hasKids: boolean = (nodesByParent[n.id] || []).length > 0;
          const isOpen: boolean = isNodeOpen(n.id, hasKids, depth);
          return (
            <Box key={n.id} sx={{ pl: depth * 2, py: 1, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
              {/* دکمه باز/بسته */}
              {hasKids ? (
                <IconButton size="small" onClick={() => toggle(n.id)}>
                  {isOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
              ) : (
                <Box sx={{ width: 32 }} />
              )}

              {/* فقط نام والد/ولد */}
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Typography variant="body2" fontWeight={600}>{n.name}</Typography>
              </Box>

              {/* فقط سطح */}
              <Typography variant="caption" color="text.secondary">سطح {n.level}</Typography>

              {/* شاخه فرزند */}
              {hasKids && isOpen && (
                <Box sx={{ position: 'absolute', left: 0, right: 0, mt: 4 }} />
              )}
            </Box>
          );
        })}
        {list.filter(filterNode).map(n => {
          const hasKids: boolean = (nodesByParent[n.id] || []).length > 0;
          const isOpen: boolean = isNodeOpen(n.id, hasKids, depth);
          return hasKids && isOpen ? (
            <Box key={n.id + '-children'}>
              {renderBranch(n.id, depth + 1)}
            </Box>
          ) : null;
        })}
      </>
    );
  };

  const labelByCategory: Record<CategoryType, string> = {
    geographical: 'منطقه جدید',
    military_ranks: 'درجه جدید',
    unit_structures: 'رده/یگان جدید',
    equipment: 'تجهیز جدید',
    mission_type: 'نوع مأموریت جدید',
    operational_status: 'وضعیت عملیاتی جدید',
    operational_environment: 'محیط عملیاتی جدید',
    time_definitions: 'تعریف زمانی جدید',
    coding_classification: 'کد/طبقه‌بندی جدید',
    force_type: 'نوع نیرو جدید',
    organizational_affiliation: 'وابستگی جدید',
    specialty_training: 'تخصص/آموزش جدید',
    threat_type: 'نوع تهدید جدید',
    info_classification: 'سطح طبقه‌بندی جدید',
    logistics_status: 'وضعیت لجستیکی جدید',
    ammunition: 'مهمات جدید',
    weather: 'تعریف آب‌وهوا جدید',
  } as any;

  const handleViewMode = (_: any, val: ViewMode | null) => {
    if (!val) return;
    if (onViewModeChange) onViewModeChange(val);
    else setInternalViewMode(val);
  };

  const handleTreeDisplay = (_: any, val: TreeDisplayMode | null) => {
    if (!val) return;
    if (onTreeDisplayModeChange) onTreeDisplayModeChange(val);
    else setInternalTreeDisplay(val);
  };

  const propagateFilters = (partial: Partial<SearchFilters>) => {
    if (onFiltersChange) onFiltersChange(partial);
  };

  const currentView = viewMode ?? internalViewMode;
  const currentTreeDisplay = treeDisplayMode ?? internalTreeDisplay;

  // رندر حالت سطحی
  const renderLevelView = () => {
    const levelBuckets = new Map<number, DefinitionNode[]>();
    (nodes || []).filter(filterNode).forEach(n => {
      const bucket = levelBuckets.get(n.level) || [];
      bucket.push(n);
      levelBuckets.set(n.level, bucket);
    });
    const ordered = Array.from(levelBuckets.keys()).sort((a,b) => a-b);
    return (
      <Box>
        {ordered.map(lvl => (
          <Box key={`lvl-${lvl}`} sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>سطح {lvl}</Typography>
            {(levelBuckets.get(lvl) || []).map(n => (
              <Box key={n.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75, borderBottom: '1px dashed rgba(0,0,0,0.04)' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" fontWeight={600}>{n.name}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box>
      {/* Loading & Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">در حال بارگذاری...</Typography>
        </Box>
      )}
      {/* Toolbar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        {/* نمایش: درختی/گرافی */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1">نمایش:</Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={currentView}
            onChange={handleViewMode}
            aria-label="view mode"
          >
            <ToggleButton value={ViewMode.TREE} aria-label="درختی">
              <AccountTreeIcon />
              <Box sx={{ ml: 1 }}>درختی</Box>
            </ToggleButton>
            <ToggleButton value={ViewMode.GRAPH} aria-label="گرافی">
              <HubIcon />
              <Box sx={{ ml: 1 }}>گرافی</Box>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* نحوه نمایش درخت: سلسله‌مراتبی/سطح */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1">نحوه نمایش:</Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={currentTreeDisplay}
            onChange={handleTreeDisplay}
            aria-label="tree display mode"
          >
            <ToggleButton value={TreeDisplayMode.HIERARCHY} aria-label="سلسله‌مراتبی">
              <AccountTreeIcon />
              <Box sx={{ ml: 1 }}>سلسله‌مراتبی</Box>
            </ToggleButton>
            <ToggleButton value={TreeDisplayMode.LEVEL} aria-label="بر اساس سطح">
              <ViewListIcon />
              <Box sx={{ ml: 1 }}>بر اساس سطح</Box>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* افزودن */}
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => onAdd && onAdd()}>
          {labelByCategory[categoryType] || 'افزودن'}
        </Button>
      </Box>

      {/* Search & Advanced Filters */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="جستجو در نام یا توضیحات..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            propagateFilters({ query: e.target.value });
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        <Button variant="outlined" size="small" startIcon={<FilterListIcon />} onClick={() => setShowAdvanced((s) => !s)}>
          فیلترهای پیشرفته
        </Button>
      </Box>

      <Collapse in={showAdvanced} unmountOnExit>
        <Box sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)', mb: 2 }}>
          <Divider />
          {/* جستجو در */}
          <Box sx={{ mt: 2 }}>
            <FormLabel>جستجو در:</FormLabel>
            <RadioGroup row value={searchIn} onChange={(e) => { const v = e.target.value as SearchFilters['searchIn']; setSearchIn(v); propagateFilters({ searchIn: v }); }}>
              <FormControlLabel value="both" control={<Radio size="small" />} label="هر دو" />
              <FormControlLabel value="name" control={<Radio size="small" />} label="فقط نام" />
              <FormControlLabel value="description" control={<Radio size="small" />} label="فقط توضیحات" />
            </RadioGroup>
          </Box>

          {/* محدوده سطح */}
          <Box sx={{ mt: 2 }}>
            <FormLabel>{`محدوده سطح: ${levelRange[0]} تا ${levelRange[1]}`}</FormLabel>
            <Slider
              value={levelRange}
              onChange={(_, val) => {
                const v = val as number[];
                setLevelRange([v[0], v[1]] as [number, number]);
              }}
              onChangeCommitted={(_, val) => propagateFilters({ levelRange: val as [number, number] })}
              valueLabelDisplay="auto"
              min={1}
              step={1}
              max={resolvedMaxLevel}
              marks
            />
          </Box>

          {/* فرزندان */}
          <Box sx={{ mt: 2 }}>
            <FormLabel>فرزندان:</FormLabel>
            <RadioGroup row value={hasChildren} onChange={(e) => { const v = e.target.value as SearchFilters['hasChildren']; setHasChildren(v); propagateFilters({ hasChildren: v }); }}>
              <FormControlLabel value="all" control={<Radio size="small" />} label="همه" />
              <FormControlLabel value="with" control={<Radio size="small" />} label="با فرزند" />
              <FormControlLabel value="without" control={<Radio size="small" />} label="بدون فرزند" />
            </RadioGroup>
          </Box>

          {/* مختصات جغرافیایی */}
          <Box sx={{ mt: 2 }}>
            <FormLabel>مختصات جغرافیایی:</FormLabel>
            <RadioGroup row value={hasCoordinates} onChange={(e) => { const v = e.target.value as SearchFilters['hasCoordinates']; setHasCoordinates(v); propagateFilters({ hasCoordinates: v }); }}>
              <FormControlLabel value="all" control={<Radio size="small" />} label="همه" />
              <FormControlLabel value="with" control={<Radio size="small" />} label="با مختصات جغرافیایی" />
              <FormControlLabel value="without" control={<Radio size="small" />} label="بدون مختصات جغرافیایی" />
            </RadioGroup>
          </Box>
        </Box>
      </Collapse>

      {/* Empty state or content */}
      {(!nodes || nodes.length === 0) ? (
        <Box sx={{ p: 4, borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">داده‌ای برای نمایش وجود ندارد</Typography>
        </Box>
      ) : (
        <Box sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
          {currentTreeDisplay === TreeDisplayMode.HIERARCHY ? renderBranch('root', 0) : renderLevelView()}
        </Box>
      )}
    </Box>
  );
};

export default TreeViewBase;


