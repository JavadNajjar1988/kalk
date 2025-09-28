import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import type { User } from '../types';

interface UserCardProps {
  user: User;
  onView?: (user: User) => void;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onView, onEdit, onDelete }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'نظامی': return 'success';
      case 'آزاد': return 'info';
      case 'غیرنظامی': return 'warning';
      default: return 'default';
    }
  };

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case 'مرد': return 'primary';
      case 'زن': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Card
      sx={{
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: (theme) => theme.shadows[8],
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent>
        {/* Header with Avatar */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar 
            sx={{ 
              width: 48, 
              height: 48, 
              mr: 2,
              bgcolor: 'primary.main',
              fontSize: '1.2rem'
            }}
          >
            {user.personalInfo.fullName?.charAt(0) || 'ک'}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" noWrap>
              {user.personalInfo.fullName || 'نام نامشخص'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.personalInfo.nationalId || 'شناسه نامشخص'}
            </Typography>
          </Box>
        </Box>

        {/* Status Chips */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip
            label={user.legalInfo.status}
            color={getStatusColor(user.legalInfo.status) as any}
            size="small"
          />
          <Chip
            label={user.personalInfo.gender}
            color={getGenderColor(user.personalInfo.gender) as any}
            variant="outlined"
            size="small"
          />
          <Chip
            label={user.isActive ? 'فعال' : 'غیرفعال'}
            color={user.isActive ? 'success' : 'default'}
            variant="outlined"
            size="small"
          />
        </Box>

        {/* Info */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            تابعیت: {user.personalInfo.nationality || 'نامشخص'}
          </Typography>
          
          {user.contactInfo.mobile.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              موبایل: {user.contactInfo.mobile[0]}
            </Typography>
          )}

          {user.contactInfo.email.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              ایمیل: {user.contactInfo.email[0]}
            </Typography>
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            {new Date(user.createdAt).toLocaleDateString('fa-IR')}
          </Typography>
        </Box>
        <Box>
          {onView && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onView(user);
              }}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          )}
          {onEdit && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(user);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {onDelete && (
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(user);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </CardActions>
    </Card>
  );
};

export default UserCard;