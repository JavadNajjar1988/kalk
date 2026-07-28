/**
 * بخش مدیریت ویدئوی اینترو کالک‌نگار برای یک سناریو
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  LinearProgress,
} from '@mui/material';
import { CloudUpload, DeleteOutline, Movie, Save } from '@mui/icons-material';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppDispatch } from '@/store';
import { updateScenario } from '@/store/slices/scenariosSlice';
import { scenarioApiService } from '@/services/api/scenarioApiService';
import type { EnhancedScenario } from '@/types';
import {
  showErrorNotification,
  showSuccessNotification,
} from '@/store/slices/uiSlice';

const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const VIDEO_CONTENT_TYPES = new Set([
  'application/octet-stream',
  'video/mp4',
  'video/webm',
]);

interface PendingUpload {
  filename: string;
  url: string;
}

const normalizedValue = (value?: string | null) => value?.trim() || '';

const readBlobBytes = (blob: Blob): Promise<Uint8Array> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.readAsArrayBuffer(blob);
  });

export const hasExpectedVideoSignature = async (
  file: File,
  extension: '.mp4' | '.webm'
) => {
  const header = await readBlobBytes(file.slice(0, 64));
  if (extension === '.mp4') {
    return (
      header.length >= 12 &&
      String.fromCharCode(...header.slice(4, 8)) === 'ftyp'
    );
  }
  return (
    header.length >= 4 &&
    header[0] === 0x1a &&
    header[1] === 0x45 &&
    header[2] === 0xdf &&
    header[3] === 0xa3
  );
};

export const buildScenarioIntroUpdates = (
  title: string,
  summary: string,
  videoUrl: string
) => ({
  intro_title: title.trim() || null,
  intro_summary: summary.trim() || null,
  intro_video_url: videoUrl.trim() || null,
});

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
  const [removing, setRemoving] = useState(false);
  const [saving, setSaving] = useState(false);
  const pendingUploadRef = useRef<PendingUpload | null>(null);
  const loadedScenarioIdRef = useRef(scenario.id);

  const deletePendingUpload = useCallback(async (upload: PendingUpload) => {
    await scenarioApiService.deleteScenarioIntroVideo(upload.filename);
  }, []);

  useEffect(() => {
    if (loadedScenarioIdRef.current !== scenario.id) {
      const pendingUpload = pendingUploadRef.current;
      pendingUploadRef.current = null;
      loadedScenarioIdRef.current = scenario.id;
      if (pendingUpload) {
        void deletePendingUpload(pendingUpload).catch(() => undefined);
      }
    }
    setTitle(scenario.intro_title ?? '');
    setSummary(scenario.intro_summary ?? '');
    setVideoUrl(scenario.intro_video_url ?? '');
  }, [
    deletePendingUpload,
    scenario.id,
    scenario.intro_title,
    scenario.intro_summary,
    scenario.intro_video_url,
  ]);

  useEffect(
    () => () => {
      const pendingUpload = pendingUploadRef.current;
      pendingUploadRef.current = null;
      if (pendingUpload) {
        void deletePendingUpload(pendingUpload).catch(() => undefined);
      }
    },
    [deletePendingUpload]
  );

  const handlePickVideo: React.ChangeEventHandler<
    HTMLInputElement
  > = async e => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const lower = file.name.toLowerCase();
    const extension = lower.endsWith('.mp4')
      ? '.mp4'
      : lower.endsWith('.webm')
        ? '.webm'
        : null;
    if (
      !extension ||
      (file.type && !VIDEO_CONTENT_TYPES.has(file.type.toLowerCase()))
    ) {
      dispatch(showErrorNotification(t('scenarios.intro.videoTypeError')));
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      dispatch(showErrorNotification(t('scenarios.intro.videoSizeError')));
      return;
    }
    try {
      if (!(await hasExpectedVideoSignature(file, extension))) {
        dispatch(showErrorNotification(t('scenarios.intro.videoTypeError')));
        return;
      }
    } catch {
      dispatch(showErrorNotification(t('scenarios.intro.videoTypeError')));
      return;
    }
    setUploading(true);
    try {
      const uploaded = await scenarioApiService.uploadScenarioIntroVideo(file);
      const previousPendingUpload = pendingUploadRef.current;
      pendingUploadRef.current = uploaded;
      if (
        previousPendingUpload &&
        previousPendingUpload.filename !== uploaded.filename
      ) {
        void deletePendingUpload(previousPendingUpload).catch(() => undefined);
      }
      const { url } = uploaded;
      setVideoUrl(url);
      dispatch(showSuccessNotification(t('scenarios.intro.uploadSuccess')));
    } catch {
      dispatch(showErrorNotification(t('scenarios.intro.uploadError')));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveVideo = async () => {
    const pendingUpload = pendingUploadRef.current;
    pendingUploadRef.current = null;
    setVideoUrl('');
    if (!pendingUpload) return;

    setRemoving(true);
    try {
      await deletePendingUpload(pendingUpload);
    } catch {
      dispatch(showErrorNotification(t('scenarios.intro.cleanupError')));
    } finally {
      setRemoving(false);
    }
  };

  const hasChanges =
    normalizedValue(title) !== normalizedValue(scenario.intro_title) ||
    normalizedValue(summary) !== normalizedValue(scenario.intro_summary) ||
    normalizedValue(videoUrl) !== normalizedValue(scenario.intro_video_url);

  const handleSave = async () => {
    setSaving(true);
    try {
      await dispatch(
        updateScenario({
          id: scenario.id,
          updates: buildScenarioIntroUpdates(title, summary, videoUrl),
        })
      ).unwrap();
      pendingUploadRef.current = null;
      dispatch(showSuccessNotification(t('scenarios.intro.saveSuccess')));
    } catch {
      dispatch(showErrorNotification(t('scenarios.intro.saveError')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography
        variant="h6"
        gutterBottom
        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
      >
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

      <Box
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 720 }}
      >
        <Button
          variant="outlined"
          component="label"
          startIcon={<CloudUpload />}
          disabled={uploading || removing || readOnly}
        >
          {t('scenarios.intro.uploadButton')}
          <input
            type="file"
            accept=".mp4,.webm,video/mp4,video/webm"
            hidden
            onChange={handlePickVideo}
          />
        </Button>
        {uploading && <LinearProgress />}

        {videoUrl.trim() && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              p: 2,
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Typography variant="subtitle2">
              {t('scenarios.intro.previewTitle')}
            </Typography>
            <Box
              component="video"
              src={videoUrl}
              controls
              preload="metadata"
              sx={{
                width: '100%',
                maxHeight: 360,
                bgcolor: 'common.black',
                borderRadius: 1,
              }}
            >
              {t('scenarios.intro.unsupportedPlayback')}
            </Box>
            {!readOnly && (
              <Box>
                <Button
                  color="error"
                  variant="outlined"
                  size="small"
                  startIcon={<DeleteOutline />}
                  onClick={handleRemoveVideo}
                  disabled={uploading || removing || saving}
                >
                  {t('scenarios.intro.deleteVideo')}
                </Button>
              </Box>
            )}
          </Box>
        )}

        <TextField
          label={t('scenarios.intro.videoUrlLabel')}
          value={videoUrl}
          onChange={e => setVideoUrl(e.target.value)}
          fullWidth
          size="small"
          helperText={t('scenarios.intro.videoUrlHelper')}
          InputProps={{ readOnly }}
        />

        <TextField
          label={t('scenarios.intro.introTitleLabel')}
          value={title}
          onChange={e => setTitle(e.target.value)}
          fullWidth
          size="small"
          InputProps={{ readOnly }}
        />

        <TextField
          label={t('scenarios.intro.summaryLabel')}
          value={summary}
          onChange={e => setSummary(e.target.value)}
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
              disabled={saving || uploading || removing || !hasChanges}
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
