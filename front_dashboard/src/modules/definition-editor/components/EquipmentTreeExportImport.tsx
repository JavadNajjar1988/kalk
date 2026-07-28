import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';

// Icons
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FolderIcon from '@mui/icons-material/Folder';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import TableChartIcon from '@mui/icons-material/TableChart';
import CodeIcon from '@mui/icons-material/Code';

// Excel libraries
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { formatPersianFileDate } from '@/utils/dateUtils';

// Types
import { TreeNode } from './common/TreePathPicker';

interface EquipmentTreeExportImportProps {
  treeData: TreeNode[];
  onTreeDataChange: (newTreeData: TreeNode[]) => void;
}

const EquipmentTreeExportImport: React.FC<EquipmentTreeExportImportProps> = ({
  treeData,
  onTreeDataChange,
}) => {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState<string>('');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'json'>('excel');
  const [importFormat, setImportFormat] = useState<'excel' | 'json'>('excel');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // تبدیل درخت به آرایه مسطح برای Excel
  const flattenTreeToArray = (
    nodes: TreeNode[],
    parentPath: string = ''
  ): any[] => {
    const result: any[] = [];

    nodes.forEach(node => {
      const currentPath = parentPath
        ? `${parentPath} > ${node.name}`
        : node.name;

      result.push({
        مسیر: currentPath,
        'نام فارسی': node.name,
        'نام انگلیسی': node.englishName,
        ترتیب: node.order,
      });

      if (node.children && node.children.length > 0) {
        result.push(...flattenTreeToArray(node.children, currentPath));
      }
    });

    return result;
  };

  // Export ساختار درخت
  const handleExport = () => {
    if (exportFormat === 'excel') {
      // Export به Excel
      const flattenedData = flattenTreeToArray(treeData);

      // ایجاد workbook و worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(flattenedData);

      // تنظیم عرض ستون‌ها
      const colWidths = [
        { wch: 50 }, // مسیر
        { wch: 30 }, // نام فارسی
        { wch: 30 }, // نام انگلیسی
        { wch: 10 }, // ترتیب
      ];
      ws['!cols'] = colWidths;

      // اضافه کردن worksheet به workbook
      XLSX.utils.book_append_sheet(wb, ws, 'ساختار تجهیزات');

      // ذخیره فایل
      const fileName = `ساختار_تجهیزات_${formatPersianFileDate()}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } else {
      // Export به JSON
      const jsonData = JSON.stringify(treeData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const fileName = `ساختار_تجهیزات_${formatPersianFileDate()}.json`;
      saveAs(blob, fileName);
    }
  };

  // Import از فایل
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    const reader = new FileReader();

    reader.onload = e => {
      const content = e.target?.result as string;
      setImportData(content);
    };

    if (importFormat === 'excel') {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  // اعتبارسنجی داده‌های import
  const validateImportData = () => {
    setIsValidating(true);
    setImportErrors([]);
    setImportSuccess([]);

    try {
      let parsedData: any;

      if (importFormat === 'excel') {
        // پردازش فایل Excel
        const workbook = XLSX.read(importData, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // تبدیل داده‌های Excel به ساختار درخت
        parsedData = convertExcelToTree(jsonData);
      } else {
        // پردازش فایل JSON
        parsedData = JSON.parse(importData);
      }

      // اعتبارسنجی ساختار داده
      if (!Array.isArray(parsedData)) {
        setImportErrors(['داده‌های وارد شده باید آرایه‌ای از گره‌ها باشد']);
        setIsValidating(false);
        return false;
      }

      // بررسی ساختار هر گره
      const errors: string[] = [];
      const validateNode = (node: any, path: string = ''): boolean => {
        if (!node.id || !node.name || !node.englishName) {
          errors.push(
            `گره در مسیر "${path}" فاقد فیلدهای اجباری است (id, name, englishName)`
          );
          return false;
        }

        if (node.children && !Array.isArray(node.children)) {
          errors.push(`فیلد children در گره "${node.name}" باید آرایه باشد`);
          return false;
        }

        if (node.children) {
          node.children.forEach((child: any) => {
            validateNode(child, `${path} > ${node.name}`);
          });
        }

        return true;
      };

      parsedData.forEach((node: any) => {
        validateNode(node);
      });

      if (errors.length > 0) {
        setImportErrors(errors);
        setIsValidating(false);
        return false;
      }

      setImportSuccess(['داده‌های وارد شده معتبر است و آماده import می‌باشد']);
      setIsValidating(false);
      return true;
    } catch (error) {
      setImportErrors([`خطا در پردازش فایل: ${error}`]);
      setIsValidating(false);
      return false;
    }
  };

  // تبدیل داده‌های Excel به ساختار درخت
  const convertExcelToTree = (excelData: any[]): TreeNode[] => {
    const treeMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    excelData.forEach((row: any, index: number) => {
      const path = row['مسیر'] || '';
      const name = row['نام فارسی'] || '';
      const englishName = row['نام انگلیسی'] || '';
      const order = parseInt(row['ترتیب']) || index + 1;

      if (!path || !name || !englishName) return;

      const pathParts = path.split(' > ');
      const nodeId = `imported_${Date.now()}_${index}`;

      const node: TreeNode = {
        id: nodeId,
        name,
        englishName,
        order,
        children: [],
        isActive: true,
      };

      if (pathParts.length === 1) {
        // گره ریشه
        rootNodes.push(node);
      } else {
        // گره فرزند
        const parentPath = pathParts.slice(0, -1).join(' > ');
        const parentNode = treeMap.get(parentPath);
        if (parentNode) {
          parentNode.children = parentNode.children || [];
          parentNode.children.push(node);
        }
      }

      treeMap.set(path, node);
    });

    return rootNodes.sort((a, b) => a.order - b.order);
  };

  // اعمال import
  const handleImport = () => {
    if (validateImportData()) {
      try {
        let parsedData: TreeNode[];

        if (importFormat === 'excel') {
          const workbook = XLSX.read(importData, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          parsedData = convertExcelToTree(jsonData);
        } else {
          parsedData = JSON.parse(importData);
        }

        onTreeDataChange(parsedData);
        setIsImportDialogOpen(false);
        setImportData('');
        setSelectedFileName('');
        setImportErrors([]);
        setImportSuccess([]);
      } catch (error) {
        setImportErrors([`خطا در import: ${error}`]);
      }
    }
  };

  // باز کردن دیالوگ import
  const openImportDialog = () => {
    setIsImportDialogOpen(true);
    setImportData('');
    setSelectedFileName('');
    setImportErrors([]);
    setImportSuccess([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 2,
        boxShadow: theme =>
          `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
        overflow: 'hidden',
      }}
    >
      {/* عنوان و توضیحات */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={600} color="primary">
          خروجی و ورودی ساختار تجهیزات
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          می‌توانید ساختار درختی تجهیزات را به صورت فایل Excel یا JSON خروجی
          بگیرید یا از فایل وارد کنید.
        </Typography>
      </Box>

      {/* بخش Export */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          خروجی ساختار
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="body2">فرمت خروجی:</Typography>
          <ToggleButtonGroup
            value={exportFormat}
            exclusive
            onChange={(_, newFormat) => newFormat && setExportFormat(newFormat)}
            size="small"
          >
            <ToggleButton value="excel">
              <TableChartIcon sx={{ mr: 1 }} />
              Excel
            </ToggleButton>
            <ToggleButton value="json">
              <CodeIcon sx={{ mr: 1 }} />
              JSON
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Button
          variant="contained"
          startIcon={<FileDownloadIcon />}
          onClick={handleExport}
          disabled={treeData.length === 0}
        >
          خروجی {exportFormat === 'excel' ? 'Excel' : 'JSON'}
        </Button>

        {treeData.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            هیچ داده‌ای برای خروجی وجود ندارد.
          </Alert>
        )}
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* بخش Import */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          ورودی ساختار
        </Typography>

        <Button
          variant="outlined"
          startIcon={<FileUploadIcon />}
          onClick={openImportDialog}
        >
          ورودی از فایل
        </Button>
      </Box>

      {/* دیالوگ Import */}
      <Dialog
        open={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { direction: 'rtl' },
        }}
      >
        <DialogTitle>ورودی ساختار تجهیزات</DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* انتخاب فرمت */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                فرمت فایل:
              </Typography>
              <ToggleButtonGroup
                value={importFormat}
                exclusive
                onChange={(_, newFormat) =>
                  newFormat && setImportFormat(newFormat)
                }
                size="small"
              >
                <ToggleButton value="excel">
                  <TableChartIcon sx={{ mr: 1 }} />
                  Excel
                </ToggleButton>
                <ToggleButton value="json">
                  <CodeIcon sx={{ mr: 1 }} />
                  JSON
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* انتخاب فایل */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                انتخاب فایل:
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept={importFormat === 'excel' ? '.xlsx,.xls' : '.json'}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <Button
                variant="outlined"
                onClick={() => fileInputRef.current?.click()}
                startIcon={<FileUploadIcon />}
              >
                انتخاب فایل {importFormat === 'excel' ? 'Excel' : 'JSON'}
              </Button>
              {selectedFileName && (
                <Chip
                  label={selectedFileName}
                  color="primary"
                  variant="outlined"
                  sx={{ ml: 1 }}
                />
              )}
            </Box>

            {/* نمایش خطاها */}
            {importErrors.length > 0 && (
              <Alert severity="error">
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  خطاهای اعتبارسنجی:
                </Typography>
                <List dense>
                  {importErrors.map((error, index) => (
                    <ListItem key={index} sx={{ py: 0 }}>
                      <ListItemIcon>
                        <WarningIcon color="error" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={error} />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}

            {/* نمایش موفقیت */}
            {importSuccess.length > 0 && (
              <Alert severity="success">
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  نتایج اعتبارسنجی:
                </Typography>
                <List dense>
                  {importSuccess.map((message, index) => (
                    <ListItem key={index} sx={{ py: 0 }}>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={message} />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}

            {/* اطلاعات */}
            <Alert severity="info">
              <Typography variant="body2">
                <strong>نکات مهم:</strong>
              </Typography>
              <Typography variant="body2" component="div">
                <ul>
                  <li>
                    فایل Excel باید شامل ستون‌های: مسیر، نام فارسی، نام انگلیسی،
                    ترتیب باشد
                  </li>
                  <li>
                    فایل JSON باید شامل آرایه‌ای از گره‌ها با ساختار صحیح باشد
                  </li>
                  <li>هر گره باید دارای id، name، englishName باشد</li>
                  <li>import جدید جایگزین ساختار فعلی خواهد شد</li>
                </ul>
              </Typography>
            </Alert>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setIsImportDialogOpen(false)}
            variant="outlined"
          >
            انصراف
          </Button>
          <Button
            onClick={validateImportData}
            variant="outlined"
            disabled={!importData}
          >
            اعتبارسنجی
          </Button>
          <Button
            onClick={handleImport}
            variant="contained"
            disabled={!importData || importErrors.length > 0}
          >
            ورودی
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default EquipmentTreeExportImport;
