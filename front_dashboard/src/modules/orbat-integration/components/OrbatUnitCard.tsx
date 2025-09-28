import React, { useMemo } from 'react';
import { styled } from '@mui/material/styles';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Chip, 
  IconButton,
  Tooltip,
  Grid
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Highlight,
  ZoomIn,
  Edit,
  Delete,
  Info
} from '@mui/icons-material';
import type { OrbatUnit } from '../types/orbat-data';

const UnitCard = styled(Card)<{ selected?: boolean; highlighted?: boolean }>(({ theme, selected, highlighted }) => ({
  minHeight: 120,
  cursor: 'pointer',
  transition: theme.transitions.create(['box-shadow', 'background-color'], {
    duration: theme.transitions.duration.short,
  }),
  border: selected ? `2px solid ${theme.palette.primary.main}` : '1px solid transparent',
  backgroundColor: highlighted ? theme.palette.action.hover : 'inherit',
  '&:hover': {
    boxShadow: theme.shadows[4],
    backgroundColor: theme.palette.action.hover,
  },
}));

const UnitHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(1),
}));

const UnitActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
}));

const UnitSymbol = styled(Box)<{ symbolColor?: string }>(({ theme, symbolColor }) => ({
  width: 40,
  height: 40,
  backgroundColor: symbolColor || theme.palette.primary.main,
  borderRadius: theme.shape.borderRadius,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.primary.contrastText,
  fontWeight: 'bold',
  fontSize: '0.75rem',
  marginRight: theme.spacing(2),
}));

interface OrbatUnitCardProps {
  unit: OrbatUnit;
  selected?: boolean;
  highlighted?: boolean;
  visible?: boolean;
  onSelect?: (unit: OrbatUnit) => void;
  onEdit?: (unit: OrbatUnit) => void;
  onDelete?: (unit: OrbatUnit) => void;
  onToggleVisibility?: (unit: OrbatUnit) => void;
  onToggleHighlight?: (unit: OrbatUnit) => void;
  onZoomTo?: (unit: OrbatUnit) => void;
  onShowInfo?: (unit: OrbatUnit) => void;
  compact?: boolean;
}

const OrbatUnitCard: React.FC<OrbatUnitCardProps> = ({
  unit,
  selected = false,
  highlighted = false,
  visible = true,
  onSelect,
  onEdit,
  onDelete,
  onToggleVisibility,
  onToggleHighlight,
  onZoomTo,
  onShowInfo,
  compact = false
}) => {
  const symbolColor = useMemo(() => {
    // Extract color from SIDC or use default colors based on affiliation
    const affiliation = unit.sidc?.charAt(1);
    switch (affiliation) {
      case 'F': return '#0074D9'; // Friendly - Blue
      case 'H': return '#FF4136'; // Hostile - Red
      case 'N': return '#2ECC40'; // Neutral - Green
      case 'U': return '#FFDC00'; // Unknown - Yellow
      default: return '#7FDBFF'; // Default - Light Blue
    }
  }, [unit.sidc]);

  const unitTypeAbbr = useMemo(() => {
    // Extract unit type abbreviation from name or use first 2 characters
    if (unit.name.length <= 3) return unit.name.toUpperCase();
    const words = unit.name.split(' ');
    if (words.length > 1) {
      return words.map(word => word.charAt(0)).join('').toUpperCase().slice(0, 3);
    }
    return unit.name.slice(0, 3).toUpperCase();
  }, [unit.name]);

  const handleCardClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onSelect) {
      onSelect(unit);
    }
  };

  const handleActionClick = (event: React.MouseEvent, action: () => void) => {
    event.stopPropagation();
    action();
  };

  return (
    <UnitCard 
      selected={selected} 
      highlighted={highlighted}
      onClick={handleCardClick}
      elevation={selected ? 3 : 1}
    >
      <CardContent sx={{ p: compact ? 1 : 2, '&:last-child': { pb: compact ? 1 : 2 } }}>
        <UnitHeader>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <UnitSymbol symbolColor={symbolColor}>
              {unitTypeAbbr}
            </UnitSymbol>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant={compact ? 'body2' : 'h6'} 
                component="div"
                noWrap
                title={unit.name}
              >
                {unit.name}
              </Typography>
              {unit.unitType && (
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  noWrap
                  title={unit.unitType}
                >
                  {unit.unitType}
                </Typography>
              )}
            </Box>
          </Box>
          
          <UnitActions>
            {onToggleVisibility && (
              <Tooltip title={visible ? 'مخفی کردن واحد' : 'نمایش واحد'}>
                <IconButton
                  size="small"
                  onClick={(e) => handleActionClick(e, () => onToggleVisibility(unit))}
                  color={visible ? 'primary' : 'default'}
                >
                  {visible ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </Tooltip>
            )}
            
            {onToggleHighlight && (
              <Tooltip title={highlighted ? 'حذف هایلایت' : 'هایلایت واحد'}>
                <IconButton
                  size="small"
                  onClick={(e) => handleActionClick(e, () => onToggleHighlight(unit))}
                  color={highlighted ? 'warning' : 'default'}
                >
                  <Highlight />
                </IconButton>
              </Tooltip>
            )}
            
            {onZoomTo && (
              <Tooltip title="بزرگ‌نمایی روی واحد">
                <IconButton
                  size="small"
                  onClick={(e) => handleActionClick(e, () => onZoomTo(unit))}
                >
                  <ZoomIn />
                </IconButton>
              </Tooltip>
            )}
            
            {onShowInfo && (
              <Tooltip title="اطلاعات واحد">
                <IconButton
                  size="small"
                  onClick={(e) => handleActionClick(e, () => onShowInfo(unit))}
                >
                  <Info />
                </IconButton>
              </Tooltip>
            )}
            
            {onEdit && (
              <Tooltip title="ویرایش واحد">
                <IconButton
                  size="small"
                  onClick={(e) => handleActionClick(e, () => onEdit(unit))}
                >
                  <Edit />
                </IconButton>
              </Tooltip>
            )}
            
            {onDelete && (
              <Tooltip title="حذف واحد">
                <IconButton
                  size="small"
                  onClick={(e) => handleActionClick(e, () => onDelete(unit))}
                  color="error"
                >
                  <Delete />
                </IconButton>
              </Tooltip>
            )}
          </UnitActions>
        </UnitHeader>

        {!compact && (
          <Grid container spacing={1}>
            {unit.status && (
              <Grid item xs={6}>
                <Chip 
                  label={unit.status} 
                  size="small" 
                  variant="outlined"
                  color={unit.status === 'ACTIVE' ? 'success' : 'default'}
                />
              </Grid>
            )}
            
            {unit.parentUnitId && (
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  واحد بالادستی: {unit.parentUnitId}
                </Typography>
              </Grid>
            )}
            
            {unit.strength !== undefined && (
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  قدرت: {unit.strength}
                </Typography>
              </Grid>
            )}
            
            {unit.position && (
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  موقعیت: {unit.position.lat.toFixed(4)}, {unit.position.lon.toFixed(4)}
                </Typography>
              </Grid>
            )}
          </Grid>
        )}
      </CardContent>
    </UnitCard>
  );
};

export { OrbatUnitCard };