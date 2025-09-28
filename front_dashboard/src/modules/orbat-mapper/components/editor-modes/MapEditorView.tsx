import React from 'react';
import { Box, Typography, Paper, Card, CardContent } from '@mui/material';
import { Map as MapIcon } from '@mui/icons-material';
import { EnhancedScenario } from '../../../../types';

interface MapEditorViewProps {
  scenario: EnhancedScenario;
}

const MapEditorView: React.FC<MapEditorViewProps> = ({ scenario }) => {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <MapIcon color="primary" />
          <Typography variant="h5" sx={{ fontFamily: 'Vazirmatn, sans-serif' }}>
            حالت ویرایش نقشه
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          ویرایش واحدها و عناصر روی نقشه تعاملی
        </Typography>
      </Paper>

      {/* Main Map Area */}
      <Box sx={{ flex: 1, display: 'flex', gap: 2 }}>
        {/* Map Container */}
        <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ textAlign: 'center' }}>
              <MapIcon sx={{ fontSize: 120, color: 'action.disabled', mb: 2 }} />
              <Typography variant="h4" color="text.secondary" gutterBottom>
                نقشه تعاملی
              </Typography>
              <Typography variant="body1" color="text.secondary">
                در حال توسعه - نمایش نقشه OpenLayers
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                ویژگی‌های پیش‌بینی شده:
              </Typography>
              <Box component="ul" sx={{ textAlign: 'right', mt: 1 }}>
                <li>نمایش واحدهای نظامی روی نقشه</li>
                <li>کشیدن و رها کردن واحدها</li>
                <li>ترسیم خطوط و اشکال</li>
                <li>اندازه‌گیری فاصله و مساحت</li>
                <li>لایه‌های مختلف نقشه</li>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Right Sidebar - Unit Tree & Tools */}
        <Card sx={{ width: 300, display: 'flex', flexDirection: 'column' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              ابزارها و واحدها
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • درخت واحدهای نظامی
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • ابزارهای ترسیم
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • لایه‌های نقشه
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • تنظیمات نمایش
            </Typography>
            
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                سناریو فعلی: {scenario.name}
              </Typography>
              <br />
              <Typography variant="caption" color="text.secondary">
                تعداد واحدها: {scenario.units?.length || 0}
              </Typography>
              <br />
              <Typography variant="caption" color="text.secondary">
                وضعیت: {scenario.status}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default MapEditorView;