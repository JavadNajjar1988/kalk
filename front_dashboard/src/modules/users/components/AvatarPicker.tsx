import React from 'react';
import { Avatar, Box, IconButton, Tooltip, Typography, alpha, useTheme } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import { AVATAR_OPTIONS, resolveAvatarSrc } from '../utils/avatarOptions';
import { getAccessLevelColor } from '../utils/userPresentation';

interface AvatarPickerProps {
  value?: string;
  accessLevel?: string;
  onChange: (avatar?: string) => void;
  disabled?: boolean;
}

const AvatarPicker: React.FC<AvatarPickerProps> = ({
  value,
  accessLevel,
  onChange,
  disabled = false,
}) => {
  const theme = useTheme();
  const color = getAccessLevelColor(theme, accessLevel);

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1.25, fontWeight: 700 }}>
        انتخاب آواتار پروفایل
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(58px, 1fr))',
          gap: 1,
        }}
      >
        <Tooltip title="بدون تصویر">
          <span>
            <IconButton
              disabled={disabled}
              aria-label="بدون آواتار"
              onClick={() => onChange(undefined)}
              sx={{
                width: 56,
                height: 56,
                border: `2px solid ${!value ? color : alpha(color, 0.2)}`,
                bgcolor: alpha(color, 0.08),
              }}
            >
              <PersonIcon sx={{ color }} />
              {!value && (
                <CheckCircleIcon
                  sx={{ position: 'absolute', right: -3, bottom: -3, color, bgcolor: 'background.paper', borderRadius: '50%' }}
                />
              )}
            </IconButton>
          </span>
        </Tooltip>
        {AVATAR_OPTIONS.map((option) => {
          const selected = value === option.id;
          return (
            <Tooltip title={`آواتار ${option.id.replace('avatar-', '')}`} key={option.id}>
              <span>
                <IconButton
                  disabled={disabled}
                  aria-label={`انتخاب ${option.id}`}
                  onClick={() => onChange(option.id)}
                  sx={{
                    width: 56,
                    height: 56,
                    p: 0.25,
                    border: `2px solid ${selected ? color : 'transparent'}`,
                  }}
                >
                  <Avatar src={resolveAvatarSrc(option.id)} sx={{ width: 48, height: 48 }} />
                  {selected && (
                    <CheckCircleIcon
                      sx={{ position: 'absolute', right: -3, bottom: -3, color, bgcolor: 'background.paper', borderRadius: '50%' }}
                    />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
};

export default AvatarPicker;
