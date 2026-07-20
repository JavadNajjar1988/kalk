// Reference Field Properties Component
// کامپوننت ویژگی‌های فیلد مرجع به صورت ماژولار

import { memo, useState, useMemo } from 'react';
import {
  Box,
  Divider,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  AlertTitle
} from '@mui/material';
import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ReferenceBasicProperties from './ReferenceBasicProperties';
import ReferenceOptionalProperties from './ReferenceOptionalProperties';
import ReferenceContentProperties from './ReferenceContentProperties';
import ReferenceAssistiveProperties from './ReferenceAssistiveProperties';
import ReferenceBehaviorProperties from './ReferenceBehaviorProperties';
import ReferenceSecurityProperties from './ReferenceSecurityProperties';
import ReferenceDisplayProperties from './ReferenceDisplayProperties';

interface ReferenceFieldPropertiesProps {
  formData: ExtendedCustomFieldDefinition;
  onChange: (key: keyof ExtendedCustomFieldDefinition, value: any) => void;
}


const ensureRefConfig = (formData: ExtendedCustomFieldDefinition) => {
  return formData.referenceConfig || { };
};

const ReferenceFieldProperties = memo<ReferenceFieldPropertiesProps>(({ formData, onChange }) => {
  const [expanded, setExpanded] = useState<string | false>('basic');
  const refCfg = ensureRefConfig(formData);

  const updateRefConfig = (partial: Partial<NonNullable<typeof formData.referenceConfig>>) => {
    onChange('referenceConfig', { ...refCfg, ...partial });
  };

  const updateRefDataSource = (partial: Partial<NonNullable<ExtendedCustomFieldDefinition['referenceConfig']>['dataSource']>) => {
    // Clear previous data source configurations when type changes
    if (partial.type && partial.type !== refCfg.dataSource?.type) {
      updateRefConfig({ 
        dataSource: { 
          type: partial.type,
          ...(partial.type === 'static' ? { static: { items: [] } } : {}),
          ...(partial.type === 'table' ? { table: { tableName: '', valueField: '', displayFields: [] } } : {}),
          ...(partial.type === 'api' ? { api: { endpoint: '', valueField: '', displayFields: [] } } : {}),
          ...(partial.type === 'category' ? { category: { categoryId: '', sections: 'both' } } : {}),
          ...partial
        } 
      });
    } else {
      updateRefConfig({ dataSource: { ...(refCfg.dataSource || {}), ...partial } });
    }
  };

  const handleAcc = (panel: string) => (_e: any, isExpanded: boolean) => setExpanded(isExpanded ? panel : false);

  // Collect all critical errors from sections
  const criticalErrors = useMemo(() => {
    const errors: string[] = [];
    
    // Basic properties errors
    if (!formData.name?.trim()) errors.push('عنوان فیلد الزامی است');
    if (!formData.englishName?.trim()) errors.push('کلید یکتا الزامی است');
    
    // Content properties errors
    const isTable = refCfg.dataSource?.type === 'table';
    const isApi = refCfg.dataSource?.type === 'api';
    
    if (isTable && !refCfg.dataSource?.table?.valueField?.trim()) {
      errors.push('برای منبع Table، کلید مرجع الزامی است');
    }
    if (isApi && !refCfg.dataSource?.api?.valueField?.trim()) {
      errors.push('برای منبع API، کلید مرجع الزامی است');
    }
    
    if (isTable && (!refCfg.dataSource?.table?.displayFields || refCfg.dataSource.table.displayFields.length === 0)) {
      errors.push('برای منبع Table، حداقل یک فیلد نمایشی لازم است');
    }
    if (isApi && (!refCfg.dataSource?.api?.displayFields || refCfg.dataSource.api.displayFields.length === 0)) {
      errors.push('برای منبع API، حداقل یک فیلد نمایشی لازم است');
    }
    
    // Static items validation
    if (refCfg.dataSource?.type === 'static') {
      try {
        const items = refCfg.dataSource?.static?.items || [];
        if (!Array.isArray(items)) errors.push('آیتم‌های Static باید آرایه باشد');
        else {
          for (const it of items) {
            if (typeof it !== 'object' || it == null) {
              errors.push('هر آیتم Static باید شیء باشد');
              break;
            }
            if (typeof it.value !== 'string' || typeof it.label !== 'string') {
              errors.push('value و label در Static باید رشته باشند');
              break;
            }
          }
        }
      } catch {
        errors.push('آیتم‌های Static نامعتبر است');
      }
    }
    
    return errors;
  }, [formData, refCfg]);

  const hasCriticalErrors = criticalErrors.length > 0;

  return (
    <Box>
      {/* Critical Errors Summary */}
      {hasCriticalErrors && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>خطاهای بحرانی - ذخیره غیرفعال</AlertTitle>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {criticalErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Accordion expanded={expanded === 'basic'} onChange={handleAcc('basic')} sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>📝 ویژگی‌های عمومی</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <ReferenceBasicProperties formData={formData} onChange={onChange} />
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded === 'optional'} onChange={handleAcc('optional')} sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>💡 ویژگی‌های اختیاری</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <ReferenceOptionalProperties formData={formData} onChange={onChange} />
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded === 'content'} onChange={handleAcc('content')} sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>📦 ویژگی‌های محتوایی</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <ReferenceContentProperties formData={formData} onChange={onChange} updateRefConfig={updateRefConfig} updateRefDataSource={updateRefDataSource} refCfg={refCfg} />
        </AccordionDetails>
      </Accordion>

      {/* ویژگی‌های کمکی */}
      <Accordion expanded={expanded === 'assistive'} onChange={handleAcc('assistive')} sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>🎯 ویژگی‌های کمکی</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <ReferenceAssistiveProperties formData={formData} onChange={onChange} updateRefConfig={updateRefConfig} refCfg={refCfg} />
        </AccordionDetails>
      </Accordion>

      {/* ویژگی‌های رفتار و منطق */}
      <Accordion expanded={expanded === 'behavior'} onChange={handleAcc('behavior')} sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>⚙️ ویژگی‌های رفتار و منطق</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <ReferenceBehaviorProperties formData={formData} onChange={onChange} />
        </AccordionDetails>
      </Accordion>

      {/* امنیت و ذخیره‌سازی */}
      <Accordion expanded={expanded === 'security'} onChange={handleAcc('security')} sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>🔐 ویژگی‌های امنیت و ذخیره‌سازی</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <ReferenceSecurityProperties formData={formData} onChange={onChange} updateRefConfig={updateRefConfig} refCfg={refCfg} />
        </AccordionDetails>
      </Accordion>

      {/* ویژگی‌های نمایشی */}
      <Accordion expanded={expanded === 'display'} onChange={handleAcc('display')} sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>🎨 ویژگی‌های نمایشی</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <ReferenceDisplayProperties formData={formData} onChange={onChange} updateRefConfig={updateRefConfig} refCfg={refCfg} />
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ mt: 3 }} />
      <Box sx={{ mt: 2, color: 'text.secondary' }}>
        <Typography variant="caption">
          راهنما: برای هر بخش روی آیکون علامت سوال کلیک کنید تا توضیح و مثال را ببینید.
        </Typography>
        {hasCriticalErrors && (
          <Typography variant="caption" sx={{ color: 'error.main', display: 'block', mt: 1 }}>
            ⚠️ به دلیل وجود خطاهای بحرانی، امکان ذخیره فیلد وجود ندارد.
          </Typography>
        )}
      </Box>
    </Box>
  );
});

ReferenceFieldProperties.displayName = 'ReferenceFieldProperties';

export default ReferenceFieldProperties;


