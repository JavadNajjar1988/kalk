import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs,
  Tab,
  Divider,
  alpha,
  Alert,
  Button
} from '@mui/material';

// Components
import TreePathPicker from './common/TreePathPicker';
import FieldManager from './fields/FieldManager';
import FieldPreview from './fields/FieldPreview';
import EquipmentTreeExportImport from './EquipmentTreeExportImport';

// Icons
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PreviewIcon from '@mui/icons-material/Preview';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

// Redux
import { 
  selectCustomFieldsByNodeId,
  setCustomFieldDefinitions 
} from '../store/equipmentFieldsSlice';

// Types
import { DefinitionCategory, TreeNode } from '../types/equipment';

interface EquipmentFieldsModuleProps {
  category: DefinitionCategory;
  treeData: TreeNode[];
  onTreeDataChange?: (newTreeData: TreeNode[]) => void;
}

const EquipmentFieldsModule: React.FC<EquipmentFieldsModuleProps> = ({ 
  treeData,
  onTreeDataChange
}) => {
  
  // حالت‌های کامپوننت
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [localTreeData, setLocalTreeData] = useState<TreeNode[]>(treeData);

  // همگام‌سازی state داخلی با ورودی وقتی که از بیرون تغییر می‌کند
  React.useEffect(() => {
    setLocalTreeData(treeData);
  }, [treeData]);
  
  // دریافت فیلدهای سفارشی از Redux
  const nodeId = selectedNode?.id || '';
  const customFields = useSelector((state: any) => selectCustomFieldsByNodeId(state, nodeId));
  
  // اگر فیلدهای سفارشی در Redux برای این گره خالی است ولی روی نود دادهی اولیه دارد، آن‌ها را به Redux تزریق کن
  React.useEffect(() => {
    if (!selectedNode || !nodeId) return;
    const nodeHasDefaults = Array.isArray(selectedNode.customFields) && selectedNode.customFields.length > 0;
    const reduxEmpty = !customFields || customFields.length === 0;
    if (nodeHasDefaults && reduxEmpty) {
      dispatch(setCustomFieldDefinitions({ nodeId, fields: selectedNode.customFields as any }));
    }
  }, [dispatch, nodeId, selectedNode, customFields]);

  // اگر نه Redux و نه نود انتخاب‌شده فیلدی ندارند، از فایل JSON پیش‌فرض گره را جستجو کن و فیلدها را تزریق کن
  React.useEffect(() => {
    if (!selectedNode || !nodeId) return;
    const reduxEmpty = !customFields || customFields.length === 0;
    const nodeHasDefaults = Array.isArray(selectedNode.customFields) && selectedNode.customFields.length > 0;
    if (!reduxEmpty || nodeHasDefaults) return;
    
    const findById = (nodes: any[], id: string): any | null => {
      for (const n of nodes) {
        if (n.id === id) return n;
        if (Array.isArray(n.children)) {
          const f = findById(n.children, id);
          if (f) return f;
        }
      }
      return null;
    };
    
    (async () => {
      try {
        // Try logistics.json first for nodes with numeric IDs or specific patterns
        let mod: any;
        try {
          mod = await import('../data/json/logistics.json');
          const defaults = (mod.default?.nodes || []) as any[];
          const target = findById(defaults, nodeId);
          if (target && Array.isArray(target.customFields) && target.customFields.length > 0) {
            dispatch(setCustomFieldDefinitions({ nodeId, fields: target.customFields }));
            return;
          }
        } catch (logisticsError) {
          console.log('Logistics JSON not found or invalid:', logisticsError);
        }
        
        // Fallback to equipment.json
        try {
          mod = await import('../data/json/equipment.json');
          const defaults = (mod.default?.nodes || []) as any[];
          const target = findById(defaults, nodeId);
          if (target && Array.isArray(target.customFields) && target.customFields.length > 0) {
            dispatch(setCustomFieldDefinitions({ nodeId, fields: target.customFields }));
          }
        } catch (equipmentError) {
          console.log('Equipment JSON not found or invalid:', equipmentError);
        }
      } catch (error) {
        console.log('Could not load field definitions:', error);
      }
    })();
  }, [dispatch, nodeId, selectedNode, customFields]);
  
  // به‌روزرسانی درخت محلی
  const handleTreeDataChange = (newTreeData: TreeNode[]) => {
    setLocalTreeData(newTreeData);
    if (onTreeDataChange) {
      onTreeDataChange(newTreeData);
    }
  };
  
  // پیدا کردن مسیر کامل به گره
  const getFullPathNames = (path: string[]): string => {
    if (!path.length) return '';
    
    const findNodeName = (id: string): string => {
      const findNode = (nodes: TreeNode[], nodeId: string): TreeNode | null => {
        for (const node of nodes) {
          if (node.id === nodeId) return node;
          if (node.children) {
            const found = findNode(node.children, nodeId);
            if (found) return found;
          }
        }
        return null;
      };
      
      const node = findNode(localTreeData, id);
      return node ? node.name : id;
    };
    
    return path.map(findNodeName).join(' > ');
  };
  
  // مدیریت تغییر مسیر
  const handlePathChange = (path: string[], node: TreeNode | null) => {
    setSelectedPath(path);
    setSelectedNode(node);
  };
  
  // تغییر تب فعال
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  return (
    <Paper 
      sx={{ 
        p: 3, 
        borderRadius: 2,
        boxShadow: (theme) => `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
        overflow: 'hidden'
      }}
    >
      {/* عنوان و توضیحات */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600} color="primary">
          مدیریت فیلدها
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          در این بخش می‌توانید فیلدهای سفارشی را برای دسته‌بندی‌های مختلف مدیریت کنید.
          فیلدهای تعریف شده در هر گره به تمام زیرمجموعه‌های آن به ارث می‌رسند و در فرم‌های مربوطه استفاده خواهند شد.
        </Typography>
      </Box>
      
      {/* تب‌ها */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
        >
          <Tab 
            icon={<AccountTreeIcon />} 
            label="انتخاب مسیر" 
            iconPosition="start"
          />
          <Tab 
            icon={<ListAltIcon />} 
            label="مدیریت فیلدها" 
            iconPosition="start"
            disabled={!selectedNode}
          />
          <Tab 
            icon={<PreviewIcon />} 
            label="پیش‌نمایش فرم" 
            iconPosition="start"
            disabled={!selectedNode}
          />
          <Tab 
            icon={<FileDownloadIcon />} 
            label="خروجی/ورودی" 
            iconPosition="start"
          />
        </Tabs>
      </Box>
      
      {/* محتوای تب‌ها */}
      <Box sx={{ mb: 3 }}>
        {/* تب انتخاب مسیر */}
        {activeTab === 0 && (
          <TreePathPicker
            treeData={localTreeData}
            initialPath={selectedPath}
            onPathChange={handlePathChange}
            onTreeDataChange={handleTreeDataChange}
            title="انتخاب مسیر تجهیزات"
            description="مسیر مورد نظر خود را در ساختار درختی تجهیزات انتخاب کنید"
            allowEditing={true}
          />
        )}
        
        {/* تب مدیریت فیلدها */}
        {activeTab === 1 && selectedNode && (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>مسیر انتخاب شده:</strong> {getFullPathNames(selectedPath)}
              </Typography>
              <Typography variant="caption">
                فیلدهای تعریف شده در این گره به تمام زیرمجموعه‌های آن به ارث می‌رسند.
              </Typography>
            </Alert>
            
            <FieldManager
              nodeId={selectedNode.id}
              fields={customFields}
              title={`مدیریت فیلدهای ${selectedNode.name}`}
              description="فیلدهای مورد نیاز برای این گره را تعریف کنید"
              nodeName={selectedNode.name}
              enableSmartFieldBuilder={true}
            />
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                onClick={() => setActiveTab(2)}
                variant="outlined"
                color="primary"
              >
                مشاهده پیش‌نمایش
              </Button>
            </Box>
          </Box>
        )}
        
        {/* تب پیش‌نمایش فرم */}
        {activeTab === 2 && selectedNode && (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>مسیر انتخاب شده:</strong> {getFullPathNames(selectedPath)}
              </Typography>
              <Typography variant="caption">
                این پیش‌نمایش نشان‌دهنده فرمی است که کاربران در ماژول منابع برای این نوع تجهیزات مشاهده خواهند کرد.
              </Typography>
            </Alert>
            
            <FieldPreview
              fields={customFields}
              title={`فرم ${selectedNode.name}`}
              description="پیش‌نمایش فرم ایجاد شده بر اساس فیلدهای تعریف شده"
              nodeName={selectedNode.name}
            />
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                onClick={() => setActiveTab(1)}
                variant="outlined"
                color="primary"
              >
                بازگشت به مدیریت فیلدها
              </Button>
            </Box>
          </Box>
        )}
        
        {/* تب خروجی/ورودی */}
        {activeTab === 3 && (
          <EquipmentTreeExportImport
            treeData={localTreeData}
            onTreeDataChange={handleTreeDataChange}
          />
        )}
        
        {/* حالت بدون انتخاب */}
        {(activeTab !== 0 && activeTab !== 3 && !selectedNode) && (
          <Alert severity="warning">
            ابتدا یک مسیر در ساختار درختی تجهیزات انتخاب کنید.
          </Alert>
        )}
      </Box>
      
      {/* راهنمای کاربری */}
      <Divider sx={{ mb: 2 }} />
      <Typography variant="body2" color="text.secondary">
        <strong>راهنما:</strong> ابتدا مسیر مورد نظر خود را در ساختار درختی انتخاب کنید، سپس فیلدهای مورد نیاز را تعریف نمایید.
        فیلدهای تعریف شده در هر گره به تمام زیرمجموعه‌های آن به ارث می‌رسند و در فرم‌های مربوطه استفاده خواهند شد.
        از قابلیت Reference Fields برای اتصال فیلدها به دسته‌بندی‌های دیگر استفاده کنید.
      </Typography>
    </Paper>
  );
};

export default EquipmentFieldsModule;
