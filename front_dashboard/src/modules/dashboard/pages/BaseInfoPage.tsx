import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, IconButton, MenuItem, Select, FormControl, InputLabel, Tabs, Tab
} from '@mui/material';
import { Storage, Add, Delete, Edit } from '@mui/icons-material';
import { TreeView, TreeItem } from '@mui/lab';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Tree, NodeModel } from '@minoru/react-dnd-treeview';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

// مدل داده‌ای ساده
interface FieldDef {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select';
}
interface EntityType {
  id: string;
  name: string;
  group: string; // گروه اصلی (مثلاً نظامی، کشوری)
  subgroup?: string; // زیرگروه (مثلاً جنگ‌افزارها)
  fields: FieldDef[];
}
interface EntityItem {
  id: string;
  entityTypeId: string;
  values: Record<string, any>;
  parentId?: string;
}

const LOCAL_KEY = 'baseInfoData';

interface BaseInfoData {
  entityTypes: EntityType[];
  items: EntityItem[];
}

const defaultData: BaseInfoData = {
  entityTypes: [],
  items: [],
};

// گروه‌های پیش‌فرض (قابل توسعه توسط کاربر در آینده)
const DEFAULT_GROUPS = [
  { key: 'military', label: 'نظامی' },
  { key: 'geo', label: 'تقسیم‌بندی کشوری' },
  { key: 'custom', label: 'سفارشی' },
];

const DEFAULT_SUBGROUPS: Record<string, { key: string; label: string }[]> = {
  military: [
    { key: 'weapons', label: 'جنگ‌افزارها' },
    { key: 'ranks', label: 'درجه‌ها' },
    { key: 'personnel', label: 'استعداد رده' },
  ],
  geo: [
    { key: 'provinces', label: 'استان‌ها' },
    { key: 'cities', label: 'شهرها' },
    { key: 'regions', label: 'مناطق' },
  ],
  custom: [],
};

// مدل داده‌ای برای سلسله‌مراتب جغرافیایی
interface GeoNode {
  id: string;
  name: string;
  customLabel: string; // نام سطح (مثلاً کشور، ایالت، ...)
  children?: GeoNode[];
}

const GEO_TREE_KEY = 'baseInfoGeoTree';

const defaultGeoTree: GeoNode[] = [
  {
    id: '1',
    name: 'آسیا',
    customLabel: 'قاره',
    children: [
      {
        id: '2',
        name: 'ایران',
        customLabel: 'کشور',
        children: [
          {
            id: '3',
            name: 'تهران',
            customLabel: 'استان',
            children: [
              {
                id: '4',
                name: 'تهران',
                customLabel: 'شهر',
                children: [],
              },
              {
                id: '5',
                name: 'ری',
                customLabel: 'شهر',
                children: [],
              }
            ],
          },
          {
            id: '6',
            name: 'اصفهان',
            customLabel: 'استان',
            children: [
              {
                id: '7',
                name: 'اصفهان',
                customLabel: 'شهر',
                children: [],
              }
            ],
          }
        ],
      },
      {
        id: '8',
        name: 'چین',
        customLabel: 'کشور',
        children: [],
      }
    ],
  },
];

// تبدیل GeoNode به NodeModel برای TreeView جدید
const geoTreeToNodes = (nodes: GeoNode[], parent: number | string = 0): NodeModel<GeoNode>[] =>
  nodes.flatMap(n => [
    {
      id: n.id,
      parent: parent,
      text: `${n.customLabel}: ${n.name}`,
      droppable: true,
      data: n,
    },
    ...(n.children ? geoTreeToNodes(n.children, n.id) : [])
  ]);

const nodesToGeoTree = (nodes: NodeModel<GeoNode>[], parent: number | string = 0): GeoNode[] =>
  nodes
    .filter(n => n.parent === parent)
    .map(n => ({
      id: n.id as string,
      name: n.data?.name || '',
      customLabel: n.data?.customLabel || '',
      children: nodesToGeoTree(nodes, n.id as string),
    }));

const BaseInfoPage: React.FC = () => {
  // State
  const [data, setData] = useState<BaseInfoData>(defaultData);
  const [selectedType, setSelectedType] = useState<EntityType | null>(null);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [typeName, setTypeName] = useState('');
  const [typeGroup, setTypeGroup] = useState('military');
  const [typeSubgroup, setTypeSubgroup] = useState('');
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [fieldName, setFieldName] = useState('');
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState<'text' | 'number' | 'select'>('text');
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [itemValues, setItemValues] = useState<Record<string, any>>({});
  const [itemParentId, setItemParentId] = useState<string>('');
  const [tab, setTab] = useState(0);
  const [subTab, setSubTab] = useState<Record<string, number>>({}); // کلید: گروه اصلی، مقدار: ایندکس زیرتب
  // State برای درخت جغرافیایی
  const [geoTree, setGeoTree] = useState<GeoNode[]>(defaultGeoTree);
  const [geoNodes, setGeoNodes] = useState<NodeModel<GeoNode>[]>(geoTreeToNodes(defaultGeoTree));
  const [geoDialogOpen, setGeoDialogOpen] = useState(false);
  const [geoEditNode, setGeoEditNode] = useState<GeoNode | null>(null);
  const [geoParentId, setGeoParentId] = useState<string>('');
  const [geoName, setGeoName] = useState('');
  const [geoLabel, setGeoLabel] = useState('');

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) {
      setData(JSON.parse(saved));
    }
  }, []);
  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  }, [data]);

  // بارگذاری و ذخیره‌سازی localStorage
  useEffect(() => {
    const saved = localStorage.getItem(GEO_TREE_KEY);
    if (saved) setGeoTree(JSON.parse(saved));
  }, []);
  useEffect(() => {
    localStorage.setItem(GEO_TREE_KEY, JSON.stringify(geoTree));
  }, [geoTree]);

  // همگام‌سازی geoTree و geoNodes
  useEffect(() => {
    setGeoNodes(geoTreeToNodes(geoTree));
  }, [geoTree]);
  useEffect(() => {
    setGeoTree(nodesToGeoTree(geoNodes));
  }, [geoNodes]);

  // افزودن دسته جدید
  const handleAddType = () => {
    if (!typeName.trim()) return;
    // گروه اصلی را از تب فعال بگیر
    const groupKey = groupsToShow[tab]?.key || 'military';
    setData(prev => ({
      ...prev,
      entityTypes: [
        ...prev.entityTypes,
        { id: Date.now().toString(), name: typeName.trim(), group: groupKey, subgroup: typeSubgroup, fields: fields },
      ],
    }));
    setTypeDialogOpen(false);
    setTypeName('');
    setFields([]);
    setTypeSubgroup('');
  };
  // افزودن فیلد به دسته
  const handleAddField = () => {
    if (!fieldName.trim() || !fieldLabel.trim()) return;
    setFields(prev => ([...prev, { name: fieldName.trim(), label: fieldLabel.trim(), type: fieldType }]));
    setFieldName('');
    setFieldLabel('');
    setFieldType('text');
  };
  // حذف دسته
  const handleDeleteType = (id: string) => {
    setData(prev => ({
      ...prev,
      entityTypes: prev.entityTypes.filter(t => t.id !== id),
      items: prev.items.filter(i => i.entityTypeId !== id),
    }));
    if (selectedType?.id === id) setSelectedType(null);
  };
  // افزودن آیتم جدید
  const handleAddItem = () => {
    if (!selectedType) return;
    setData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Date.now().toString(),
          entityTypeId: selectedType.id,
          values: itemValues,
          parentId: itemParentId || undefined,
        },
      ],
    }));
    setItemDialogOpen(false);
    setItemValues({});
    setItemParentId('');
  };
  // حذف آیتم
  const handleDeleteItem = (id: string) => {
    setData(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== id && i.parentId !== id),
    }));
  };

  // افزودن یا ویرایش نود
  const handleSaveGeoNode = () => {
    if (!geoName.trim() || !geoLabel.trim()) return;
    if (geoEditNode) {
      // ویرایش
      setGeoNodes(prev => prev.map(n =>
        n.id === geoEditNode.id
          ? {
              ...n,
              text: `${geoLabel}: ${geoName}`,
              data: {
                id: n.data?.id ?? String(n.id),
                name: geoName,
                customLabel: geoLabel,
                children: n.data?.children,
              },
            }
          : n
      ));
    } else {
      // افزودن
      const newId = Date.now().toString();
      setGeoNodes(prev => [
        ...prev,
        {
          id: newId,
          parent: geoParentId || 0,
          text: `${geoLabel}: ${geoName}`,
          droppable: true,
          data: { id: newId, name: geoName, customLabel: geoLabel, children: [] },
        },
      ]);
    }
    setGeoDialogOpen(false);
    setGeoEditNode(null);
    setGeoParentId('');
    setGeoName('');
    setGeoLabel('');
  };
  // حذف نود
  const handleDeleteGeoNode = (id: string) => {
    // حذف نود و همه فرزندانش
    const removeWithChildren = (nodes: NodeModel<GeoNode>[], id: string): NodeModel<GeoNode>[] => {
      const idsToRemove = new Set<string>();
      const collect = (nid: string) => {
        idsToRemove.add(nid);
        nodes.filter(n => n.parent === nid).forEach(n => collect(n.id as string));
      };
      collect(id);
      return nodes.filter(n => !idsToRemove.has(n.id as string));
    };
    setGeoNodes(prev => removeWithChildren(prev, id));
  };
  // Drag & Drop
  const handleDrop = (newTree: NodeModel<GeoNode>[]) => {
    setGeoNodes(newTree);
  };
  // باز کردن دیالوگ افزودن
  const openAddGeoDialog = (parentId?: string) => {
    setGeoEditNode(null);
    setGeoParentId(parentId || '');
    setGeoName('');
    setGeoLabel('');
    setGeoDialogOpen(true);
  };
  // باز کردن دیالوگ ویرایش
  const openEditGeoDialog = (node: GeoNode) => {
    setGeoEditNode(node);
    setGeoName(node.name);
    setGeoLabel(node.customLabel);
    setGeoDialogOpen(true);
  };
  // رندر درخت جغرافیایی
  const renderGeoTree = (nodes: GeoNode[]) =>
    nodes.map(node => (
      <TreeItem
        key={node.id}
        nodeId={node.id}
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography>{node.customLabel}: {node.name}</Typography>
            <IconButton size="small" onClick={e => { e.stopPropagation(); openAddGeoDialog(node.id); }} title="افزودن زیرمجموعه"><Add fontSize="small" /></IconButton>
            <IconButton size="small" onClick={e => { e.stopPropagation(); openEditGeoDialog(node); }} title="ویرایش"><Edit fontSize="small" /></IconButton>
            <IconButton size="small" onClick={e => { e.stopPropagation(); handleDeleteGeoNode(node.id); }} title="حذف"><Delete fontSize="small" /></IconButton>
          </Box>
        }
      >
        {node.children && node.children.length > 0 && renderGeoTree(node.children)}
      </TreeItem>
    ));

  // رندر درخت جغرافیایی با Drag & Drop
  const renderGeoTreeDnd = () => (
    <DndProvider backend={HTML5Backend}>
      <Box sx={{ mb: 2 }}>
        <Button startIcon={<Add />} variant="contained" size="small" onClick={() => openAddGeoDialog()}>
          افزودن قاره/سطح جدید
        </Button>
      </Box>
      <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Tree
          tree={geoNodes}
          rootId={0}
          render={(node, { depth, isOpen, onToggle }) => (
            <Box
              sx={{ pl: depth * 2, display: 'flex', alignItems: 'center', gap: 1, cursor: 'grab' }}
            >
              <DragIndicatorIcon fontSize="small" color="disabled" />
              {node.droppable && (
                <IconButton size="small" onClick={onToggle}>{isOpen ? <ExpandMoreIcon /> : <ChevronRightIcon />}</IconButton>
              )}
              <Typography>{node.text}</Typography>
              <IconButton size="small" onClick={e => { e.stopPropagation(); openAddGeoDialog(node.id as string); }} title="افزودن زیرمجموعه"><Add fontSize="small" /></IconButton>
              <IconButton size="small" onClick={e => { e.stopPropagation(); openEditGeoDialog(node.data!); }} title="ویرایش"><Edit fontSize="small" /></IconButton>
              <IconButton size="small" onClick={e => { e.stopPropagation(); handleDeleteGeoNode(node.id as string); }} title="حذف"><Delete fontSize="small" /></IconButton>
            </Box>
          )}
          dragPreviewRender={monitor => <Box>{monitor.item.text}</Box>}
          onDrop={handleDrop}
        />
      </Paper>
      {renderGeoDialog()}
    </DndProvider>
  );

  // فرم افزودن دسته
  const renderTypeDialog = () => (
    <Dialog open={typeDialogOpen} onClose={() => setTypeDialogOpen(false)}>
      <DialogTitle>افزودن دسته جدید</DialogTitle>
      <DialogContent>
        <TextField
          label="نام دسته"
          value={typeName}
          onChange={e => setTypeName(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        {/* حذف انتخاب گروه اصلی */}
        {DEFAULT_SUBGROUPS[typeGroup]?.length > 0 && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>زیرگروه</InputLabel>
            <Select value={typeSubgroup} label="زیرگروه" onChange={e => setTypeSubgroup(e.target.value)}>
              <MenuItem value="">بدون زیرگروه</MenuItem>
              {DEFAULT_SUBGROUPS[typeGroup].map(sg => (
                <MenuItem key={sg.key} value={sg.key}>{sg.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <Typography variant="subtitle1">فیلدها:</Typography>
        {fields.map((f, idx) => (
          <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
            <Typography>{f.label} ({f.type})</Typography>
          </Box>
        ))}
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <TextField
            label="نام فیلد (انگلیسی)"
            value={fieldName}
            onChange={e => setFieldName(e.target.value)}
            size="small"
          />
          <TextField
            label="برچسب فیلد (فارسی)"
            value={fieldLabel}
            onChange={e => setFieldLabel(e.target.value)}
            size="small"
          />
          <FormControl size="small">
            <InputLabel>نوع</InputLabel>
            <Select value={fieldType} label="نوع" onChange={e => setFieldType(e.target.value as any)}>
              <MenuItem value="text">متن</MenuItem>
              <MenuItem value="number">عدد</MenuItem>
              <MenuItem value="select">انتخابی</MenuItem>
            </Select>
          </FormControl>
          <Button onClick={handleAddField} variant="outlined" size="small">افزودن فیلد</Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setTypeDialogOpen(false)}>انصراف</Button>
        <Button onClick={handleAddType} variant="contained">ذخیره دسته</Button>
      </DialogActions>
    </Dialog>
  );

  // فرم افزودن آیتم
  const renderItemDialog = () => (
    <Dialog open={itemDialogOpen} onClose={() => setItemDialogOpen(false)}>
      <DialogTitle>افزودن آیتم جدید</DialogTitle>
      <DialogContent>
        {selectedType?.fields.map(f => (
          <TextField
            key={f.name}
            label={f.label}
            value={itemValues[f.name] || ''}
            onChange={e => setItemValues(v => ({ ...v, [f.name]: e.target.value }))}
            fullWidth
            sx={{ mb: 2 }}
            type={f.type === 'number' ? 'number' : 'text'}
          />
        ))}
        {/* انتخاب والد */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>والد (اختیاری)</InputLabel>
          <Select
            value={itemParentId}
            label="والد (اختیاری)"
            onChange={e => setItemParentId(e.target.value)}
          >
            <MenuItem value="">بدون والد</MenuItem>
            {data.items.filter(i => i.entityTypeId === selectedType?.id).map(i => (
              <MenuItem key={i.id} value={i.id}>
                {selectedType?.fields[0]?.name
                  ? i.values[selectedType.fields[0].name] || i.id
                  : i.id}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setItemDialogOpen(false)}>انصراف</Button>
        <Button onClick={handleAddItem} variant="contained">ذخیره آیتم</Button>
      </DialogActions>
    </Dialog>
  );

  // گروه‌های فعال (بر اساس entityTypes موجود)
  const activeGroups = DEFAULT_GROUPS.filter(g =>
    data.entityTypes.some(t => t.group === g.key)
  );
  // اگر هیچ گروهی وجود ندارد، همه را نمایش بده
  const groupsToShow = activeGroups.length > 0 ? activeGroups : DEFAULT_GROUPS;

  // زیرگروه‌های فعال برای هر گروه
  const getActiveSubgroups = (groupKey: string) => {
    const subgroups = DEFAULT_SUBGROUPS[groupKey] || [];
    // اگر هیچ entityType با این subgroup نبود، فقط زیرگروه‌هایی که entityType دارند را نمایش بده
    const subgroupsWithData = subgroups.filter(sg =>
      data.entityTypes.some(t => t.group === groupKey && t.subgroup === sg.key)
    );
    return subgroupsWithData.length > 0 ? subgroupsWithData : subgroups;
  };

  // entityTypes فیلترشده بر اساس گروه و زیرگروه
  const getTypesForTab = (groupKey: string, subgroupKey?: string) =>
    data.entityTypes.filter(t => t.group === groupKey && (subgroupKey ? t.subgroup === subgroupKey : !t.subgroup));

  // رندر لیست دسته‌ها و آیتم‌ها برای هر تب
  const renderTabContent = (groupKey: string, subgroupKey?: string) => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <Button startIcon={<Add />} variant="contained" size="small" onClick={() => {
          setTypeGroup(groupKey);
          setTypeSubgroup(subgroupKey || '');
          setTypeDialogOpen(true);
        }}>
          افزودن دسته جدید
        </Button>
      </Box>
      <List>
        {getTypesForTab(groupKey, subgroupKey).map(type => (
          <ListItem
            key={type.id}
            secondaryAction={
              <>
                <IconButton edge="end" onClick={() => setSelectedType(type)} title="مدیریت آیتم‌ها"><Edit /></IconButton>
                <IconButton edge="end" onClick={() => handleDeleteType(type.id)} title="حذف دسته"><Delete /></IconButton>
              </>
            }
            sx={{ bgcolor: selectedType?.id === type.id ? 'primary.50' : undefined, borderRadius: 2, mb: 1 }}
          >
            <ListItemText
              primary={type.name}
              secondary={type.fields.map(f => f.label).join('، ')}
              sx={{ cursor: 'pointer' }}
              onClick={() => setSelectedType(type)}
            />
          </ListItem>
        ))}
      </List>
      {/* لیست آیتم‌های دسته انتخاب شده */}
      {selectedType && getTypesForTab(groupKey, subgroupKey).some(t => t.id === selectedType.id) && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
            <Typography variant="h6">آیتم‌های دسته: {selectedType.name}</Typography>
            <Button startIcon={<Add />} variant="outlined" size="small" onClick={() => setItemDialogOpen(true)}>
              افزودن آیتم جدید
            </Button>
            <Button size="small" onClick={() => setSelectedType(null)} sx={{ ml: 2 }}>بازگشت</Button>
          </Box>
          <List>
            {data.items.filter(i => i.entityTypeId === selectedType.id).map(item => (
              <ListItem
                key={item.id}
                secondaryAction={
                  <IconButton edge="end" onClick={() => handleDeleteItem(item.id)} title="حذف آیتم"><Delete /></IconButton>
                }
                sx={{ borderRadius: 2, mb: 1 }}
              >
                <ListItemText
                  primary={selectedType.fields.map(f => `${f.label}: ${item.values[f.name] || ''}`).join(' | ')}
                  secondary={item.parentId ? `والد: ${data.items.find(i => i.id === item.parentId)?.values[selectedType.fields[0]?.name] || item.parentId}` : ''}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );

  // دیالوگ افزودن/ویرایش نود جغرافیایی
  const renderGeoDialog = () => (
    <Dialog open={geoDialogOpen} onClose={() => setGeoDialogOpen(false)}>
      <DialogTitle>{geoEditNode ? 'ویرایش' : 'افزودن'} سطح جغرافیایی</DialogTitle>
      <DialogContent>
        <TextField
          label="نام سطح (مثلاً کشور، استان، شهر)"
          value={geoLabel}
          onChange={e => setGeoLabel(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          label="نام این سطح (مثلاً ایران، تهران، ... )"
          value={geoName}
          onChange={e => setGeoName(e.target.value)}
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setGeoDialogOpen(false)}>انصراف</Button>
        <Button onClick={handleSaveGeoNode} variant="contained">ذخیره</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ p: 4 }}>
      <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
        <Storage sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
        <Typography variant="h4" gutterBottom>اطلاعات پایه</Typography>
        <Typography variant="body1" color="text.secondary">
          در این بخش می‌توانید گروه‌های مختلف اطلاعات پایه را به صورت تب‌های مجزا مدیریت کنید. هر گروه می‌تواند زیرمجموعه (زیرتب) داشته باشد و هر زیرمجموعه شامل دسته‌های اطلاعاتی و آیتم‌های مربوط به خود است.
        </Typography>
      </Paper>
      {/* تب‌های گروه اصلی */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        {groupsToShow.map((g, idx) => (
          <Tab key={g.key} label={g.label} />
        ))}
      </Tabs>
      {/* تب‌های زیرگروه */}
      {groupsToShow[tab] && getActiveSubgroups(groupsToShow[tab].key).length > 0 && (
        <Tabs
          value={subTab[groupsToShow[tab].key] || 0}
          onChange={(_, v) => setSubTab(s => ({ ...s, [groupsToShow[tab].key]: v }))}
          sx={{ mb: 2, pl: 2 }}
        >
          {getActiveSubgroups(groupsToShow[tab].key).map((sg, idx) => (
            <Tab key={sg.key} label={sg.label} />
          ))}
        </Tabs>
      )}
      {/* محتوای تب */}
      {(() => {
        const groupKey = groupsToShow[tab]?.key;
        // فقط برای geo درخت گرافیکی با Drag & Drop نمایش بده
        if (groupKey === 'geo') {
          return renderGeoTreeDnd();
        }
        // سایر تب‌ها مثل قبل
        const subgroups = getActiveSubgroups(groupKey);
        if (groupKey && subgroups.length > 0) {
          const subIdx = subTab[groupKey] || 0;
          const subgroupKey = subgroups[subIdx]?.key;
          return renderTabContent(groupKey, subgroupKey);
        } else if (groupKey) {
          return renderTabContent(groupKey);
        }
        return null;
      })()}
      {renderTypeDialog()}
      {renderItemDialog()}
    </Box>
  );
};

export default BaseInfoPage;
