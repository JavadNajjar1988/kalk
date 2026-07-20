import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Fade,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Fade in={true} timeout={300}>
          <Box sx={{ p: 3 }}>
            {children}
          </Box>
        </Fade>
      )}
    </div>
  );
};

interface TabData {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
  badge?: number;
}

interface TabContainerProps {
  tabs: TabData[];
  defaultTab?: number;
  onChange?: (tabIndex: number, tabId: string) => void;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'standard' | 'scrollable' | 'fullWidth';
  indicatorColor?: 'primary' | 'secondary';
  textColor?: 'primary' | 'secondary' | 'inherit';
  centered?: boolean;
  sx?: any;
}

const TabContainer: React.FC<TabContainerProps> = ({
  tabs,
  defaultTab = 0,
  onChange,
  orientation = 'horizontal',
  variant = 'standard',
  indicatorColor = 'primary',
  textColor = 'primary',
  centered = false,
  sx,
}) => {
  const theme = useTheme();
  const [value, setValue] = useState(defaultTab);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    if (onChange) {
      onChange(newValue, tabs[newValue]?.id);
    }
  };

  const a11yProps = (index: number) => {
    return {
      id: `tab-${index}`,
      'aria-controls': `tabpanel-${index}`,
    };
  };

  if (tabs.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          هیچ تبی برای نمایش وجود ندارد
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', ...sx }}>
      <Paper
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Tabs
          value={value}
          onChange={handleChange}
          orientation={orientation}
          variant={variant}
          indicatorColor={indicatorColor}
          textColor={textColor}
          centered={centered}
          sx={{
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
            '& .MuiTab-root': {
              minHeight: 48,
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 500,
              minWidth: 120,
              padding: theme.spacing(1, 2),
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                opacity: 1,
              },
              '&.Mui-selected': {
                fontWeight: 600,
              },
              '&.Mui-disabled': {
                opacity: 0.5,
              },
            },
          }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={tab.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography component="span" variant="inherit">
                    {tab.label}
                  </Typography>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <Box
                      sx={{
                        backgroundColor: theme.palette.error.main,
                        color: theme.palette.error.contrastText,
                        borderRadius: '10px',
                        minWidth: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        px: 0.5,
                      }}
                    >
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </Box>
                  )}
                </Box>
              }
              disabled={tab.disabled}
              {...a11yProps(index)}
            />
          ))}
        </Tabs>
      </Paper>

      {tabs.map((tab, index) => (
        <TabPanel key={tab.id} value={value} index={index}>
          {tab.content}
        </TabPanel>
      ))}
    </Box>
  );
};

export default TabContainer;