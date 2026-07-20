import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
  alpha,
  Tooltip,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
  SelectAll as SelectAllIcon,
  Clear as ClearIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
} from '@mui/icons-material';

interface BulkOperationsProps {
  selectedItems: string[];
  totalItems: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkEdit?: () => void;
  onBulkArchive?: () => void;
  onBulkUnarchive?: () => void;
  itemType: 'category' | 'definition';
  disabled?: boolean;
}

const BulkOperations: React.FC<BulkOperationsProps> = ({
  selectedItems,
  totalItems,
  onSelectAll,
  onClearSelection,
  onBulkDelete,
  onBulkEdit,
  onBulkArchive,
  onBulkUnarchive,
  itemType,
  disabled = false,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectAll = () => {
    onSelectAll();
    handleClose();
  };

  const handleClearSelection = () => {
    onClearSelection();
    handleClose();
  };

  const handleBulkDelete = () => {
    onBulkDelete();
    handleClose();
  };

  const handleBulkEdit = () => {
    onBulkEdit?.();
    handleClose();
  };

  const handleBulkArchive = () => {
    onBulkArchive?.();
    handleClose();
  };

  const handleBulkUnarchive = () => {
    onBulkUnarchive?.();
    handleClose();
  };

  const isAllSelected = selectedItems.length === totalItems && totalItems > 0;
  const isPartiallySelected = selectedItems.length > 0 && selectedItems.length < totalItems;

  if (totalItems === 0 || selectedItems.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        mb: 2,
        borderRadius: 2,
        backgroundColor: alpha(theme.palette.primary.main, 0.04),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
        backdropFilter: 'blur(8px)',
        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.08)}`,
      }}
    >
      {/* نمایش تعداد آیتم‌های انتخاب شده */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CheckBoxIcon color="primary" fontSize="small" />
        <Typography variant="body2" color="text.primary" fontWeight={500}>
          {selectedItems.length} از {totalItems} {itemType === 'category' ? 'دسته‌بندی' : 'تعریف'} انتخاب شده
        </Typography>
      </Box>

      {/* دکمه‌های عملیات */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
        {/* انتخاب همه */}
        {!isAllSelected && (
          <Tooltip title="انتخاب همه">
            <IconButton
              size="small"
              onClick={handleSelectAll}
              disabled={disabled}
              sx={{
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              <SelectAllIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        {/* پاک کردن انتخاب */}
        <Tooltip title="پاک کردن انتخاب">
          <IconButton
            size="small"
            onClick={handleClearSelection}
            disabled={disabled}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: alpha(theme.palette.text.secondary, 0.08),
              },
            }}
          >
            <ClearIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* منوی عملیات بیشتر */}
        <IconButton
          size="small"
          onClick={handleClick}
          disabled={disabled}
          sx={{
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: alpha(theme.palette.text.secondary, 0.08),
            },
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{
            sx: {
              boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 0 4px 16px ${alpha(theme.palette.common.black, 0.08)}`,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              backdropFilter: 'blur(8px)',
            }
          }}
        >
          <MenuItem onClick={handleSelectAll}>
            <ListItemIcon>
              <SelectAllIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>انتخاب همه</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={handleClearSelection}>
            <ListItemIcon>
              <ClearIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>پاک کردن انتخاب</ListItemText>
          </MenuItem>

          <MenuItem onClick={handleBulkEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>ویرایش گروهی</ListItemText>
          </MenuItem>

          <MenuItem onClick={handleBulkArchive}>
            <ListItemIcon>
              <ArchiveIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>آرشیو کردن</ListItemText>
          </MenuItem>

          <MenuItem onClick={handleBulkUnarchive}>
            <ListItemIcon>
              <UnarchiveIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>خارج کردن از آرشیو</ListItemText>
          </MenuItem>

          <MenuItem onClick={handleBulkDelete} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>حذف گروهی</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default BulkOperations;
