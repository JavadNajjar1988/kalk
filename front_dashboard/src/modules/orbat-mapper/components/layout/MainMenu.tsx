import React, { useState } from 'react';
import { 
  Menu, 
  MenuItem, 
  IconButton, 
  Typography, 
  Box,
  Divider,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  Menu as MenuIcon,
  Save as SaveIcon,
  Download as ExportIcon,
  Upload as ImportIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  Share as ShareIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';

interface MainMenuProps {
  onAction: (action: string) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onAction }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuAction = (action: string) => {
    handleClose();
    onAction(action);
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{ 
          color: 'rgb(156 163 175)',
          '&:hover': { 
            backgroundColor: 'rgb(55 65 81)', 
            color: 'white' 
          }
        }}
      >
        <MenuIcon />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'main-menu-button',
        }}
        sx={{
          '& .MuiPaper-root': {
            minWidth: 220,
            fontFamily: 'Vazirmatn, sans-serif'
          }
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            منوی اصلی
          </Typography>
        </Box>
        
        <Divider />

        <MenuItem onClick={() => handleMenuAction('save')}>
          <ListItemIcon>
            <SaveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>ذخیره سناریو</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleMenuAction('export')}>
          <ListItemIcon>
            <ExportIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>صادرات</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleMenuAction('import')}>
          <ListItemIcon>
            <ImportIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>وارد کردن داده</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleMenuAction('copy')}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>کپی به کلیپ‌بورد</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem onClick={() => handleMenuAction('share')}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>اشتراک‌گذاری</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleMenuAction('info')}>
          <ListItemIcon>
            <InfoIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>اطلاعات سناریو</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem onClick={() => handleMenuAction('settings')}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>تنظیمات</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default MainMenu;