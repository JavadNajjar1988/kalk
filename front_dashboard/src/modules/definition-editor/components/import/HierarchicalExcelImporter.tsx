import React, { useCallback, useMemo, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography, Alert, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { alpha } from '@mui/material/styles';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloseIcon from '@mui/icons-material/Close';
import * as XLSX from 'xlsx';
import { CategoryType, DefinitionNode, ExtendedHierarchyLevel } from '../../types';

interface HierarchicalExcelImporterProps {
  levels: ExtendedHierarchyLevel[];
  categoryId: string;
  categoryType: CategoryType;
  onImported: (nodes: DefinitionNode[]) => void;
  title?: string;
}

function normalizeForId(input: string): string {
  return (input || '')
    .toString()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\p{L}\p{N}_-]/gu, '')
    .toLowerCase();
}

function convertRowsToNodes(rows: string[][], levelNames: string[]): DefinitionNode[] {
  const idByPath = new Map<string, string>();
  const nodes: DefinitionNode[] = [];

  const getOrCreateId = (pathSegments: string[]): string => {
    const pathKey = pathSegments.join('>');
    const existing = idByPath.get(pathKey);
    if (existing) return existing;
    const slug = pathSegments.map(normalizeForId).join('__');
    const newId = `node_${slug || 'root'}_${idByPath.size + 1}`;
    idByPath.set(pathKey, newId);
    return newId;
  };

  for (const row of rows) {
    const trimmed = row.map(v => (v ?? '').toString().trim());
    let lastIdx = -1;
    for (let i = 0; i < trimmed.length; i++) {
      if (trimmed[i]) lastIdx = i;
    }
    if (lastIdx < 0) continue;

    let parentId: string | undefined = undefined;
    const pathSegments: string[] = [];
    for (let level = 0; level <= lastIdx; level++) {
      const name = trimmed[level];
      if (!name) continue;
      pathSegments.push(name);
      const id = getOrCreateId(pathSegments);
      const node: DefinitionNode = {
        id,
        name,
        description: '',
        level: level + 1,
        parentId,
        children: [],
        customFields: undefined,
        metadata: { levelName: levelNames[level] || `سطح ${level + 1}` },
      } as DefinitionNode;
      if (!nodes.some(n => n.id === id)) nodes.push(node);
      parentId = id;
    }
  }

  return nodes;
}

const HierarchicalExcelImporter: React.FC<HierarchicalExcelImporterProps> = ({ levels, categoryId, categoryType, onImported, title = 'ورود داده‌ها از اکسل' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [parsedNodes, setParsedNodes] = useState<DefinitionNode[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const softSurface = useMemo(() => {
    const primary = (theme.palette.primary.main || '#4a90e2').toLowerCase();
    const hex = primary.replace('#', '');

    if (hex.includes('10b981') || hex.includes('4caf50') || hex.includes('2e7d32')) return '#f0f4f3';
    if (hex.includes('4a90e2') || hex.includes('1976d2') || hex.includes('2196f3')) return '#f0f4f8';
    if (hex.includes('ef4444') || hex.includes('f44336') || hex.includes('d32f2f')) return '#fbf1f0';
    if (hex.includes('6b21a8') || hex.includes('9c27b0') || hex.includes('673ab7')) return theme.palette.mode === 'dark' ? '#1f2330' : '#f3f0f9';
    if (hex.includes('f59e0b') || hex.includes('ff9800') || hex.includes('fb8c00')) return '#fbf5ef';

    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    const hexToRgb = (h: string) => {
      const norm = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
      const r = parseInt(norm.slice(0, 2), 16);
      const g = parseInt(norm.slice(2, 4), 16);
      const b = parseInt(norm.slice(4, 6), 16);
      return { r, g, b };
    };
    const rgbToHex = (r: number, g: number, b: number) =>
      `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;

    const blendWithWhite = (h: string, primaryWeight = 0.1) => {
      const { r, g, b } = hexToRgb(h);
      const white = 255;
      const weight = 1 - primaryWeight;
      const br = white * weight + r * primaryWeight;
      const bg = white * weight + g * primaryWeight;
      const bb = white * weight + b * primaryWeight;
      return rgbToHex(br, bg, bb);
    };

    if (/^[0-9a-f]{3,6}$/.test(hex)) {
      return blendWithWhite(hex, 0.1);
    }

    try {
      const fallback = (theme.palette.primary.light || '#90caf9').toLowerCase().replace('#', '');
      return blendWithWhite(fallback, 0.08);
    } catch {
      return theme.palette.mode === 'dark' ? '#1f2430' : '#f5f7fa';
    }
  }, [theme]);

  const secondaryButtonSx = {
    borderRadius: '12px',
    px: { xs: 2, sm: 3 },
    py: 1.2,
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    color: '#475569',
    border: '1px solid rgba(148, 163, 184, 0.25)',
    backdropFilter: 'blur(10px)',
    fontWeight: 600,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(148, 163, 184, 0.18)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 22px rgba(148, 163, 184, 0.24)',
    },
  } as const;

  const primaryButtonSx = {
    borderRadius: '12px',
    px: { xs: 2.2, sm: 3.5 },
    py: 1.2,
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
    color: '#ffffff',
    border: '2px solid rgba(255, 255, 255, 0.4)',
    boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.32)}`,
    fontWeight: 700,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: `0 16px 44px ${alpha(theme.palette.primary.dark, 0.4)}`,
      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
    },
    '&:disabled': {
      background: 'rgba(148, 163, 184, 0.4)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      color: 'rgba(255, 255, 255, 0.85)',
      transform: 'none',
      boxShadow: 'none',
    },
  } as const;

  const alertBaseSx = {
    borderRadius: '12px',
    backdropFilter: 'blur(6px)',
    fontWeight: 500,
  } as const;
const levelNames = useMemo(() => {
    const ordered = [...levels].sort((a: any, b: any) => (a.order || 1) - (b.order || 1));
    return ordered.map((l: any, idx: number) => l?.name || `سطح ${idx + 1}`);
  }, [levels]);

  const requiredColumns = levelNames.length > 0 ? levelNames.length : 9;

  const handleFile = useCallback(async (file: File) => {
    setLoading(true);
    setError('');
    setParsedNodes(null);
    setPreviewRows([]);
    setWarnings([]);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });
      const rows = json.filter(r => Array.isArray(r)) as (any[])[];
      const normalized: string[][] = rows.map(r => {
        const arr = r.slice(0, requiredColumns).map((v: any) => (v == null ? '' : String(v)));
        while (arr.length < requiredColumns) arr.push('');
        return arr;
      });

      const header = normalized[0] || [];
      const headerMatches = header.every((h, i) => h.trim() === (levelNames[i] || '').trim());
      const dataRows = headerMatches ? normalized.slice(1) : normalized;

      const localWarnings: string[] = [];
      dataRows.forEach((row, idx) => {
        let seenEmpty = false;
        for (let i = 0; i < row.length; i++) {
          const cell = (row[i] || '').trim();
          if (!cell) {
            seenEmpty = true;
          } else if (seenEmpty) {
            localWarnings.push(`ردیف ${idx + 1}: مقدار در سطح ${i + 1} بدون مقدار والد در سطح قبل`);
            break;
          }
        }
      });

      const nodes = convertRowsToNodes(dataRows, levelNames);
      setParsedNodes(nodes);
      setPreviewRows(dataRows.slice(0, 20));
      setWarnings(localWarnings);
    } catch (e: any) {
      setError(e?.message || 'خطا در خواندن فایل اکسل');
    } finally {
      setLoading(false);
    }
  }, [levelNames, requiredColumns]);

  const handleConfirmImport = () => {
    if (parsedNodes && parsedNodes.length > 0) {
      onImported(parsedNodes);
      setOpen(false);
    }
  };

  const handleDownloadTemplate = () => {
    const header = levelNames.length > 0 ? levelNames : Array.from({ length: requiredColumns }, (_, i) => `سطح ${i + 1}`);
    const ws = XLSX.utils.aoa_to_sheet([header]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `hierarchical_template_${categoryId}.xlsx`);
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<UploadFileIcon />}
        onClick={() => setOpen(true)}
        sx={{ borderRadius: 2 }}
      >
        ورود از اکسل
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : '20px',
            backgroundColor: alpha(theme.palette.primary.light, 0.1),
            backdropFilter: 'blur(20px)',
            border: (t) => `1px solid ${alpha(t.palette.primary.light, 0.2)}`,
            boxShadow: (t) => `0 24px 60px ${alpha(t.palette.primary.light, 0.3)}, inset 0 1px 0 rgba(255, 255, 255, 0.75)`,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: { xs: '100vh', md: '90vh' },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: softSurface,
            borderBottom: (t) => `1px solid ${alpha(t.palette.primary.light, 0.2)}`,
            py: isMobile ? 2 : 3,
            px: isMobile ? 2 : 3,
          }}
        >
          <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={700} color="primary">
            {title}
          </Typography>
          <IconButton
            onClick={() => setOpen(false)}
            size="small"
            sx={{
              minWidth: 'auto',
              color: theme.palette.primary.main,
              backgroundColor: alpha(theme.palette.primary.main, 0.12),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                transform: 'translateY(-1px)',
                boxShadow: `0 6px 18px ${alpha(theme.palette.primary.main, 0.25)}`,
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, backgroundColor: softSurface }}>
          <Box sx={{ p: { xs: 2.5, sm: 3.5 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {loading && <LinearProgress sx={{ borderRadius: 2 }} />}
            {error && (
              <Alert
                severity="error"
                sx={{
                  ...alertBaseSx,
                  backgroundColor: alpha(theme.palette.error.main, 0.12),
                  border: `1px solid ${alpha(theme.palette.error.main, 0.25)}`,
                  color: theme.palette.error.main,
                }}
              >
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <input
              id={`hier-excel-input-${categoryId}`}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.currentTarget.value = '';
              }}
            />
            <label htmlFor={`hier-excel-input-${categoryId}`}>
              <Button component="span" variant="contained" startIcon={<UploadFileIcon />}>انتخاب فایل اکسل</Button>
            </label>
            <Typography variant="body2" color="text.secondary">
              تعداد ستون‌های لازم: {requiredColumns} (مطابق سطوح تعریف‌شده)
            </Typography>
            <Button variant="outlined" onClick={handleDownloadTemplate}>دانلود قالب اکسل</Button>
          </Box>

          {parsedNodes && (
            <>
              <Alert
                severity="info"
                sx={{
                  ...alertBaseSx,
                  backgroundColor: alpha(theme.palette.primary.light, 0.16),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                  color: theme.palette.primary.main,
                }}
              >
                {`ردیف‌های شناسایی‌شده: ${previewRows.length} | نودهای استخراج‌شده: ${parsedNodes.length}`}
              </Alert>
              {warnings.length > 0 && (
                <Alert
                  severity="warning"
                  sx={{
                    ...alertBaseSx,
                    backgroundColor: alpha(theme.palette.warning.main, 0.14),
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.25)}`,
                    color: theme.palette.warning.dark,
                  }}
                >
                  {warnings.slice(0, 5).map((w, i) => (
                    <div key={i}>{w}</div>
                  ))}
                  {warnings.length > 5 && (
                    <Typography variant="caption">{`و ${warnings.length - 5} هشدار دیگر...`}</Typography>
                  )}
                </Alert>
              )}
              <TableContainer
                component={Paper}
                sx={{
                  maxHeight: 360,
                  borderRadius: 2,
                  boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.08)}`,
                }}
              >
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      {levelNames.map((ln, idx) => (
                        <TableCell key={idx}>{ln || `سطح ${idx + 1}`}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewRows.map((r, i) => (
                      <TableRow key={i}>
                        {r.slice(0, levelNames.length).map((c, j) => (
                          <TableCell key={j}>{c}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            backgroundColor: softSurface,
            borderTop: (t) => `1px solid ${alpha(t.palette.primary.light, 0.2)}`,
            p: isMobile ? 2 : 3,
            justifyContent: 'flex-end',
            gap: 1.5,
          }}
        >
          <Button onClick={() => setOpen(false)} variant="outlined" sx={secondaryButtonSx}>انصراف</Button>
          <Button
            onClick={handleConfirmImport}
            disabled={!parsedNodes || parsedNodes.length === 0}
            variant="contained"
            sx={primaryButtonSx}
          >
            ورود
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default HierarchicalExcelImporter;


