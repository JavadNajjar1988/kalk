import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
} from '@mui/material';
import { ScenarioStatus } from '@/types';
import type { Scenario } from '@/types';
import {
  buildResourcesFormDialogSx,
  resourcesDialogTitleSx,
  resourcesDialogContentDividersSx,
  resourcesDialogActionsSx,
  resourcesOutlinedCancelButtonSx,
} from '@/modules/dashboard/pages/resources/resourcesDialogStyles';

const statusOptions: { value: ScenarioStatus; label: string }[] = [
  { value: ScenarioStatus.DRAFT, label: 'پیش‌نویس' },
  { value: ScenarioStatus.ACTIVE, label: 'فعال' },
  { value: ScenarioStatus.PAUSED, label: 'متوقف' },
  { value: ScenarioStatus.COMPLETED, label: 'تکمیل شده' },
];

interface ScenarioDialogProps {
  open: boolean;
  onClose: () => void;
  scenario?: Scenario;
  onSave: (scenario: Partial<Scenario>) => void;
}

const ScenarioDialog: React.FC<ScenarioDialogProps> = ({ open, onClose, scenario, onSave }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: ScenarioStatus.DRAFT,
    startTime: '',
    endTime: '',
    objectives: '',
  });

  useEffect(() => {
    if (scenario) {
      setFormData({
        name: scenario.name,
        description: scenario.description,
        status: scenario.status,
        startTime: scenario.startTime ? new Date(scenario.startTime).toISOString().slice(0, 16) : '',
        endTime: scenario.endTime ? new Date(scenario.endTime).toISOString().slice(0, 16) : '',
        objectives: scenario.objectives?.join('\n') || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        status: ScenarioStatus.DRAFT,
        startTime: '',
        endTime: '',
        objectives: '',
      });
    }
  }, [scenario]);

  const handleSubmit = () => {
    const scenarioData: Partial<Scenario> = {
      name: formData.name,
      description: formData.description,
      status: formData.status,
      startTime: formData.startTime ? new Date(formData.startTime).toISOString() : undefined,
      endTime: formData.endTime ? new Date(formData.endTime).toISOString() : undefined,
      objectives: formData.objectives.split('\n').filter(obj => obj.trim()),
    };
    if (scenario) scenarioData.id = scenario.id;
    onSave(scenarioData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth sx={buildResourcesFormDialogSx(theme)}>
      <DialogTitle sx={resourcesDialogTitleSx(theme)}>{scenario ? 'ویرایش سناریو' : 'ایجاد سناریو جدید'}</DialogTitle>
      <DialogContent dividers sx={resourcesDialogContentDividersSx(theme)}>
        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="نام سناریو"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>وضعیت</InputLabel>
              <Select
                value={formData.status}
                label="وضعیت"
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as ScenarioStatus }))}
              >
                {statusOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="توضیحات"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="زمان شروع"
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="زمان پایان"
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="اهداف سناریو"
              multiline
              rows={4}
              value={formData.objectives}
              onChange={(e) => setFormData(prev => ({ ...prev, objectives: e.target.value }))}
              placeholder="هر هدف را در یک خط جداگانه وارد کنید"
              helperText="هر هدف را در یک خط جداگانه وارد کنید"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={resourcesDialogActionsSx(theme)}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          sx={resourcesOutlinedCancelButtonSx(theme)}
        >
          انصراف
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={!formData.name.trim()}
          sx={{ borderRadius: 2, px: 3 }}
        >
          {scenario ? 'ذخیره تغییرات' : 'ایجاد سناریو'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScenarioDialog;
