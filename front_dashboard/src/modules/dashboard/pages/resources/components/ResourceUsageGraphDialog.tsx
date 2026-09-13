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
  IconButton,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  AccountTree as GraphIcon,
  AssignmentTurnedIn as AssignmentIcon,
  Close as CloseIcon,
  Flag as OperationIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import resourceApiService, {
  type ResourceUsageGraph,
} from '@/services/api/resourceApiService';
import {
  buildResourcesFormDialogSx,
  getResourcesDialogAccent,
  resourcesDialogActionsSx,
  resourcesDialogContentDividersSx,
  resourcesDialogTitleSx,
  resourcesOutlinedCancelButtonSx,
} from '../resourcesDialogStyles';

interface Props {
  open: boolean;
  resourceId: string | null;
  resourceName?: string;
  onClose: () => void;
}

function formatDate(value?: string | number | null) {
  if (value === undefined || value === null || value === '')
    return 'زمان ثبت نشده';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString('fa-IR', { dateStyle: 'medium', timeStyle: 'short' });
}

const STATUS_LABELS: Record<string, string> = {
  active: 'فعال',
  inactive: 'غیرفعال',
  available: 'موجود',
  assigned: 'تخصیص‌یافته',
  maintenance: 'در حال تعمیر',
  retired: 'خارج از خدمت',
  draft: 'پیش‌نویس',
  completed: 'پایان‌یافته',
  archived: 'بایگانی‌شده',
  planned: 'برنامه‌ریزی‌شده',
  deployed: 'اعزام‌شده',
  unavailable: 'خارج از دسترس',
  cancelled: 'لغوشده',
  wounded: 'مجروح',
  killed: 'شهید',
  transferred: 'منتقل‌شده',
};

function formatStatus(value?: string | null) {
  if (!value) return 'ثبت نشده';
  return STATUS_LABELS[value] || value;
}

const ResourceUsageGraphDialog: React.FC<Props> = ({
  open,
  resourceId,
  resourceName,
  onClose,
}) => {
  const theme = useTheme();
  const accent = getResourcesDialogAccent(theme);
  const [data, setData] = useState<ResourceUsageGraph | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !resourceId) return;
    let active = true;
    setLoading(true);
    setError(null);
    setData(null);
    resourceApiService
      .getUsageGraph(resourceId)
      .then(result => active && setData(result))
      .catch(
        err =>
          active &&
          setError(err instanceof Error ? err.message : 'خطا در دریافت سابقه')
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [open, resourceId]);

  const graph = useMemo(() => {
    if (!data) return { nodes: [] as Node[], edges: [] as Edge[] };
    const nodes: Node[] = [
      {
        id: `resource:${data.resource.id}`,
        position: { x: 0, y: Math.max(40, data.operations.length * 110) },
        data: {
          label: `${data.resource.name}${data.resource.code ? `\nکد: ${data.resource.code}` : ''}`,
        },
        style: {
          width: 210,
          whiteSpace: 'pre-line',
          border: `2px solid ${accent}`,
          borderRadius: 14,
          background:
            theme.palette.mode === 'dark'
              ? alpha(accent, 0.3)
              : alpha(accent, 0.12),
          color: theme.palette.text.primary,
          fontWeight: 700,
          textAlign: 'center',
          padding: 12,
        },
      },
    ];
    const edges: Edge[] = [];
    let assignmentRow = 0;

    data.operations.forEach((operation, operationIndex) => {
      const operationId = `operation:${operation.scenarioId}`;
      const baseY = operationIndex * 220;
      nodes.push({
        id: operationId,
        position: { x: 320, y: baseY },
        data: {
          label: `${operation.scenarioName}\n${formatStatus(operation.scenarioStatus)}\n${formatDate(operation.startTime)}`,
        },
        style: {
          width: 230,
          whiteSpace: 'pre-line',
          border: `1px solid ${theme.palette.secondary.main}`,
          borderRadius: 12,
          background: alpha(
            theme.palette.secondary.main,
            theme.palette.mode === 'dark' ? 0.28 : 0.12
          ),
          color: theme.palette.text.primary,
          textAlign: 'center',
          padding: 10,
        },
      });
      edges.push({
        id: `edge:resource:${operation.scenarioId}`,
        source: `resource:${data.resource.id}`,
        target: operationId,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: theme.palette.text.secondary, strokeWidth: 1.5 },
      });

      operation.assignments.forEach((assignment, assignmentIndex) => {
        const assignmentId = `assignment:${operation.scenarioId}:${assignmentIndex}`;
        nodes.push({
          id: assignmentId,
          position: { x: 680, y: assignmentRow * 135 },
          data: {
            label: `${assignment.unitName}\nوضعیت: ${formatStatus(assignment.status)}${
              assignment.operationalRole
                ? `\nنقش: ${assignment.operationalRole}`
                : ''
            }${
              assignment.quantity !== undefined && assignment.quantity !== null
                ? `\nتعداد: ${assignment.quantity}`
                : ''
            }${
              assignment.onHand !== undefined && assignment.onHand !== null
                ? `\nدر دسترس: ${assignment.onHand}`
                : ''
            }`,
          },
          style: {
            width: 210,
            whiteSpace: 'pre-line',
            border: `1px solid ${theme.palette.success.main}`,
            borderRadius: 12,
            background: alpha(
              theme.palette.success.main,
              theme.palette.mode === 'dark' ? 0.28 : 0.12
            ),
            color: theme.palette.text.primary,
            textAlign: 'center',
            padding: 10,
          },
        });
        edges.push({
          id: `edge:${operation.scenarioId}:${assignmentIndex}`,
          source: operationId,
          target: assignmentId,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: theme.palette.success.main },
        });
        assignmentRow += 1;
      });
    });
    return { nodes, edges };
  }, [accent, data, theme]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xl"
      dir="rtl"
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
        <HistoryIcon color="primary" />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6">سابقه حضور در عملیات‌ها</Typography>
          <Typography variant="body2" color="text.secondary">
            {data?.resource.name || resourceName || 'منبع انتخاب‌شده'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="بستن نمودار سابقه">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={resourcesDialogContentDividersSx(theme)}>
        {loading && (
          <Box sx={{ minHeight: 360, display: 'grid', placeItems: 'center' }}>
            <CircularProgress />
          </Box>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && data && (
          <Stack spacing={2.5} sx={{ py: 1 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                gap: 1.5,
              }}
            >
              {[
                {
                  icon: <OperationIcon />,
                  label: 'تعداد عملیات',
                  value: data.summary.operationsCount,
                },
                {
                  icon: <AssignmentIcon />,
                  label: 'تخصیص یا حضور',
                  value: data.summary.assignmentsCount,
                },
                {
                  icon: <GraphIcon />,
                  label: 'وضعیت فعلی منبع',
                  value: formatStatus(data.resource.status),
                },
              ].map(item => (
                <Paper
                  key={item.label}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    borderColor: alpha(accent, 0.18),
                    backgroundColor: alpha(accent, 0.045),
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      color: accent,
                      backgroundColor: alpha(accent, 0.12),
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {item.label}
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {item.value}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>

            {data.operations.length ? (
              <>
                <Paper
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    borderColor: alpha(accent, 0.18),
                    overflow: 'hidden',
                    boxShadow: `0 8px 24px ${alpha(accent, 0.07)}`,
                  }}
                >
                  <Box
                    sx={{
                      px: 2.5,
                      py: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                      borderBottom: `1px solid ${alpha(accent, 0.16)}`,
                      backgroundColor: alpha(accent, 0.055),
                    }}
                  >
                    <Typography fontWeight={700}>
                      نمای ارتباط منبع با عملیات‌ها و یگان‌ها
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      برای جابه‌جایی و بزرگ‌نمایی از ابزار نمودار استفاده کنید.
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      height: 480,
                      backgroundColor: alpha(
                        theme.palette.background.default,
                        0.45
                      ),
                    }}
                  >
                    <ReactFlow
                      nodes={graph.nodes}
                      edges={graph.edges}
                      fitView
                      minZoom={0.2}
                      maxZoom={1.8}
                      nodesDraggable={false}
                      nodesConnectable={false}
                      elementsSelectable
                    >
                      <MiniMap pannable zoomable />
                      <Controls showInteractive={false} />
                      <Background
                        gap={22}
                        size={1}
                        color={alpha(accent, 0.2)}
                      />
                    </ReactFlow>
                  </Box>
                </Paper>

                <Box component="section" aria-label="فهرست متنی سابقه عملیات">
                  <Typography
                    variant="h6"
                    sx={{ mb: 1.5, color: accent, fontWeight: 700 }}
                  >
                    جزئیات سابقه
                  </Typography>
                  <Stack spacing={1}>
                    {data.operations.map(operation => (
                      <Paper
                        key={operation.scenarioId}
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2.5,
                          borderColor: alpha(accent, 0.16),
                          borderRight: `4px solid ${accent}`,
                          backgroundColor:
                            theme.palette.mode === 'dark'
                              ? alpha(theme.palette.background.paper, 0.8)
                              : alpha(theme.palette.common.white, 0.92),
                        }}
                      >
                        <Stack
                          direction={{ xs: 'column', md: 'row' }}
                          justifyContent="space-between"
                          spacing={1}
                        >
                          <Box>
                            <Typography fontWeight={700}>
                              {operation.scenarioName}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {formatDate(operation.startTime)} تا{' '}
                              {formatDate(operation.endTime)}
                            </Typography>
                          </Box>
                          <Chip
                            size="small"
                            color="primary"
                            variant="outlined"
                            label={formatStatus(operation.scenarioStatus)}
                          />
                        </Stack>
                        <Stack spacing={0.75} sx={{ mt: 1.5 }}>
                          {operation.assignments.map((assignment, index) => (
                            <Box
                              key={`${operation.scenarioId}-${index}`}
                              sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 1,
                                alignItems: 'center',
                              }}
                            >
                              <Typography variant="body2" fontWeight={600}>
                                {assignment.unitName}
                              </Typography>
                              <Chip
                                size="small"
                                variant="outlined"
                                label={formatStatus(assignment.status)}
                              />
                              {assignment.quantity !== undefined &&
                                assignment.quantity !== null && (
                                  <Typography variant="caption">
                                    تعداد: {assignment.quantity}
                                  </Typography>
                                )}
                              {assignment.operationalRole && (
                                <Chip
                                  size="small"
                                  color="secondary"
                                  variant="outlined"
                                  label={`نقش: ${assignment.operationalRole}`}
                                />
                              )}
                              {assignment.sideName && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  طرف: {assignment.sideName}
                                </Typography>
                              )}
                              {assignment.parentUnitName && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  یگان بالادست: {assignment.parentUnitName}
                                </Typography>
                              )}
                              {assignment.onHand !== undefined &&
                                assignment.onHand !== null && (
                                  <Typography variant="caption">
                                    موجود یا در دسترس: {assignment.onHand}
                                  </Typography>
                                )}
                              {assignment.location?.length ? (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  موقعیت: {assignment.location.join('، ')}
                                </Typography>
                              ) : null}
                              {(assignment.startTime || assignment.endTime) && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  بازه حضور: {formatDate(assignment.startTime)}{' '}
                                  تا {formatDate(assignment.endTime)}
                                </Typography>
                              )}
                              {assignment.notes && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ flexBasis: '100%' }}
                                >
                                  توضیحات: {assignment.notes}
                                </Typography>
                              )}
                              {assignment.sourceReference && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ flexBasis: '100%' }}
                                >
                                  منبع: {assignment.sourceReference}
                                </Typography>
                              )}
                            </Box>
                          ))}
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              </>
            ) : (
              <Alert severity="info">
                هنوز هیچ حضور یا تخصیص ثبت‌شده‌ای برای این منبع پیدا نشد.
              </Alert>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          ...resourcesDialogActionsSx(theme),
          justifyContent: 'flex-start',
        }}
      >
        <Button
          variant="outlined"
          color="inherit"
          onClick={onClose}
          sx={resourcesOutlinedCancelButtonSx(theme)}
        >
          بستن
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResourceUsageGraphDialog;
