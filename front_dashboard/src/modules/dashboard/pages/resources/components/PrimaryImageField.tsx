import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Stack, Typography, Avatar } from '@mui/material';
import {
  AddPhotoAlternate as AddPhotoIcon,
  SwapHoriz as SwapIcon,
  Delete as DeleteIcon,
  ImageNotSupported as NoImageIcon,
} from '@mui/icons-material';
import resourceApiService from '@/services/api/resourceApiService';

interface PrimaryImageFieldProps {
  /** شناسهٔ مدیای فعلی منبع (در صورت وجود). */
  primaryMediaId?: string | null;
  /** فایل انتخاب‌شده توسط کاربر برای آپلود (در حالت ایجاد یا تعویض). */
  selectedFile?: File | null;
  /** پرچمی که نشان می‌دهد کاربر می‌خواهد تصویر فعلی حذف شود. */
  clearExisting?: boolean;
  /** بازگرداندن وضعیت جدید به والد. */
  onChange: (next: { selectedFile: File | null; clearExisting: boolean }) => void;
  /** غیرفعال‌سازی کنترل‌ها. */
  disabled?: boolean;
  /** برچسب نمایش بالای کامپوننت. */
  label?: string;
}

/**
 * فیلد «تصویر اصلی» منبع.
 * - اگر کاربر فایل جدید انتخاب کرده باشد، پیش‌نمایش از روی فایل انجام می‌شود.
 * - وگرنه اگر `primaryMediaId` موجود است، تصویر از API گرفته می‌شود.
 * - حذف، فقط روی state داخلی پرچم می‌گذارد؛ والد در زمان ذخیره عمل واقعی را انجام می‌دهد.
 */
const PrimaryImageField: React.FC<PrimaryImageFieldProps> = ({
  primaryMediaId,
  selectedFile,
  clearExisting,
  onChange,
  disabled,
  label = 'تصویر اصلی',
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
    return undefined;
  }, [selectedFile]);

  const remoteUrl = useMemo(() => {
    if (clearExisting) return null;
    if (!primaryMediaId) return null;
    return resourceApiService.getMediaUrl(primaryMediaId);
  }, [primaryMediaId, clearExisting]);

  const displayUrl = previewUrl || remoteUrl;

  const handlePick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      onChange({ selectedFile: file, clearExisting: false });
    }
    e.target.value = '';
  };

  const handleRemove = () => {
    if (selectedFile) {
      onChange({ selectedFile: null, clearExisting: clearExisting ?? false });
      return;
    }
    if (primaryMediaId && !clearExisting) {
      onChange({ selectedFile: null, clearExisting: true });
    }
  };

  const hasAnyImage = !!displayUrl;

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center">
        {hasAnyImage ? (
          <Avatar
            variant="rounded"
            src={displayUrl || undefined}
            sx={{ width: 96, height: 96, border: '1px solid', borderColor: 'divider' }}
          />
        ) : (
          <Avatar
            variant="rounded"
            sx={{
              width: 96,
              height: 96,
              border: '1px dashed',
              borderColor: 'divider',
              bgcolor: 'background.default',
              color: 'text.secondary',
            }}
          >
            <NoImageIcon />
          </Avatar>
        )}

        <Stack spacing={1}>
          <Button
            variant="outlined"
            size="small"
            onClick={handlePick}
            disabled={disabled}
            startIcon={hasAnyImage ? <SwapIcon /> : <AddPhotoIcon />}
            sx={{ borderRadius: 2 }}
          >
            {hasAnyImage ? 'تعویض تصویر' : 'انتخاب تصویر'}
          </Button>
          {hasAnyImage && (
            <Button
              variant="text"
              size="small"
              color="error"
              onClick={handleRemove}
              disabled={disabled}
              startIcon={<DeleteIcon />}
            >
              حذف تصویر
            </Button>
          )}
          {selectedFile && (
            <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 200, wordBreak: 'break-all' }}>
              {selectedFile.name}
            </Typography>
          )}
          {clearExisting && !selectedFile && (
            <Typography variant="caption" color="warning.main">
              تصویر قبلی پس از ذخیره حذف می‌شود.
            </Typography>
          )}
        </Stack>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleFileChange}
        />
      </Stack>
    </Box>
  );
};

export default PrimaryImageField;
