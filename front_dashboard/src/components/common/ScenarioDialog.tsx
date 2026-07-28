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
import PersianCalendarField from '@/components/common/PersianCalendarField';
import { localDateTimeToIso, toLocalDateTimeInput } from '@/utils/dateUtils';
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

const ScenarioDialog: React.FC<ScenarioDialogProps> = ({
  open,
  onClose,
  scenario,
  onSave,
}) => {
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
        startTime: toLocalDateTimeInput(scenario.startTime),
        endTime: toLocalDateTimeInput(scenario.endTime),
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
      startTime: localDateTimeToIso(formData.startTime),
      endTime: localDateTimeToIso(formData.endTime),
      objectives: formData.objectives.split('\n').filter(obj => obj.trim()),
    };
    if (scenario) scenarioData.id = scenario.id;
    onSave(scenarioData);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={buildResourcesFormDialogSx(theme)}
    >
      <DialogTitle sx={resourcesDialogTitleSx(theme)}>
        {scenario ? 'ویرایش سناریو' : 'ایجاد سناریو جدید'}
      </DialogTitle>
      <DialogContent dividers sx={resourcesDialogContentDividersSx(theme)}>
        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="نام سناریو"
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>وضعیت</InputLabel>
              <Select
                value={formData.status}
                label="وضعیت"
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    status: e.target.value as ScenarioStatus,
                  }))
                }
              >
                {statusOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
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
              onChange={e =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <PersianCalendarField
              label="زمان شروع"
              value={formData.startTime}
              onChange={startTime =>
                setFormData(prev => ({ ...prev, startTime }))
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <PersianCalendarField
              label="زمان پایان"
              value={formData.endTime}
              onChange={endTime => setFormData(prev => ({ ...prev, endTime }))}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="اهداف سناریو"
              multiline
              rows={4}
              value={formData.objectives}
              onChange={e =>
                setFormData(prev => ({ ...prev, objectives: e.target.value }))
              }
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
