import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Chip,
  LinearProgress,
  Pagination,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  AddCircleOutline,
  ArchiveOutlined,
  ContentCopyOutlined,
  DeleteOutline,
  EditNoteOutlined,
  ExpandMore,
  History,
  LocationOnOutlined,
  RestoreOutlined,
} from '@mui/icons-material';
import { useTranslation } from '@/hooks/useTranslation';
import {
  scenarioApiService,
  type ScenarioHistoryChange,
  type ScenarioHistoryEntry,
} from '@/services/api/scenarioApiService';

const PAGE_SIZE = 10;

const FIELD_LABELS: Record<string, string> = {
  content: 'محتوای عملیاتی سناریو',
  description: 'توضیحات',
  end_time: 'زمان پایان',
  image: 'تصویر سناریو',
  intro_summary: 'خلاصه اینترو',
  intro_title: 'عنوان اینترو',
  intro_video_url: 'ویدئوی اینترو',
  name: 'نام سناریو',
  start_time: 'زمان شروع',
};

const readableField = (field: string) =>
  FIELD_LABELS[field] || field.replace(/_/g, ' ');

const CATEGORY_LABELS: Record<string, string> = {
  tactical_symbol: 'نماد تاکتیکی',
  unit: 'یگان',
  map_feature: 'عارضه نقشه',
};

const locationLabel = (change: ScenarioHistoryChange) => {
  if (change.region) return `«${change.region}»`;
  if (change.layer) return `لایه «${change.layer}»`;
  if (change.location)
    return `مختصات ${change.location.lat.toLocaleString('fa-IR', {
      maximumFractionDigits: 4,
    })}، ${change.location.lon.toLocaleString('fa-IR', {
      maximumFractionDigits: 4,
    })}`;
  return '';
};

export const describeScenarioHistoryChange = (
  change: ScenarioHistoryChange
) => {
  const category = CATEGORY_LABELS[change.category] || 'عنصر';
  const subject = `${category} «${change.name}»`;
  const location = locationLabel(change);

  if (
    change.operation === 'moved' &&
    change.previous_region &&
    change.region &&
    change.previous_region !== change.region
  ) {
    return `${subject} از «${change.previous_region}» به «${change.region}» منتقل شد.`;
  }

  switch (change.operation) {
    case 'added':
      return `${subject}${location ? ` در ${location}` : ''} اضافه شد.`;
    case 'removed': {
      const previousLocation = change.previous_region
        ? ` از «${change.previous_region}»`
        : change.layer
          ? ` از لایه «${change.layer}»`
          : '';
      return `${subject}${previousLocation} حذف شد.`;
    }
    case 'moved':
      return `${subject}${location ? ` در ${location}` : ''} جابه‌جا شد.`;
    case 'edited':
      return `${subject}${location ? ` در ${location}` : ''} ویرایش شد.`;
    default:
      return `${subject} تغییر کرد.`;
  }
};

export const describeScenarioHistoryEntry = (
  entry: Pick<ScenarioHistoryEntry, 'action' | 'payload_diff'>
) => {
  const details = entry.payload_diff || {};
  const name = typeof details.name === 'string' ? details.name : '';
  const fields = Array.isArray(details.fields)
    ? details.fields.filter(
        (field): field is string => typeof field === 'string'
      )
    : [];
  const operationalChangeCount = details.summary?.total || 0;

  switch (entry.action) {
    case 'create':
      return name ? `سناریوی «${name}» ایجاد شد.` : 'سناریو ایجاد شد.';
    case 'update':
      if (operationalChangeCount) {
        const summaryParts = [
          details.summary?.added
            ? `${details.summary.added.toLocaleString('fa-IR')} افزوده`
            : '',
          details.summary?.removed
            ? `${details.summary.removed.toLocaleString('fa-IR')} حذف`
            : '',
          details.summary?.moved
            ? `${details.summary.moved.toLocaleString('fa-IR')} جابه‌جایی`
            : '',
          details.summary?.edited
            ? `${details.summary.edited.toLocaleString('fa-IR')} ویرایش`
            : '',
        ].filter(Boolean);
        return `${operationalChangeCount.toLocaleString('fa-IR')} تغییر عملیاتی ثبت شد${
          summaryParts.length ? `: ${summaryParts.join('، ')}` : ''
        }.`;
      }
      return fields.length
        ? `${fields.map(readableField).join('، ')} تغییر کرد.`
        : 'اطلاعات سناریو ویرایش شد.';
    case 'delete':
      return name ? `سناریوی «${name}» حذف شد.` : 'سناریو حذف شد.';
    case 'archive':
      return 'سناریو به بایگانی منتقل شد.';
    case 'restore':
      return 'سناریو از بایگانی بازیابی شد.';
    case 'duplicate':
      return 'یک نسخه جدید از این سناریو ساخته شد.';
    default:
      return 'یک تغییر در سناریو ثبت شد.';
  }
};

const actionVisual = (action: string) => {
  switch (action) {
    case 'create':
      return {
        color: '#2e7d32',
        background: '#e8f5e9',
        icon: <AddCircleOutline fontSize="small" />,
      };
    case 'delete':
      return {
        color: '#d32f2f',
        background: '#ffebee',
        icon: <DeleteOutline fontSize="small" />,
      };
    case 'archive':
      return {
        color: '#ed6c02',
        background: '#fff3e0',
        icon: <ArchiveOutlined fontSize="small" />,
      };
    case 'restore':
      return {
        color: '#0288d1',
        background: '#e1f5fe',
        icon: <RestoreOutlined fontSize="small" />,
      };
    case 'duplicate':
      return {
        color: '#7b1fa2',
        background: '#f3e5f5',
        icon: <ContentCopyOutlined fontSize="small" />,
      };
    default:
      return {
        color: '#455a64',
        background: '#eceff1',
        icon: <EditNoteOutlined fontSize="small" />,
      };
  }
};

const actorLabel = (entry: ScenarioHistoryEntry) =>
  entry.actor_display_name ||
  entry.actor_username ||
  (entry.actor_user_id ? 'کاربر حذف‌شده' : 'سامانه');

const actorInitial = (entry: ScenarioHistoryEntry) =>
  actorLabel(entry).trim().charAt(0) || 'س';

const ScenarioHistoryTab: React.FC<{ scenarioId: string }> = ({
  scenarioId,
}) => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<ScenarioHistoryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [scenarioId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        setLoadError(false);
        const data = await scenarioApiService.getScenarioHistory(
          scenarioId,
          PAGE_SIZE,
          (page - 1) * PAGE_SIZE
        );
        if (!cancelled) {
          setLogs(data.items);
          setTotal(data.total);
        }
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, scenarioId]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const visibleRange = useMemo(() => {
    if (!total) return '';
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(page * PAGE_SIZE, total);
    return `نمایش ${start.toLocaleString('fa-IR')} تا ${end.toLocaleString(
      'fa-IR'
    )} از ${total.toLocaleString('fa-IR')} رویداد`;
  }, [page, total]);

  if (loadError && logs.length === 0) {
    return (
      <Alert severity="error">دریافت تاریخچهٔ تغییرات سناریو انجام نشد.</Alert>
    );
  }

  if (!loading && logs.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 7 }}>
        <Avatar
          sx={{
            width: 64,
            height: 64,
            mx: 'auto',
            mb: 2,
            bgcolor: 'action.hover',
            color: 'text.secondary',
          }}
        >
          <History fontSize="large" />
        </Avatar>
        <Typography variant="h6" gutterBottom>
          {t('scenarios.history.noHistory')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          تغییرات بعدی این سناریو به‌ترتیب زمانی در این بخش نمایش داده می‌شوند.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1.5,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <History color="primary" />
            {t('scenarios.history.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            گزارش فعالیت‌های مدیریتی و تغییرات ثبت‌شده روی سناریو
          </Typography>
        </Box>
        <Chip
          label={`${total.toLocaleString('fa-IR')} رویداد ثبت‌شده`}
          color="primary"
          variant="outlined"
        />
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 2 }} />}
      {loadError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          به‌روزرسانی تاریخچه انجام نشد؛ آخرین اطلاعات دریافت‌شده نمایش داده
          می‌شود.
        </Alert>
      )}

      <Stack spacing={0}>
        {logs.map((log, index) => {
          const visual = actionVisual(log.action);
          const isLast = index === logs.length - 1;
          return (
            <Box
              key={log.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: '44px minmax(0, 1fr)',
                gap: { xs: 1, sm: 2 },
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                {!isLast && (
                  <Box
                    aria-hidden="true"
                    sx={{
                      position: 'absolute',
                      top: 38,
                      bottom: 0,
                      width: 2,
                      bgcolor: 'divider',
                    }}
                  />
                )}
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: visual.background,
                    color: visual.color,
                    border: '3px solid',
                    borderColor: 'background.paper',
                    zIndex: 1,
                  }}
                >
                  {visual.icon}
                </Avatar>
              </Box>

              <Paper
                variant="outlined"
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  mb: isLast ? 0 : 2,
                  borderRadius: 2.5,
                  transition: 'box-shadow 160ms ease, border-color 160ms ease',
                  '&:hover': {
                    boxShadow: 2,
                    borderColor: 'primary.light',
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 1,
                    flexWrap: 'wrap',
                  }}
                >
                  <Chip
                    label={
                      t(`scenarios.history.actions.${log.action}`) || log.action
                    }
                    size="small"
                    icon={visual.icon}
                    sx={{
                      color: visual.color,
                      bgcolor: visual.background,
                      fontWeight: 700,
                      '& .MuiChip-icon': { color: visual.color },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {new Date(log.created_at).toLocaleString('fa-IR', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </Typography>
                </Box>

                <Typography variant="body1" sx={{ mt: 1.5, fontWeight: 600 }}>
                  {describeScenarioHistoryEntry(log)}
                </Typography>

                {!!log.payload_diff?.changes?.length && (
                  <Accordion
                    disableGutters
                    elevation={0}
                    sx={{
                      mt: 1.5,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: '10px !important',
                      overflow: 'hidden',
                      '&::before': { display: 'none' },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMore />}
                      sx={{
                        minHeight: 42,
                        bgcolor: 'action.hover',
                        '& .MuiAccordionSummary-content': { my: 1 },
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.75,
                          fontWeight: 700,
                        }}
                      >
                        <LocationOnOutlined fontSize="small" color="primary" />
                        مشاهده جزئیات تغییرات
                        <Chip
                          size="small"
                          label={log.payload_diff.changes.length.toLocaleString(
                            'fa-IR'
                          )}
                          sx={{ height: 22 }}
                        />
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
                      <Stack
                        divider={
                          <Box sx={{ borderTop: 1, borderColor: 'divider' }} />
                        }
                      >
                        {log.payload_diff.changes.map((change, changeIndex) => (
                          <Box
                            key={`${change.category}-${change.name}-${changeIndex}`}
                            sx={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 1.25,
                              p: 1.5,
                            }}
                          >
                            <Box
                              aria-hidden="true"
                              sx={{
                                width: 9,
                                height: 9,
                                mt: 0.7,
                                flex: '0 0 auto',
                                borderRadius: '50%',
                                bgcolor:
                                  change.operation === 'added'
                                    ? 'success.main'
                                    : change.operation === 'removed'
                                      ? 'error.main'
                                      : change.operation === 'moved'
                                        ? 'info.main'
                                        : 'warning.main',
                              }}
                            />
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600 }}
                              >
                                {describeScenarioHistoryChange(change)}
                              </Typography>
                              {(change.layer || change.side) && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {[
                                    change.layer && `لایه: ${change.layer}`,
                                    change.side && `جبهه: ${change.side}`,
                                  ]
                                    .filter(Boolean)
                                    .join(' • ')}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                      {log.payload_diff.truncated && (
                        <Alert severity="info" sx={{ borderRadius: 0 }}>
                          فقط ۵۰ تغییر نخست این ذخیره نمایش داده شده است.
                        </Alert>
                      )}
                    </AccordionDetails>
                  </Accordion>
                )}

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mt: 1.5,
                    pt: 1.5,
                    borderTop: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Avatar
                    sx={{
                      width: 30,
                      height: 30,
                      fontSize: 13,
                      bgcolor: 'primary.main',
                    }}
                  >
                    {actorInitial(log)}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {actorLabel(log)}
                    </Typography>
                    {(log.actor_user_code || log.actor_username) && (
                      <Typography variant="caption" color="text.secondary">
                        {log.actor_user_code
                          ? `کد کاربری ${log.actor_user_code}`
                          : `نام کاربری ${log.actor_username}`}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Paper>
            </Box>
          );
        })}
      </Stack>

      {total > PAGE_SIZE && (
        <Box
          sx={{
            display: 'flex',
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            mt: 3,
            pt: 2,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {visibleRange}
          </Typography>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_event, value) => setPage(value)}
            color="primary"
            shape="rounded"
            size="small"
          />
        </Box>
      )}
    </Box>
  );
};

export default ScenarioHistoryTab;
