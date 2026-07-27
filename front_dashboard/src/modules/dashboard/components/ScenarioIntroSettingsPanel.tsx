/**
 * بخش مدیریت ویدئوی اینترو کالک‌نگار برای یک سناریو
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  LinearProgress,
} from '@mui/material';
import { Movie, Save, CloudUpload } from '@mui/icons-material';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppDispatch } from '@/store';
import { updateScenario } from '@/store/slices/scenariosSlice';
import { scenarioApiService } from '@/services/api/scenarioApiService';
import type { EnhancedScenario } from '@/types';
import { showErrorNotification, showSuccessNotification } from '@/store/slices/uiSlice';

const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

interface ScenarioIntroSettingsPanelProps {
  scenario: EnhancedScenario;
  readOnly?: boolean;
}

const ScenarioIntroSettingsPanel: React.FC<ScenarioIntroSettingsPanelProps> = ({
  scenario,
  readOnly = false,
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [title, setTitle] = useState(scenario.intro_title ?? '');
  const [summary, setSummary] = useState(scenario.intro_summary ?? '');
  const [videoUrl, setVideoUrl] = useState(scenario.intro_video_url ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(scenario.intro_title ?? '');
    setSummary(scenario.intro_summary ?? '');
    setVideoUrl(scenario.intro_video_url ?? '');
  }, [scenario.id, scenario.intro_title, scenario.intro_summary, scenario.intro_video_url]);

  const handlePickVideo: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.mp4') && !lower.endsWith('.webm')) {
      dispatch(showErrorNotification(t('scenarios.intro.videoTypeError')));
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      dispatch(showErrorNotification(t('scenarios.intro.videoSizeError')));
      return;
    }
    setUploading(true);
    try {
      const { url } = await scenarioApiService.uploadScenarioIntroVideo(file);
      setVideoUrl(url);
      dispatch(showSuccessNotification(t('scenarios.intro.uploadSuccess')));
    } catch {
      dispatch(showErrorNotification(t('scenarios.intro.uploadError')));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await dispatch(
        updateScenario({
          id: scenario.id,
          updates: {
            ...scenario,
            intro_title: title.trim() || null,
            intro_summary: summary.trim() || null,
            intro_video_url: videoUrl.trim() || null,
          },
        }),
      ).unwrap();
      dispatch(showSuccessNotification(t('scenarios.intro.saveSuccess')));
    } catch {
      dispatch(showErrorNotification(t('scenarios.intro.saveError')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Movie color="primary" />
        {t('scenarios.intro.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        {t('scenarios.intro.description')}
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        {readOnly
          ? 'اطلاعات اینترو فقط قابل مشاهده است؛ ویرایش آن به دسترسی مدیریت سناریو نیاز دارد.'
          : t('scenarios.intro.hint')}
      </Alert>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 720 }}>
        <Button
          variant="outlined"
          component="label"
          startIcon={<CloudUpload />}
          disabled={uploading || readOnly}
        >
          {t('scenarios.intro.uploadButton')}
          <input type="file" accept=".mp4,.webm,video/mp4,video/webm" hidden onChange={handlePickVideo} />
        </Button>
        {uploading && <LinearProgress />}

        <TextField
          label={t('scenarios.intro.videoUrlLabel')}
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          fullWidth
          size="small"
          helperText={t('scenarios.intro.videoUrlHelper')}
          InputProps={{ readOnly }}
        />

        <TextField
          label={t('scenarios.intro.introTitleLabel')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          size="small"
          InputProps={{ readOnly }}
        />

        <TextField
          label={t('scenarios.intro.summaryLabel')}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          fullWidth
          multiline
          minRows={4}
          helperText={t('scenarios.intro.summaryHelper')}
          InputProps={{ readOnly }}
        />

        {!readOnly && (
        <Box>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={saving || uploading}
          >
            {t('scenarios.intro.saveButton')}
          </Button>
        </Box>
        )}
      </Box>
    </Box>
  );
};

export default ScenarioIntroSettingsPanel;
