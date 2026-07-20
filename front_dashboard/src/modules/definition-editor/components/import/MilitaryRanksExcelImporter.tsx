import React, { useCallback, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography, Alert, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloseIcon from '@mui/icons-material/Close';
import * as XLSX from 'xlsx';
import { CategoryType, DefinitionNode } from '../../types';

interface MilitaryRanksExcelImporterProps {
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

// Convert Excel rows with military rank codes to flat DefinitionNode[]
function convertRowsToNodes(rows: string[][]): DefinitionNode[] {
  const nodes: DefinitionNode[] = [];
  const seenRanks = new Set<string>();

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    if (!row || row.length === 0) continue;

    // Expected columns: کشور, کد کشور, گروه رده‌ای, کد گروه رده‌ای, رده نظامی, کد رده نظامی
    const [country, countryCode, groupName, groupCode, rankName, rankCode] = row.map(cell => 
      (cell || '').toString().trim()
    );

    // Skip completely empty rows
    if (!country && !countryCode && !groupName && !groupCode && !rankName && !rankCode) continue;

    // Determine entry type with graceful fallback to codes when names are empty
    let nodeName = '';
    let nodeType = '';

    if (rankCode) {
      nodeType = 'rank';
      nodeName = rankName || rankCode; // fallback to code
    } else if (groupCode) {
      nodeType = 'group';
      nodeName = groupName || groupCode; // fallback to code
    } else if (countryCode) {
      nodeType = 'country';
      nodeName = country || countryCode; // fallback to code
    } else {
      // If nothing identifiable, skip
      continue;
    }

    // Create unique ID based on codes or name
    const idBase = [countryCode, groupCode, rankCode, nodeName].filter(Boolean).join('_');
    const uniqueId = `${nodeType}_${normalizeForId(idBase)}_${rowIndex + 1}`;
    
    // Skip duplicates
    if (seenRanks.has(uniqueId)) continue;
    seenRanks.add(uniqueId);

    // Create custom fields
    const customFields: Record<string, any> = {};
    if (countryCode) customFields.countryCode = countryCode.toUpperCase();
    if (groupCode) customFields.groupCode = groupCode.toUpperCase();
    if (rankCode) customFields.rankCode = rankCode.toUpperCase();

    const node: DefinitionNode = {
      id: uniqueId,
      name: nodeName,
      description: `${nodeType === 'rank' ? 'رده نظامی' : nodeType === 'group' ? 'گروه رده‌ای' : 'کشور'}: ${nodeName}`,
      level: 1, // All entries are level 1 in the new system
      parentId: undefined, // No parent in the new system
      children: [],
      customFields,
      metadata: {
        nodeType,
        hasCountryCode: !!countryCode,
        hasGroupCode: !!groupCode,
        hasRankCode: !!rankCode,
        country: country || '',
        groupName: groupName || '',
        rankName: rankName || '',
      } as any,
    };

    nodes.push(node);
  }

  return nodes;
}

const MilitaryRanksExcelImporter: React.FC<MilitaryRanksExcelImporterProps> = ({ 
  categoryId, 
  categoryType, 
  onImported, 
  title = 'ورود درجات نظامی از اکسل' 
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [parsedNodes, setParsedNodes] = useState<DefinitionNode[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const expectedColumns = ['کشور', 'کد کشور', 'گروه رده‌ای', 'کد گروه رده‌ای', 'رده نظامی', 'کد رده نظامی'];

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

      // Normalize rows to strings
      const normalized: string[][] = rows.map(r => {
        const arr = r.slice(0, expectedColumns.length).map((v: any) => (v == null ? '' : String(v)));
        while (arr.length < expectedColumns.length) arr.push('');
        return arr;
      });

      // Try to detect header row
      const header = normalized[0] || [];
      const headerMatches = header.some((h) => 
        expectedColumns.some(expected => h.trim().toLowerCase().includes(expected.toLowerCase()))
      );
      const dataRows = headerMatches ? normalized.slice(1) : normalized;

      // Fill-down: ارث‌بری مقادیر خالی از سطر قبلی برای ستون‌های کشور/کد کشور/گروه/کد گروه
      // تا نیاز به ورود پلکانی نباشد. روی رده نظامی و کد رده اعمال نمی‌شود.
      let lastCountry = '';
      let lastCountryCode = '';
      let lastGroupName = '';
      let lastGroupCode = '';
      const filledRows: string[][] = dataRows.map((row) => {
        const [country, countryCode, groupName, groupCode, rankName, rankCode] = row;
        const c = (country && country.trim()) ? country : lastCountry;
        const cc = (countryCode && countryCode.trim()) ? countryCode : lastCountryCode;
        const g = (groupName && groupName.trim()) ? groupName : lastGroupName;
        const gc = (groupCode && groupCode.trim()) ? groupCode : lastGroupCode;

        // به‌روزرسانی مقادیر آخرینِ دیده‌شده فقط اگر مقدار فعلی غیرخالی باشد
        if (country && country.trim()) lastCountry = country.trim();
        if (countryCode && countryCode.trim()) lastCountryCode = countryCode.trim();
        if (groupName && groupName.trim()) lastGroupName = groupName.trim();
        if (groupCode && groupCode.trim()) lastGroupCode = groupCode.trim();

        return [c, cc, g, gc, (rankName || '').toString(), (rankCode || '').toString()];
      });

      // Validate data
      const localWarnings: string[] = [];
      const validRows: string[][] = [];

      filledRows.forEach((row, idx) => {
        const [country, countryCode, groupName, groupCode, rankName, rankCode] = row;
        
        // Skip completely empty rows
        if (!country && !countryCode && !groupName && !groupCode && !rankName && !rankCode) return;

        // Validate codes format
        if (countryCode && !/^[A-Z]{2}$/i.test(countryCode)) {
          localWarnings.push(`ردیف ${idx + 1}: کد کشور "${countryCode}" باید دو حرف انگلیسی باشد`);
        }
        if (groupCode && !/^G\d+$/i.test(groupCode)) {
          localWarnings.push(`ردیف ${idx + 1}: کد گروه رده‌ای "${groupCode}" باید با G شروع شود و عدد داشته باشد`);
        }
        if (rankCode && !/^R\d+$/i.test(rankCode)) {
          localWarnings.push(`ردیف ${idx + 1}: کد رده نظامی "${rankCode}" باید با R شروع شود و عدد داشته باشد`);
        }

        // Check for logical consistency
        if (groupName && !groupCode) {
          localWarnings.push(`ردیف ${idx + 1}: گروه رده‌ای "${groupName}" بدون کد گروه رده‌ای`);
        }
        if (rankName && !rankCode) {
          localWarnings.push(`ردیف ${idx + 1}: رده نظامی "${rankName}" بدون کد رده نظامی`);
        }

        validRows.push(row);
      });

      if (validRows.length === 0) {
        throw new Error('هیچ ردیف معتبری در فایل یافت نشد');
      }

      const nodes = convertRowsToNodes(validRows);
      setParsedNodes(nodes);
      setPreviewRows(validRows.slice(0, 20));
      setWarnings(localWarnings);
      
    } catch (e: any) {
      setError(e?.message || 'خطا در خواندن فایل اکسل');
    } finally {
      setLoading(false);
    }
  }, [expectedColumns]);

  const handleConfirmImport = () => {
    if (parsedNodes && parsedNodes.length > 0) {
      onImported(parsedNodes);
      setOpen(false);
    }
  };

  const handleDownloadTemplate = () => {
    const header = expectedColumns;
    const sampleData = [
      // مرحله 1: تعریف کشورها
      ['ایران', 'IR', '', '', '', ''],
      ['آمریکا', 'US', '', '', '', ''],
      ['روسیه', 'RU', '', '', '', ''],
      // مرحله 2: تعریف گروه‌ها
      ['ایران', 'IR', 'نیروی زمینی', 'G1', '', ''],
      ['ایران', 'IR', 'نیروی هوایی', 'G2', '', ''],
      ['آمریکا', 'US', 'Army', 'G1', '', ''],
      ['آمریکا', 'US', 'Navy', 'G2', '', ''],
      // مرحله 3: تعریف رده‌ها
      ['ایران', 'IR', 'نیروی زمینی', 'G1', 'سرهنگ', 'R5'],
      ['ایران', 'IR', 'نیروی زمینی', 'G1', 'سرهنگ دوم', 'R4'],
      ['ایران', 'IR', 'نیروی هوایی', 'G2', 'سرتیپ', 'R6'],
      ['آمریکا', 'US', 'Army', 'G1', 'Colonel', 'R5'],
      ['آمریکا', 'US', 'Navy', 'G2', 'Captain', 'R5'],
    ];
    
    const ws = XLSX.utils.aoa_to_sheet([header, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Military Ranks');
    XLSX.writeFile(wb, `military_ranks_template_${categoryId}.xlsx`);
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
              id={`military-excel-input-${categoryId}`}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.currentTarget.value = '';
              }}
            />
            <label htmlFor={`military-excel-input-${categoryId}`}>
              <Button component="span" variant="contained" startIcon={<UploadFileIcon />}>
                انتخاب فایل اکسل
              </Button>
            </label>
            <Typography variant="body2" color="text.secondary">
              ستون‌های مورد نیاز: {expectedColumns.join(', ')}
            </Typography>
            <Button variant="outlined" onClick={handleDownloadTemplate}>
              دانلود قالب اکسل
            </Button>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>راهنمای فرمت فایل:</strong>
              <br />• <strong>کشور:</strong> نام کشور (مثل ایران، آمریکا)
              <br />• <strong>کد کشور:</strong> دو حرف انگلیسی (مثل IR, US)
              <br />• <strong>گروه رده‌ای:</strong> نام گروه (مثل نیروی زمینی، Army)
              <br />• <strong>کد گروه رده‌ای:</strong> با G شروع شود (مثل G1, G2)
              <br />• <strong>رده نظامی:</strong> نام درجه (مثل سرهنگ، Colonel)
              <br />• <strong>کد رده نظامی:</strong> با R شروع شود (مثل R1, R5)
              <br />
              <br /><strong>نحوه ورود تدریجی:</strong>
              <br />1️⃣ ابتدا فقط کشور و کد کشور را پر کنید
              <br />2️⃣ سپس گروه‌ها را اضافه کنید
              <br />3️⃣ در نهایت رده‌ها را تکمیل کنید
            </Typography>
          </Alert>

          {parsedNodes && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                {`ردیف‌های شناسایی‌شده: ${previewRows.length} | درجات استخراج‌شده: ${parsedNodes.length}`}
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
                      {expectedColumns.map((col, idx) => (
                        <TableCell key={idx}>{col}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewRows.map((r, i) => (
                      <TableRow key={i}>
                        {/* کشور */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {r[1] && (
                              <Chip size="small" label={`[${String(r[1]).toUpperCase()}]`} color="success" variant="outlined" />
                            )}
                            <Typography variant="body2">{r[0] || r[1]}</Typography>
                          </Box>
                        </TableCell>
                        {/* کد کشور */}
                        <TableCell>{r[1]}</TableCell>
                        {/* گروه رده‌ای */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {r[3] && (
                              <Chip size="small" label={`[${String(r[3]).toUpperCase()}]`} color="info" variant="outlined" />
                            )}
                            {r[1] && (
                              <Chip size="small" label={`[${String(r[1]).toUpperCase()}]`} color="default" variant="outlined" />
                            )}
                            <Typography variant="body2">{r[2] || r[3]}</Typography>
                          </Box>
                        </TableCell>
                        {/* کد گروه رده‌ای */}
                        <TableCell>{r[3]}</TableCell>
                        {/* رده نظامی */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {r[3] && (
                              <Chip size="small" label={`[${String(r[3]).toUpperCase()}]`} color="info" variant="outlined" />
                            )}
                            {r[1] && (
                              <Chip size="small" label={`[${String(r[1]).toUpperCase()}]`} color="default" variant="outlined" />
                            )}
                            <Typography variant="body2">{r[4]}</Typography>
                          </Box>
                        </TableCell>
                        {/* کد رده نظامی */}
                        <TableCell>{r[5]}</TableCell>
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
          <Button onClick={handleConfirmImport} disabled={!parsedNodes || parsedNodes.length === 0} variant="contained">
            ورود
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MilitaryRanksExcelImporter;
