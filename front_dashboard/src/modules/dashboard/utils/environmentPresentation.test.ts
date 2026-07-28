import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ENVIRONMENT_SIDC,
  environmentalKindLabel,
  environmentalParameters,
  environmentalSidc,
} from './environmentPresentation';

describe('environment presentation', () => {
  it('provides military symbols for every supported condition kind', () => {
    expect(Object.keys(DEFAULT_ENVIRONMENT_SIDC)).toHaveLength(24);
    Object.values(DEFAULT_ENVIRONMENT_SIDC).forEach(sidc => {
      expect(sidc).toMatch(/^[A-Z]-/);
    });
  });

  it('localizes labels and parameter values', () => {
    const condition = {
      id: 'rain-1',
      kind: 'precipitation' as const,
      startTime: 0,
      parameters: { mode: 'rain', intensity: 0.6, rateMmPerHour: 8 },
    };

    expect(environmentalKindLabel(condition)).toBe('بارش');
    expect(environmentalSidc(condition)).toBe('W-S-WSR-LI');
    expect(environmentalParameters(condition)).toEqual([
      { key: 'mode', label: 'نوع بارش', value: 'باران' },
      { key: 'intensity', label: 'شدت', value: '۶۰ درصد' },
      {
        key: 'rateMmPerHour',
        label: 'نرخ بارش',
        value: '۸ میلی‌متر بر ساعت',
      },
    ]);
  });
});
