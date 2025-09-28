import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Grid,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { useOrbatIntegration } from '../../hooks/useOrbatIntegration';

interface UnitDetailsDialogProps {
  open: boolean;
  unitId: string | null;
  onClose: () => void;
  onSave?: (unitData: UnitData) => void;
  readonly?: boolean;
}

interface UnitData {
  id: string;
  name: string;
  type: string;
  echelon: string;
  status: string;
  strength: {
    personnel: number;
    equipment: number;
  };
  location: {
    lat: number;
    lng: number;
    elevation?: number;
  };
  commander: string;
  parentUnit?: string;
  subUnits: string[];
  equipment: EquipmentItem[];
  personnel: PersonnelItem[];
  capabilities: string[];
  notes: string;
}

interface EquipmentItem {
  id: string;
  name: string;
  type: string;
  quantity: number;
  status: 'operational' | 'maintenance' | 'damaged' | 'destroyed';
}

interface PersonnelItem {
  id: string;
  name: string;
  rank: string;
  role: string;
  status: 'active' | 'wounded' | 'kia' | 'mia';
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ paddingTop: '16px' }}>
    {value === index && children}
  </div>
);

const UnitDetailsDialog: React.FC<UnitDetailsDialogProps> = ({
  open,
  unitId,
  onClose,
  onSave,
  readonly = false
}) => {
  const [unit, setUnit] = useState<UnitData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const { orbatInstance } = useOrbatIntegration();

  useEffect(() => {
    if (open && unitId) {
      loadUnitData();
    }
  }, [open, unitId]);

  const loadUnitData = async () => {
    if (!unitId || !orbatInstance) return;
    
    setLoading(true);
    try {
      const unitData = await orbatInstance.getUnitData(unitId);
      setUnit(unitData);
    } catch (error) {
      console.error('Failed to load unit data:', error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!unit) return;
    
    try {
      if (orbatInstance) {
        await orbatInstance.updateUnit(unit.id, unit);
      }
      onSave?.(unit);
      setEditMode(false);
    } catch (error) {
      console.error('Failed to save unit:', error);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    loadUnitData(); // Reload original data
  };

  const handleFieldChange = (field: keyof UnitData, value: any) => {
    if (!unit) return;
    setUnit({ ...unit, [field]: value });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'operational': return 'success';
      case 'maintenance': return 'warning';
      case 'damaged': return 'error';
      case 'destroyed': return 'error';
      default: return 'default';
    }
  };

  if (!unit) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Typography>Loading unit data...</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GroupIcon />
            <Typography variant="h6">{unit.name}</Typography>
            <Chip label={unit.type} size="small" />
          </Box>
          <Box>
            {!readonly && !editMode && (
              <IconButton onClick={() => setEditMode(true)}>
                <EditIcon />
              </IconButton>
            )}
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="General" />
          <Tab label="Personnel" />
          <Tab label="Equipment" />
          <Tab label="Location" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Unit Name"
                value={unit.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                disabled={!editMode}
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Unit Type</InputLabel>
                <Select
                  value={unit.type}
                  onChange={(e) => handleFieldChange('type', e.target.value)}
                  disabled={!editMode}
                >
                  <MenuItem value="Infantry">Infantry</MenuItem>
                  <MenuItem value="Armor">Armor</MenuItem>
                  <MenuItem value="Artillery">Artillery</MenuItem>
                  <MenuItem value="Aviation">Aviation</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>Echelon</InputLabel>
                <Select
                  value={unit.echelon}
                  onChange={(e) => handleFieldChange('echelon', e.target.value)}
                  disabled={!editMode}
                >
                  <MenuItem value="Squad">Squad</MenuItem>
                  <MenuItem value="Platoon">Platoon</MenuItem>
                  <MenuItem value="Company">Company</MenuItem>
                  <MenuItem value="Battalion">Battalion</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Unit Status</Typography>
                <Chip 
                  label={unit.status} 
                  color={getStatusColor(unit.status) as any}
                  sx={{ mb: 2 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Personnel: {unit.strength.personnel}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Equipment: {unit.strength.equipment}
                </Typography>
              </Box>
              <TextField
                fullWidth
                label="Commander"
                value={unit.commander}
                onChange={(e) => handleFieldChange('commander', e.target.value)}
                disabled={!editMode}
                margin="normal"
                InputProps={{
                  startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Notes"
                value={unit.notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                disabled={!editMode}
                margin="normal"
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Rank</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {unit.personnel.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {person.name.charAt(0)}
                        </Avatar>
                        {person.name}
                      </Box>
                    </TableCell>
                    <TableCell>{person.rank}</TableCell>
                    <TableCell>{person.role}</TableCell>
                    <TableCell>
                      <Chip 
                        label={person.status} 
                        size="small"
                        color={person.status === 'active' ? 'success' : 'error'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Equipment</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {unit.equipment.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      <Chip 
                        label={item.status} 
                        size="small"
                        color={getStatusColor(item.status) as any}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Latitude"
                type="number"
                value={unit.location.lat}
                onChange={(e) => handleFieldChange('location', {
                  ...unit.location,
                  lat: parseFloat(e.target.value)
                })}
                disabled={!editMode}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Longitude"
                type="number"
                value={unit.location.lng}
                onChange={(e) => handleFieldChange('location', {
                  ...unit.location,
                  lng: parseFloat(e.target.value)
                })}
                disabled={!editMode}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LocationIcon />
                  <Typography variant="subtitle2">Current Position</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {unit.location.lat.toFixed(6)}, {unit.location.lng.toFixed(6)}
                </Typography>
                {unit.location.elevation && (
                  <Typography variant="body2" color="text.secondary">
                    Elevation: {unit.location.elevation}m
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        {editMode ? (
          <>
            <Button onClick={handleCancel} startIcon={<CancelIcon />}>
              Cancel
            </Button>
            <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>
              Save Changes
            </Button>
          </>
        ) : (
          <Button onClick={onClose}>Close</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default UnitDetailsDialog;