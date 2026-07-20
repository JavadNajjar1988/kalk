import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Search as SearchIcon
} from '@mui/icons-material';

interface ScenarioFiltersPanelProps {
  onFiltersChange?: (filters: FilterOptions) => void;
  className?: string;
}

interface FilterOptions {
  search: string;
  unitTypes: string[];
  echelons: string[];
  statuses: string[];
  timeRange: {
    start: Date | null;
    end: Date | null;
  };
  showOnlyVisible: boolean;
  showOnlySelected: boolean;
}

const UNIT_TYPES = [
  'پیاده',
  'زرهی',
  'توپخانه',
  'هوایی',
  'پدافند هوایی',
  'مهندسی',
  'مخابرات',
  'پزشکی',
  'تدارکات',
  'شناسایی'
];

const ECHELONS = [
  'Team/Crew',
  'Squad',
  'Section',
  'Platoon',
  'Company',
  'Battalion',
  'Regiment',
  'Brigade',
  'Division',
  'Corps'
];

const UNIT_STATUSES = [
  'Operational',
  'Partially Operational',
  'Non-Operational',
  'Unknown',
  'Destroyed',
  'Withdrawn'
];

const ScenarioFiltersPanel: React.FC<ScenarioFiltersPanelProps> = ({
  onFiltersChange,
  className
}) => {
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    unitTypes: [],
    echelons: [],
    statuses: [],
    timeRange: { start: null, end: null },
    showOnlyVisible: false,
    showOnlySelected: false
  });

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange?.(updatedFilters);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFilterChange({ search: event.target.value });
  };

  const handleUnitTypeChange = (unitType: string, checked: boolean) => {
    const newUnitTypes = checked
      ? [...filters.unitTypes, unitType]
      : filters.unitTypes.filter(type => type !== unitType);
    handleFilterChange({ unitTypes: newUnitTypes });
  };

  const handleEchelonChange = (echelon: string, checked: boolean) => {
    const newEchelons = checked
      ? [...filters.echelons, echelon]
      : filters.echelons.filter(e => e !== echelon);
    handleFilterChange({ echelons: newEchelons });
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    const newStatuses = checked
      ? [...filters.statuses, status]
      : filters.statuses.filter(s => s !== status);
    handleFilterChange({ statuses: newStatuses });
  };

  const clearAllFilters = () => {
    const clearedFilters: FilterOptions = {
      search: '',
      unitTypes: [],
      echelons: [],
      statuses: [],
      timeRange: { start: null, end: null },
      showOnlyVisible: false,
      showOnlySelected: false
    };
    setFilters(clearedFilters);
    onFiltersChange?.(clearedFilters);
  };

  const activeFiltersCount = 
    (filters.search ? 1 : 0) +
    filters.unitTypes.length +
    filters.echelons.length +
    filters.statuses.length +
    (filters.showOnlyVisible ? 1 : 0) +
    (filters.showOnlySelected ? 1 : 0);

  return (
    <Paper className={className} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon />
            <Typography variant="h6">فیلترها</Typography>
            {activeFiltersCount > 0 && (
              <Chip 
                label={activeFiltersCount} 
                size="small" 
                color="primary"
              />
            )}
          </Box>
          <IconButton 
            size="small" 
            onClick={clearAllFilters}
            disabled={activeFiltersCount === 0}
          >
            <ClearIcon />
          </IconButton>
        </Box>
        
        <TextField
          fullWidth
          size="small"
          placeholder="جستجوی واحدها، فیچرها..."
          value={filters.search}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>انواع واحد</Typography>
            {filters.unitTypes.length > 0 && (
              <Chip 
                label={filters.unitTypes.length} 
                size="small" 
                sx={{ ml: 1 }}
              />
            )}
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              {UNIT_TYPES.map((unitType) => (
                <FormControlLabel
                  key={unitType}
                  control={
                    <Checkbox
                      checked={filters.unitTypes.includes(unitType)}
                      onChange={(e) => handleUnitTypeChange(unitType, e.target.checked)}
                      size="small"
                    />
                  }
                  label={unitType}
                />
              ))}
            </FormGroup>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>سطوح رشته</Typography>
            {filters.echelons.length > 0 && (
              <Chip 
                label={filters.echelons.length} 
                size="small" 
                sx={{ ml: 1 }}
              />
            )}
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              {ECHELONS.map((echelon) => (
                <FormControlLabel
                  key={echelon}
                  control={
                    <Checkbox
                      checked={filters.echelons.includes(echelon)}
                      onChange={(e) => handleEchelonChange(echelon, e.target.checked)}
                      size="small"
                    />
                  }
                  label={echelon}
                />
              ))}
            </FormGroup>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>وضعیت</Typography>
            {filters.statuses.length > 0 && (
              <Chip 
                label={filters.statuses.length} 
                size="small" 
                sx={{ ml: 1 }}
              />
            )}
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              {UNIT_STATUSES.map((status) => (
                <FormControlLabel
                  key={status}
                  control={
                    <Checkbox
                      checked={filters.statuses.includes(status)}
                      onChange={(e) => handleStatusChange(status, e.target.checked)}
                      size="small"
                    />
                  }
                  label={status}
                />
              ))}
            </FormGroup>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>گزینه‌های نمایش</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.showOnlyVisible}
                    onChange={(e) => handleFilterChange({ showOnlyVisible: e.target.checked })}
                    size="small"
                  />
                }
                label="نمایش تنها واحدهای قابل مشاهده"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.showOnlySelected}
                    onChange={(e) => handleFilterChange({ showOnlySelected: e.target.checked })}
                    size="small"
                  />
                }
                label="نمایش تنها واحدهای انتخابی"
              />
            </FormGroup>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Paper>
  );
};

export default ScenarioFiltersPanel;