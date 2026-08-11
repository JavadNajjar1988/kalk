import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ENVIRONMENT_SIDC,
  environmentalKindLabel,
  environmentalParameters,
  environmentalSidc,
  environmentalSpatialLabel,
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
    expect(environmentalSidc(condition)).toBe('WAS-WSR-MCP----');
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

  it('preserves a current 15-character METOC SIDC', () => {
    const condition = {
      id: 'storm-1',
      kind: 'metoc' as const,
      startTime: 0,
      parameters: {},
      metocSidc: 'WAS-WSTMH-P----',
    };

    expect(environmentalSidc(condition)).toBe('WAS-WSTMH-P----');
  });

  it('distinguishes environmental cards by their spatial shape', () => {
    const base = {
      id: 'wind-1',
      kind: 'wind' as const,
      startTime: 0,
    };

    expect(
      environmentalSpatialLabel({
        ...base,
        scope: 'area',
        geometry: { type: 'Polygon', coordinates: [] },
      })
    ).toBe('محدوده‌ای');
    expect(
      environmentalSpatialLabel({
        ...base,
        scope: 'area',
        geometry: { type: 'LineString', coordinates: [] },
      })
    ).toBe('مسیری');
    expect(environmentalSpatialLabel({ ...base, scope: 'global' })).toBe(
      'سراسری'
    );
  });
});
