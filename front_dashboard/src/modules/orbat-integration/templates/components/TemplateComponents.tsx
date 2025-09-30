import React, { useState, useCallback, useMemo } from 'react';
import { styled } from '@mui/material/styles';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Typography,
  Button,
  IconButton,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Paper,
  Grid,
  Stack,
  LinearProgress,
  CircularProgress,
  Alert,
  Skeleton,
  Tooltip,
  Badge,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Delete,
  Share,
  Download,
  Visibility,
  VisibilityOff,
  Star,
  StarBorder,
  Refresh,
  FilterList,
  Sort,
  Search,
  Add,
  Remove,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Info,
  Close
} from '@mui/icons-material';

// Base template interfaces
export interface BaseTemplateProps {
  loading?: boolean;
  error?: string;
  className?: string;
  sx?: any;
}

export interface ActionItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'success';
}

export interface StatusBadge {
  label: string;
  color: 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  variant?: 'filled' | 'outlined';
}

// Data Card Template
export interface DataCardProps extends BaseTemplateProps {
  title: string;
  subtitle?: string;
  description?: string;
  avatar?: React.ReactNode;
  image?: string;
  actions?: ActionItem[];
  badges?: StatusBadge[];
  stats?: Array<{ label: string; value: string | number; icon?: React.ReactNode }>;
  children?: React.ReactNode;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  favorite?: boolean;
  onFavoriteToggle?: (favorite: boolean) => void;
}

const StyledDataCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: theme.transitions.create(['elevation', 'transform'], {
    duration: theme.transitions.duration.short,
  }),
  '&:hover': {
    elevation: 4,
    transform: 'translateY(-2px)',
  },
}));

export const DataCardTemplate: React.FC<DataCardProps> = ({
  title,
  subtitle,
  description,
  avatar,
  image,
  actions = [],
  badges = [],
  stats = [],
  children,
  loading = false,
  error,
  onClick,
  onEdit,
  onDelete,
  favorite = false,
  onFavoriteToggle,
  sx,
  ...props
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteToggle?.(!favorite);
  }, [favorite, onFavoriteToggle]);

  if (loading) {
    return (
      <StyledDataCard sx={sx} {...props}>
        <CardHeader
          avatar={<Skeleton variant="circular" width={40} height={40} />}
          title={<Skeleton variant="text" width="60%" />}
          subheader={<Skeleton variant="text" width="40%" />}
        />
        <CardContent>
          <Skeleton variant="text" />
          <Skeleton variant="text" />
          <Skeleton variant="rectangular" height={100} sx={{ mt: 1 }} />
        </CardContent>
      </StyledDataCard>
    );
  }

  if (error) {
    return (
      <StyledDataCard sx={sx} {...props}>
        <CardContent>
          <Alert severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </CardContent>
      </StyledDataCard>
    );
  }

  return (
    <StyledDataCard sx={sx} onClick={onClick} {...props}>
      <CardHeader
        avatar={avatar}
        title={title}
        subheader={subtitle}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {badges.map((badge, index) => (
              <Chip
                key={index}
                label={badge.label}
                color={badge.color}
                variant={badge.variant || 'filled'}
                size="small"
              />
            ))}
            
            {onFavoriteToggle && (
              <IconButton onClick={handleFavoriteClick}>
                {favorite ? <Star color="warning" /> : <StarBorder />}
              </IconButton>
            )}
            
            {(actions.length > 0 || onEdit || onDelete) && (
              <IconButton>
                <MoreVert />
              </IconButton>
            )}
          </Box>
        }
      />
      
      {image && (
        <Box
          component="img"
          src={image}
          alt={title}
          sx={{ height: 140, objectFit: 'cover' }}
        />
      )}
      
      <CardContent sx={{ flexGrow: 1 }}>
        {description && (
          <Typography variant="body2" color="text.secondary" paragraph>
            {description}
          </Typography>
        )}
        
        {stats.length > 0 && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {stats.map((stat, index) => (
              <Grid item xs={4} key={index}>
                <Box sx={{ textAlign: 'center' }}>
                  {stat.icon && (
                    <Box sx={{ mb: 0.5, color: 'primary.main' }}>
                      {stat.icon}
                    </Box>
                  )}
                  <Typography variant="h6" component="div">
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
        
        {children}
      </CardContent>
      
      {actions.length > 0 && (
        <CardActions>
          {actions.map((action) => (
            <Button
              key={action.id}
              size="small"
              color={action.color || 'primary'}
              startIcon={action.icon}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.label}
            </Button>
          ))}
        </CardActions>
      )}
    </StyledDataCard>
  );
};

// List Template
export interface ListItemData {
  id: string;
  primary: string;
  secondary?: string;
  icon?: React.ReactNode;
  avatar?: React.ReactNode;
  badge?: StatusBadge;
  actions?: ActionItem[];
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
}

export interface ListTemplateProps extends BaseTemplateProps {
  items: ListItemData[];
  title?: string;
  subtitle?: string;
  dense?: boolean;
  selectable?: boolean;
  multiSelect?: boolean;
  selectedItems?: string[];
  onSelectionChange?: (selected: string[]) => void;
  onItemClick?: (item: ListItemData) => void;
  emptyMessage?: string;
  maxHeight?: number;
  searchable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
}

export const ListTemplate: React.FC<ListTemplateProps> = ({
  items,
  title,
  subtitle,
  dense = false,
  selectable = false,
  multiSelect = false,
  selectedItems = [],
  onSelectionChange,
  onItemClick,
  emptyMessage = 'No items to display',
  maxHeight,
  searchable = false,
  sortable = false,
  filterable = false,
  loading = false,
  error,
  sx,
  ...props
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter and sort items
  const processedItems = useMemo(() => {
    let filtered = items;
    
    if (searchTerm) {
      filtered = items.filter(item =>
        item.primary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.secondary?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (sortable) {
      filtered.sort((a, b) => {
        const comparison = a.primary.localeCompare(b.primary);
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }
    
    return filtered;
  }, [items, searchTerm, sortOrder, sortable]);

  const handleItemClick = useCallback((item: ListItemData) => {
    if (selectable) {
      let newSelection = [...selectedItems];
      
      if (multiSelect) {
        if (selectedItems.includes(item.id)) {
          newSelection = selectedItems.filter(id => id !== item.id);
        } else {
          newSelection.push(item.id);
        }
      } else {
        newSelection = [item.id];
      }
      
      onSelectionChange?.(newSelection);
    }
    
    onItemClick?.(item);
    item.onClick?.();
  }, [selectable, multiSelect, selectedItems, onSelectionChange, onItemClick]);

  if (loading) {
    return (
      <Paper sx={{ p: 2, ...sx }} {...props}>
        {title && <Skeleton variant="text" width="40%" height={32} />}
        <List dense={dense}>
          {Array.from({ length: 5 }).map((_, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <Skeleton variant="circular" width={24} height={24} />
              </ListItemIcon>
              <ListItemText
                primary={<Skeleton variant="text" width="60%" />}
                secondary={<Skeleton variant="text" width="40%" />}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 2, ...sx }} {...props}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ ...sx }} {...props}>
      {(title || searchable || sortable || filterable) && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          {title && (
            <Typography variant="h6" component="div">
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          
          {(searchable || sortable || filterable) && (
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              {searchable && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Search />
                  <input
                    type="text"
                    placeholder="جستجو..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ border: 'none', outline: 'none', flex: 1 }}
                  />
                </Box>
              )}
              
              {sortable && (
                <IconButton
                  onClick={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
                  size="small"
                >
                  <Sort />
                </IconButton>
              )}
              
              {filterable && (
                <IconButton size="small">
                  <FilterList />
                </IconButton>
              )}
            </Stack>
          )}
        </Box>
      )}
      
      <List 
        dense={dense}
        sx={{ 
          maxHeight, 
          overflow: 'auto',
          ...(processedItems.length === 0 && { p: 2 })
        }}
      >
        {processedItems.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center">
            {emptyMessage}
          </Typography>
        ) : (
          processedItems.map((item) => (
            <ListItem
              key={item.id}
              button
              selected={selectedItems.includes(item.id)}
              disabled={item.disabled}
              onClick={() => handleItemClick(item)}
            >
              {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
              {item.avatar && <ListItemIcon>{item.avatar}</ListItemIcon>}
              
              <ListItemText
                primary={item.primary}
                secondary={item.secondary}
              />
              
              {item.badge && (
                <Chip
                  label={item.badge.label}
                  color={item.badge.color}
                  variant={item.badge.variant || 'filled'}
                  size="small"
                  sx={{ mr: 1 }}
                />
              )}
              
              {item.actions && item.actions.length > 0 && (
                <ListItemSecondaryAction>
                  {item.actions.map((action) => (
                    <IconButton
                      key={action.id}
                      edge="end"
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick();
                      }}
                      disabled={action.disabled}
                      size="small"
                    >
                      {action.icon}
                    </IconButton>
                  ))}
                </ListItemSecondaryAction>
              )}
            </ListItem>
          ))
        )}
      </List>
    </Paper>
  );
};

// Status Panel Template
export interface StatusItem {
  id: string;
  label: string;
  value: string | number;
  status: 'success' | 'warning' | 'error' | 'info' | 'default';
  icon?: React.ReactNode;
  description?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
}

export interface StatusPanelProps extends BaseTemplateProps {
  title?: string;
  items: StatusItem[];
  layout?: 'grid' | 'list';
  columns?: number;
  compact?: boolean;
  refreshable?: boolean;
  onRefresh?: () => void;
}

export const StatusPanelTemplate: React.FC<StatusPanelProps> = ({
  title,
  items,
  layout = 'grid',
  columns = 3,
  compact = false,
  refreshable = false,
  onRefresh,
  loading = false,
  error,
  sx,
  ...props
}) => {
  const getStatusColor = (status: StatusItem['status']) => {
    switch (status) {
      case 'success': return 'success.main';
      case 'warning': return 'warning.main';
      case 'error': return 'error.main';
      case 'info': return 'info.main';
      default: return 'text.primary';
    }
  };

  const getStatusIcon = (status: StatusItem['status']) => {
    switch (status) {
      case 'success': return <CheckCircle />;
      case 'warning': return <Warning />;
      case 'error': return <ErrorIcon />;
      case 'info': return <Info />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 2, ...sx }} {...props}>
        {title && <Skeleton variant="text" width="40%" height={32} />}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {Array.from({ length: columns }).map((_, index) => (
            <Grid item xs={12 / columns} key={index}>
              <Skeleton variant="rectangular" height={compact ? 60 : 100} />
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 2, ...sx }} {...props}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, ...sx }} {...props}>
      {title && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
          {refreshable && (
            <IconButton onClick={onRefresh} size="small">
              <Refresh />
            </IconButton>
          )}
        </Box>
      )}
      
      {layout === 'grid' ? (
        <Grid container spacing={2}>
          {items.map((item) => (
            <Grid item xs={12 / columns} key={item.id}>
              <Box
                sx={{
                  p: compact ? 1 : 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  textAlign: 'center',
                  minHeight: compact ? 60 : 100,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  {item.icon || getStatusIcon(item.status)}
                  <Typography
                    variant={compact ? "h6" : "h4"}
                    sx={{ ml: 1, color: getStatusColor(item.status) }}
                  >
                    {item.value}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {item.label}
                </Typography>
                {item.description && !compact && (
                  <Typography variant="caption" color="text.secondary">
                    {item.description}
                  </Typography>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      ) : (
        <List dense={compact}>
          {items.map((item) => (
            <ListItem key={item.id}>
              <ListItemIcon sx={{ color: getStatusColor(item.status) }}>
                {item.icon || getStatusIcon(item.status)}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                secondary={item.description}
              />
              <Typography
                variant="h6"
                sx={{ color: getStatusColor(item.status) }}
              >
                {item.value}
              </Typography>
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
};

export {
  DataCardTemplate as OrbatDataCard,
  ListTemplate as OrbatList,
  StatusPanelTemplate as OrbatStatusPanel
};