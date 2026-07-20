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
  AccountBox as ResourceIcon,
} from '@mui/icons-material';
import type { Resource } from '../types';

interface ResourceCardProps {
  resource: Resource;
  onView?: (resource: Resource) => void;
  onEdit?: (resource: Resource) => void;
  onDelete?: (resource: Resource) => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onView, onEdit, onDelete }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'اشخاص کلیدی': return 'primary';
      case 'نظامی': return 'success';
      case 'غیرنظامی': return 'warning';
      default: return 'default';
    }
  };

  const getSubStatusColor = (subStatus: string) => {
    switch (subStatus) {
      case 'زنده': return 'success';
      case 'شهید': return 'error';
      case 'آسیب دیده': return 'warning';
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
            {resource.personalInfo?.fullName?.charAt(0) || <ResourceIcon />}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" noWrap>
              {resource.personalInfo?.fullName || 'نام نامشخص'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {resource.personalInfo?.nationalId || 'شناسه نامشخص'}
            </Typography>
          </Box>
        </Box>

        {/* Status Chips */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip
            label={resource.legalInfo.status}
            color={getStatusColor(resource.legalInfo.status) as any}
            size="small"
          />
          <Chip
            label={resource.legalInfo.subStatus}
            color={getSubStatusColor(resource.legalInfo.subStatus) as any}
            variant="outlined"
            size="small"
          />
          {resource.personalInfo?.gender && (
            <Chip
              label={resource.personalInfo.gender}
              color={getGenderColor(resource.personalInfo.gender) as any}
              variant="outlined"
              size="small"
            />
          )}
          <Chip
            label={resource.isActive ? 'فعال' : 'غیرفعال'}
            color={resource.isActive ? 'success' : 'default'}
            variant="outlined"
            size="small"
          />
        </Box>

        {/* Info */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {resource.personalInfo?.nationality && (
            <Typography variant="body2" color="text.secondary">
              تابعیت: {resource.personalInfo.nationality}
            </Typography>
          )}
          
          {resource.personalInfo?.militaryInfo?.rank && (
            <Typography variant="body2" color="text.secondary">
              درجه: {resource.personalInfo.militaryInfo.rank}
            </Typography>
          )}

          {resource.personalInfo?.civilianInfo?.occupation && (
            <Typography variant="body2" color="text.secondary">
              شغل: {resource.personalInfo.civilianInfo.occupation}
            </Typography>
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            {new Date(resource.createdAt).toLocaleDateString('fa-IR')}
          </Typography>
        </Box>
        <Box>
          {onView && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onView(resource);
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
                onEdit(resource);
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
                onDelete(resource);
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

export default ResourceCard;