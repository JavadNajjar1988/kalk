import React, { useCallback, useMemo, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography, Alert, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from '@mui/material';
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
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [parsedNodes, setParsedNodes] = useState<DefinitionNode[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

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

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">{title}</Typography>
          <IconButton onClick={() => setOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          {loading && <LinearProgress sx={{ mb: 2 }} />}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
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
              <Alert severity="info" sx={{ mb: 2 }}>
                {`ردیف‌های شناسایی‌شده: ${previewRows.length} | نودهای استخراج‌شده: ${parsedNodes.length}`}
              </Alert>
              {warnings.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {warnings.slice(0, 5).map((w, i) => (
                    <div key={i}>{w}</div>
                  ))}
                  {warnings.length > 5 && (
                    <Typography variant="caption">{`و ${warnings.length - 5} هشدار دیگر...`}</Typography>
                  )}
                </Alert>
              )}
              <TableContainer component={Paper} sx={{ maxHeight: 360 }}>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} variant="outlined">انصراف</Button>
          <Button onClick={handleConfirmImport} disabled={!parsedNodes || parsedNodes.length === 0} variant="contained">ورود</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default HierarchicalExcelImporter;


