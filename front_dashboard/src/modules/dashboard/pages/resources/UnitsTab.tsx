import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  AccountTree as UnitIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Hub as HistoryIcon,
  Search as SearchIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import resourceApiService, {
  type ResourceDto,
  type UnitReconciliationData,
} from '@/services/api/resourceApiService';
import ResourceUsageGraphDialog from './components/ResourceUsageGraphDialog';
import UnitModal, { type UnitFormValue } from './modals/UnitModal';
import {
  applyPrimaryImageChanges,
  type PrimaryImageChanges,
} from './components/primaryImageHelpers';
import {
  buildResourcesFormDialogSx,
  getResourcesDialogAccent,
  resourcesDialogActionsSx,
  resourcesDialogContentDividersSx,
  resourcesDialogTitleSx,
  resourcesOutlinedCancelButtonSx,
} from './resourcesDialogStyles';

const STATUS_LABELS: Record<string, string> = {
  active: 'فعال',
  inactive: 'غیرفعال',
  maintenance: 'در حال بازآماد',
  retired: 'خارج از خدمت',
};

const UnitsTab: React.FC = () => {
  const theme = useTheme();
  const accent = getResourcesDialogAccent(theme);
  const [items, setItems] = useState<ResourceDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<ResourceDto | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [usageItem, setUsageItem] = useState<ResourceDto | null>(null);
  const [reconcileOpen, setReconcileOpen] = useState(false);
  const [reconciliation, setReconciliation] =
    useState<UnitReconciliationData | null>(null);
  const [reconcileSelections, setReconcileSelections] = useState<
    Record<string, string>
  >({});
  const [creatingOccurrence, setCreatingOccurrence] = useState<string | null>(
    null
  );
  const [reconcileSearch, setReconcileSearch] = useState('');
  const [reconcilePage, setReconcilePage] = useState(0);
  const [reconcileRowsPerPage, setReconcileRowsPerPage] = useState(20);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await resourceApiService.list({
        type: 'units',
        search: search.trim() || undefined,
        limit: 250,
      });
      setItems(result.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت یگان‌ها');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(load, 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(item: ResourceDto) {
    setEditing(item);
    setFormOpen(true);
  }

  async function save(form: UnitFormValue, imageChanges: PrimaryImageChanges) {
    setLoading(true);
    setError(null);
    try {
      const parent = items.find(item => item.id === form.parentResourceId);
      const homeLocation =
        form.latitude.trim() && form.longitude.trim()
          ? { latitude: form.latitude.trim(), longitude: form.longitude.trim() }
          : undefined;
      const metadata: Record<string, unknown> = {
        ...(editing?.metadata || {}),
        shortName: form.shortName.trim() || undefined,
        echelon: form.echelon,
        unitType: form.unitType,
        parentResourceId: parent?.id,
        parentCode: parent?.code || form.parentCode.trim() || undefined,
        parentName: parent?.name || form.parentName.trim() || undefined,
        organizationalAffiliation:
          form.organizationalAffiliation.trim() || undefined,
        side: form.side,
        formedOn: form.formedOn || undefined,
        deactivatedOn: form.deactivatedOn || undefined,
        sidc: form.sidc.trim() || undefined,
        province: form.province.trim() || undefined,
        garrisonCity: form.garrisonCity.trim() || undefined,
        baseName: form.baseName.trim() || undefined,
        homeLocation,
        areaOfOps: form.areaOfOps.trim() || undefined,
        capabilities: form.capabilities,
        nominalPersonnelStrength:
          form.nominalPersonnelStrength.trim() || undefined,
        defaultReadiness: form.defaultReadiness || undefined,
        notableEquipment: form.notableEquipment.trim() || undefined,
        commanderName: form.commanderName.trim() || undefined,
        contact: form.contact.trim() || undefined,
      };
      for (const key of Object.keys(metadata)) {
        if (metadata[key] === undefined) delete metadata[key];
      }
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description.trim() || undefined,
        status: form.status,
        metadata,
      };
      let saved: ResourceDto;
      if (editing) {
        saved = await resourceApiService.update(editing.id, payload);
      } else {
        saved = await resourceApiService.create({ type: 'units', ...payload });
      }
      const primaryMediaId = await applyPrimaryImageChanges({
        resourceId: saved.id,
        currentPrimaryMediaId:
          String(editing?.metadata?.primaryMediaId || '') || undefined,
        changes: imageChanges,
      });
      if (primaryMediaId !== saved.metadata?.primaryMediaId) {
        await resourceApiService.update(saved.id, {
          metadata: { ...(saved.metadata || metadata), primaryMediaId },
        });
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ذخیره یگان');
    } finally {
      setLoading(false);
    }
  }

  async function loadReconciliation(preselect?: {
    key: string;
    resourceId: string;
  }) {
    setLoading(true);
    setError(null);
    try {
      const data = await resourceApiService.getUnitReconciliation();
      setReconciliation(data);
      const suggestions: Record<string, string> = {};
      for (const occurrence of data.occurrences) {
        const match = data.resources.find(
          resource =>
            resource.name.trim() === occurrence.unitName.trim() &&
            (!occurrence.sidc ||
              !resource.sidc ||
              resource.sidc === occurrence.sidc)
        );
        if (match)
          suggestions[`${occurrence.scenarioId}:${occurrence.unitId}`] =
            match.id;
      }
      setReconcileSelections(previous => ({
        ...suggestions,
        ...previous,
        ...(preselect ? { [preselect.key]: preselect.resourceId } : {}),
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'خطا در بررسی یگان‌های قدیمی'
      );
    } finally {
      setLoading(false);
    }
  }

  async function openReconciliation() {
    setReconcileOpen(true);
    setReconcileSelections({});
    setReconcileSearch('');
    setReconcilePage(0);
    await loadReconciliation();
  }

  const filteredReconciliationOccurrences = useMemo(() => {
    const occurrences = reconciliation?.occurrences || [];
    const query = reconcileSearch.trim().toLocaleLowerCase('fa');
    if (!query) return occurrences;
    return occurrences.filter(occurrence =>
      [
        occurrence.scenarioName,
        occurrence.unitName,
        occurrence.sidc,
        occurrence.sideName,
        occurrence.parentUnitName,
      ].some(value =>
        String(value || '')
          .toLocaleLowerCase('fa')
          .includes(query)
      )
    );
  }, [reconciliation, reconcileSearch]);

  const visibleReconciliationOccurrences = useMemo(
    () =>
      filteredReconciliationOccurrences.slice(
        reconcilePage * reconcileRowsPerPage,
        reconcilePage * reconcileRowsPerPage + reconcileRowsPerPage
      ),
    [filteredReconciliationOccurrences, reconcilePage, reconcileRowsPerPage]
  );

  async function createReferenceFromOccurrence(
    occurrence: UnitReconciliationData['occurrences'][number]
  ) {
    const key = `${occurrence.scenarioId}:${occurrence.unitId}`;
    setCreatingOccurrence(key);
    setError(null);
    try {
      const created = await resourceApiService.create({
        type: 'units',
        name: occurrence.unitName,
        code: `${occurrence.scenarioId}:${occurrence.unitId}`,
        status: 'active',
        metadata: {
          sidc: occurrence.sidc || undefined,
          side: occurrence.sideName || undefined,
          importedFromLegacyScenario: true,
        },
      });
      await loadReconciliation({ key, resourceId: created.id });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ساخت یگان مرجع');
    } finally {
      setCreatingOccurrence(null);
    }
  }

  async function applyReconciliation() {
    if (!reconciliation) return;
    const assignments = reconciliation.occurrences
      .map(occurrence => ({
        scenario_id: occurrence.scenarioId,
        unit_id: occurrence.unitId,
        resource_id:
          reconcileSelections[`${occurrence.scenarioId}:${occurrence.unitId}`],
      }))
      .filter(item => Boolean(item.resource_id));
    if (!assignments.length) return;
    setLoading(true);
    try {
      await resourceApiService.applyUnitReconciliation(assignments);
      setReconcileOpen(false);
      setReconciliation(null);
      setReconcileSelections({});
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت تطبیق یگان‌ها');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ md: 'center' }}
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h6" fontWeight={700}>
            کاتالوگ یگان‌ها
          </Typography>
          <Typography variant="body2" color="text.secondary">
            هویت مرجع یگان‌ها برای اتصال پایدار به سناریوها و مشاهده سابقه
            عملیات
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            variant="outlined"
            startIcon={<LinkIcon />}
            onClick={openReconciliation}
          >
            تطبیق یگان‌های سناریوهای قبلی
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
          >
            افزودن یگان مرجع
          </Button>
        </Stack>
      </Stack>

      <TextField
        fullWidth
        size="small"
        value={search}
        onChange={event => setSearch(event.target.value)}
        placeholder="جست‌وجو با نام یا کد یگان"
        sx={{ mb: 2, maxWidth: 520 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper variant="outlined">
        {loading && !items.length ? (
          <Box sx={{ minHeight: 240, display: 'grid', placeItems: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>یگان</TableCell>
                  <TableCell>کد مرجع</TableCell>
                  <TableCell>رده سازمانی</TableCell>
                  <TableCell>رسته یا نوع</TableCell>
                  <TableCell>طرف</TableCell>
                  <TableCell>وضعیت</TableCell>
                  <TableCell>استقرار اصلی</TableCell>
                  <TableCell align="center">عملیات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map(item => (
                  <TableRow
                    key={item.id}
                    hover
                    onClick={() => setUsageItem(item)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <UnitIcon color="primary" fontSize="small" />
                        <Typography variant="body2" fontWeight={700}>
                          {item.name}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{item.code || '—'}</TableCell>
                    <TableCell>
                      {String(item.metadata?.echelon || '—')}
                    </TableCell>
                    <TableCell>
                      {String(
                        item.metadata?.unitType || item.metadata?.branch || '—'
                      )}
                    </TableCell>
                    <TableCell>{String(item.metadata?.side || '—')}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={
                          STATUS_LABELS[item.status || ''] ||
                          item.status ||
                          'ثبت نشده'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {String(
                        item.metadata?.garrisonCity ||
                          item.metadata?.province ||
                          '—'
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="نمایش سابقه عملیات">
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={event => {
                            event.stopPropagation();
                            setUsageItem(item);
                          }}
                        >
                          <HistoryIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="ویرایش">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={event => {
                            event.stopPropagation();
                            openEdit(item);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {!items.length && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      align="center"
                      sx={{ py: 6, color: 'text.secondary' }}
                    >
                      یگانی ثبت نشده است. یگان‌های فایل اکسل نیز هنگام ورود
                      سناریو به این فهرست افزوده می‌شوند.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <UnitModal
        open={formOpen}
        unit={editing}
        units={items}
        saving={loading}
        onClose={() => setFormOpen(false)}
        onSave={save}
      />

      <Dialog
        open={reconcileOpen}
        onClose={() => setReconcileOpen(false)}
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
          <LinkIcon color="primary" />
          تطبیق کنترل‌شده یگان‌های سناریوهای قبلی
        </DialogTitle>
        <DialogContent dividers sx={resourcesDialogContentDividersSx(theme)}>
          <Alert severity="info" sx={{ mb: 2 }}>
            برای هر حضور عملیاتی، یگان مرجع صحیح را انتخاب کنید. سامانه بر اساس
            نام و نماد پیشنهاد می‌دهد، اما هیچ تطبیقی بدون تأیید شما ذخیره
            نمی‌شود.
          </Alert>
          {loading && !reconciliation ? (
            <Box sx={{ minHeight: 220, display: 'grid', placeItems: 'center' }}>
              <CircularProgress />
            </Box>
          ) : reconciliation?.occurrences.length ? (
            <Stack spacing={1.5}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 2.5,
                  borderColor: alpha(accent, 0.18),
                  backgroundColor: alpha(accent, 0.045),
                }}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  alignItems={{ sm: 'center' }}
                >
                  <TextField
                    size="small"
                    fullWidth
                    value={reconcileSearch}
                    onChange={event => {
                      setReconcileSearch(event.target.value);
                      setReconcilePage(0);
                    }}
                    placeholder="جست‌وجو در نام سناریو، یگان، طرف یا نماد"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Chip
                    color="primary"
                    variant="outlined"
                    label={`${filteredReconciliationOccurrences.length} مورد از ${reconciliation.occurrences.length}`}
                    sx={{ flexShrink: 0 }}
                  />
                </Stack>
              </Paper>
              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 2.5,
                  borderColor: alpha(accent, 0.18),
                  overflow: 'hidden',
                }}
              >
                <TableContainer sx={{ maxHeight: 440 }}>
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
                          یگان موجود
                        </TableCell>
                        <TableCell
                          sx={{
                            backgroundColor: alpha(accent, 0.1),
                            fontWeight: 700,
                          }}
                        >
                          طرف و یگان بالادست
                        </TableCell>
                        <TableCell
                          sx={{
                            minWidth: 280,
                            backgroundColor: alpha(accent, 0.1),
                            fontWeight: 700,
                          }}
                        >
                          یگان مرجع
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {visibleReconciliationOccurrences.map(occurrence => {
                        const key = `${occurrence.scenarioId}:${occurrence.unitId}`;
                        return (
                          <TableRow key={key} hover>
                            <TableCell>{occurrence.scenarioName}</TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={700}>
                                {occurrence.unitName}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {occurrence.sidc || 'نماد ثبت نشده'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {[occurrence.sideName, occurrence.parentUnitName]
                                .filter(Boolean)
                                .join('، ') || '—'}
                            </TableCell>
                            <TableCell>
                              <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                spacing={1}
                              >
                                <FormControl fullWidth size="small">
                                  <InputLabel>انتخاب یگان مرجع</InputLabel>
                                  <Select
                                    value={reconcileSelections[key] || ''}
                                    label="انتخاب یگان مرجع"
                                    onChange={event =>
                                      setReconcileSelections(previous => ({
                                        ...previous,
                                        [key]: event.target.value,
                                      }))
                                    }
                                  >
                                    <MenuItem value="">بدون تطبیق</MenuItem>
                                    {reconciliation.resources.map(resource => (
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
                                    creatingOccurrence === key ? (
                                      <CircularProgress size={16} />
                                    ) : (
                                      <AddIcon />
                                    )
                                  }
                                  disabled={
                                    Boolean(creatingOccurrence) || loading
                                  }
                                  onClick={() =>
                                    createReferenceFromOccurrence(occurrence)
                                  }
                                  sx={{ whiteSpace: 'nowrap' }}
                                >
                                  ساخت مرجع
                                </Button>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {!visibleReconciliationOccurrences.length && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            align="center"
                            sx={{ py: 5, color: 'text.secondary' }}
                          >
                            موردی مطابق جست‌وجو پیدا نشد.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={filteredReconciliationOccurrences.length}
                  page={reconcilePage}
                  onPageChange={(_event, page) => setReconcilePage(page)}
                  rowsPerPage={reconcileRowsPerPage}
                  onRowsPerPageChange={event => {
                    setReconcileRowsPerPage(Number(event.target.value));
                    setReconcilePage(0);
                  }}
                  rowsPerPageOptions={[10, 20, 50]}
                  labelRowsPerPage="تعداد در صفحه"
                  labelDisplayedRows={({ from, to, count }) =>
                    `${from}–${to} از ${count}`
                  }
                />
              </Paper>
            </Stack>
          ) : (
            <Alert severity="success">
              همه یگان‌های سناریوها به یگان مرجع متصل هستند.
            </Alert>
          )}
          {reconciliation && !reconciliation.resources.length && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              هنوز یگان مرجعی وجود ندارد. می‌توانید روبه‌روی هر ردیف، یگان مرجع
              را همین‌جا بسازید.
            </Alert>
          )}
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
            onClick={() => setReconcileOpen(false)}
            sx={resourcesOutlinedCancelButtonSx(theme)}
          >
            انصراف
          </Button>
          <Button
            variant="contained"
            disabled={
              loading || !Object.values(reconcileSelections).some(Boolean)
            }
            onClick={applyReconciliation}
            sx={{ borderRadius: 2, minWidth: 210, px: 3 }}
          >
            ثبت تطبیق‌های انتخاب‌شده
          </Button>
        </DialogActions>
      </Dialog>

      <ResourceUsageGraphDialog
        open={Boolean(usageItem)}
        resourceId={usageItem?.id || null}
        resourceName={usageItem?.name}
        onClose={() => setUsageItem(null)}
      />
    </Box>
  );
};

export default UnitsTab;
