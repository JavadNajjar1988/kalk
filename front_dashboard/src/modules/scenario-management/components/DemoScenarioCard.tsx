/**
 * DemoScenarioCard Component
 * کامپوننت کارت نمایش سناریوهای نمونه
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  useTheme
} from '@mui/material';
import { DemoScenarioCardProps } from '../types';

const DemoScenarioCard: React.FC<DemoScenarioCardProps> = ({
  scenario,
  onClick,
  dense = false
}) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        height: dense ? 'auto' : 300,
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
          '& .demo-image': {
            transform: 'scale(1.05)'
          }
        }
      }}
      onClick={onClick}
    >
      {/* Image */}
      {scenario.imageUrl && (
        <CardMedia
          className="demo-image"
          component="img"
          height={dense ? 120 : 160}
          image={scenario.imageUrl}
          alt={scenario.name}
          sx={{
            transition: 'transform 0.2s ease-in-out',
            objectFit: 'cover',
            bgcolor: theme.palette.grey[100]
          }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      )}

      <CardContent
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          p: dense ? 2 : 3
        }}
      >
        {/* Title */}
        <Typography
          variant={dense ? 'subtitle2' : 'h6'}
          component="h3"
          sx={{
            fontWeight: 600,
            color: theme.palette.text.primary,
            mb: 1,
            lineHeight: 1.2
          }}
        >
          {scenario.name}
        </Typography>

        {/* Summary */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: dense ? 2 : 4,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.4
          }}
        >
          {scenario.summary}
        </Typography>

        {/* Demo badge */}
        <Box sx={{ mt: 'auto', pt: 2 }}>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.primary.main,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}
          >
            سناریوی نمونه
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DemoScenarioCard;