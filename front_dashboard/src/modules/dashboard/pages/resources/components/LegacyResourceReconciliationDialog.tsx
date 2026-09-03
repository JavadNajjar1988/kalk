import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { AddLink as CreateIcon } from '@mui/icons-material';
import resourceApiService, {
  type LegacyResourceReconciliationData,
  type LegacyResourceReconciliationOccurrence,
} from '@/services/api/resourceApiService';
import {
  buildResourcesFormDialogSx,
  getResourcesDialogAccent,
  resourcesDialogActionsSx,
  resourcesDialogContentDividersSx,
  resourcesDialogTitleSx,
  resourcesOutlinedCancelButtonSx,
} from '../resourcesDialogStyles';

type Props = {
  open: boolean;
  type: 'equipment' | 'personnel';
  onClose: () => void;
  onApplied?: () => void;
};

const labels = {
  equipment: { singular: 'تجهیز', plural: 'تجهیزات' },
  personnel: { singular: 'فرد', plural: 'پرسنل' },
};

const occurrenceId = (item: LegacyResourceReconciliationOccurrence) =>
  `${item.scenarioId}:${item.occurrenceKey}`;

const LegacyResourceReconciliationDialog: React.FC<Props> = ({
  open,
  type,
  onClose,
  onApplied,
}) => {
  const theme = useTheme();
  const accent = getResourcesDialogAccent(theme);
  const [data, setData] = useState<LegacyResourceReconciliationData | null>(
    null
  );
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [creatingKey, setCreatingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selectedCount = useMemo(
    () => Object.values(selections).filter(Boolean).length,
    [selections]
  );

  async function load(preselect?: { key: string; resourceId: string }) {
    setLoading(true);
    setError(null);
    try {
      const result = await resourceApiService.getLegacyReconciliation(type);
      setData(result);
      const suggested: Record<string, string> = {};
      for (const occurrence of result.occurrences) {
        const match = result.resources.find(
          resource =>
            (occurrence.sourceCode &&
              resource.code === occurrence.sourceCode) ||
            resource.name.trim().toLocaleLowerCase('fa') ===
              occurrence.itemName.trim().toLocaleLowerCase('fa')
        );
        if (match) suggested[occurrenceId(occurrence)] = match.id;
      }
      setSelections(previous => ({
        ...suggested,
        ...previous,
        ...(preselect ? { [preselect.key]: preselect.resourceId } : {}),
      }));
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : `خطا در بررسی ${labels[type].plural} قدیمی`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      setSelections({});
      setMessage(null);
      void load();
    }
  }, [open, type]);

  async function createFromOccurrence(
    occurrence: LegacyResourceReconciliationOccurrence
  ) {
    const key = occurrenceId(occurrence);
    setCreatingKey(key);
    setError(null);
    try {
      const created = await resourceApiService.create({
        type,
        name: occurrence.itemName,
        code: occurrence.sourceCode || undefined,
        status: type === 'equipment' ? 'available' : 'active',
        metadata: { importedFromLegacyScenario: true },
      });
      await load({ key, resourceId: created.id });
      setMessage(
        `${labels[type].singular} مرجع ساخته شد؛ برای ثبت پیوند، دکمه تأیید را بزنید.`
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : `خطا در ساخت ${labels[type].singular} مرجع`
      );
    } finally {
      setCreatingKey(null);
    }
  }

  async function apply() {
    if (!data) return;
    const assignments = data.occurrences
      .map(occurrence => ({
        scenario_id: occurrence.scenarioId,
        occurrence_key: occurrence.occurrenceKey,
        resource_id: selections[occurrenceId(occurrence)],
      }))
      .filter(item => Boolean(item.resource_id));
    if (!assignments.length) return;
    setLoading(true);
    setError(null);
    try {
      const result = await resourceApiService.applyLegacyReconciliation(
        type,
        assignments
      );
      setMessage(
        `${result.linkedReferences} ارجاع در ${result.linkedGroups} گروه به منبع مرجع متصل شد.`
      );
      await load();
      onApplied?.();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'خطا در ثبت تطبیق‌های انتخاب‌شده'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="lg"
      sx={buildResourcesFormDialogSx(theme)}
    >
      <DialogTitle
        sx={{
          ...resourcesDialogTitleSx(theme),
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
        }}
      >
        <CreateIcon color="primary" />
        تطبیق {labels[type].plural} قدیمی با منابع مرجع
      </DialogTitle>
      <DialogContent dividers sx={resourcesDialogContentDividersSx(theme)}>
        <Stack spacing={2} sx={{ py: 1 }}>
          <Alert severity="info">
            هیچ موردی خودکار ثبت نمی‌شود. فقط ردیف‌هایی که منبع مرجع آن‌ها را
            انتخاب کرده‌اید، پس از تأیید متصل می‌شوند.
          </Alert>
          {error && <Alert severity="error">{error}</Alert>}
          {message && <Alert severity="success">{message}</Alert>}
          {loading && !data ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress />
            </Box>
          ) : data?.occurrences.length ? (
            <>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  borderColor: alpha(accent, 0.18),
                  backgroundColor: alpha(accent, 0.045),
                  display: 'flex',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {data.summary.unlinkedReferences} ارجاع بدون پیوند در{' '}
                  {data.summary.unlinkedGroups} گروه پیدا شد.
                </Typography>
                <Chip
                  size="small"
                  color={selectedCount ? 'primary' : 'default'}
                  variant="outlined"
                  label={`${selectedCount} مورد انتخاب‌شده`}
                />
              </Paper>
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{
                  maxHeight: 520,
                  borderRadius: 2.5,
                  borderColor: alpha(accent, 0.18),
                  overflow: 'auto',
                }}
              >
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          backgroundColor: alpha(accent, 0.1),
                          fontWeight: 700,
                        }}
                      >
                        سناریو
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: alpha(accent, 0.1),
                          fontWeight: 700,
                        }}
                      >
                        {labels[type].singular}
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: alpha(accent, 0.1),
                          fontWeight: 700,
                        }}
                      >
                        محل استفاده
                      </TableCell>
                      <TableCell
                        sx={{
                          minWidth: 300,
                          backgroundColor: alpha(accent, 0.1),
                          fontWeight: 700,
                        }}
                      >
                        منبع مرجع
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.occurrences.map(occurrence => {
                      const key = occurrenceId(occurrence);
                      return (
                        <TableRow key={key} hover>
                          <TableCell>{occurrence.scenarioName}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>
                              {occurrence.itemName}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {occurrence.sourceCode || 'بدون کد'} ·{' '}
                              {occurrence.occurrenceCount} ارجاع
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {occurrence.unitNames.join('، ') || 'فهرست سناریو'}
                          </TableCell>
                          <TableCell>
                            <Stack
                              direction={{ xs: 'column', sm: 'row' }}
                              spacing={1}
                            >
                              <FormControl fullWidth size="small">
                                <InputLabel>انتخاب منبع مرجع</InputLabel>
                                <Select
                                  value={selections[key] || ''}
                                  label="انتخاب منبع مرجع"
                                  onChange={event =>
                                    setSelections(previous => ({
                                      ...previous,
                                      [key]: event.target.value,
                                    }))
                                  }
                                >
                                  <MenuItem value="">بدون تطبیق</MenuItem>
                                  {data.resources.map(resource => (
                                    <MenuItem
                                      key={resource.id}
                                      value={resource.id}
                                    >
                                      {resource.name}
                                      {resource.code
                                        ? ` ـ ${resource.code}`
                                        : ''}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={
                                  creatingKey === key ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <CreateIcon />
                                  )
                                }
                                disabled={Boolean(creatingKey) || loading}
                                onClick={() => createFromOccurrence(occurrence)}
                                sx={{ whiteSpace: 'nowrap' }}
                              >
                                ساخت مرجع
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <Alert severity="success">
              همه ارجاع‌های قدیمی به منابع مرجع متصل هستند.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{
          ...resourcesDialogActionsSx(theme),
          justifyContent: 'space-between',
        }}
      >
        <Button
          variant="outlined"
          color="inherit"
          onClick={onClose}
          disabled={loading}
          sx={resourcesOutlinedCancelButtonSx(theme)}
        >
          بستن
        </Button>
        <Button
          variant="contained"
          onClick={apply}
          disabled={loading || selectedCount === 0}
          sx={{ borderRadius: 2, minWidth: 190, px: 3 }}
        >
          ثبت{' '}
          {selectedCount ? `${selectedCount} تطبیق` : 'تطبیق‌های انتخاب‌شده'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LegacyResourceReconciliationDialog;
