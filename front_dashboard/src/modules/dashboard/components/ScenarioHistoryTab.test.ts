import { describe, expect, it } from 'vitest';
import {
  describeScenarioHistoryChange,
  describeScenarioHistoryEntry,
} from './ScenarioHistoryTab';

describe('describeScenarioHistoryEntry', () => {
  it('turns updated field names into a readable Persian sentence', () => {
    expect(
      describeScenarioHistoryEntry({
        action: 'update',
        payload_diff: {
          fields: ['name', 'intro_video_url', 'description'],
        },
      })
    ).toBe('نام سناریو، ویدئوی اینترو، توضیحات تغییر کرد.');
  });

  it('uses the scenario name for creation history', () => {
    expect(
      describeScenarioHistoryEntry({
        action: 'create',
        payload_diff: { name: 'رزمایش نمونه' },
      })
    ).toBe('سناریوی «رزمایش نمونه» ایجاد شد.');
  });

  it('does not expose raw payload data for unknown actions', () => {
    expect(
      describeScenarioHistoryEntry({
        action: 'custom-action',
        payload_diff: { secret: 'raw-value' },
      })
    ).toBe('یک تغییر در سناریو ثبت شد.');
  });

  it('summarizes structured operational changes', () => {
    expect(
      describeScenarioHistoryEntry({
        action: 'update',
        payload_diff: {
          fields: ['content'],
          summary: {
            total: 3,
            added: 1,
            removed: 0,
            moved: 2,
            edited: 0,
          },
          changes: [],
        },
      })
    ).toBe('۳ تغییر عملیاتی ثبت شد: ۱ افزوده، ۲ جابه‌جایی.');
  });
});

describe('describeScenarioHistoryChange', () => {
  it('describes tactical symbol movement between named regions', () => {
    expect(
      describeScenarioHistoryChange({
        category: 'tactical_symbol',
        operation: 'moved',
        name: 'محور پیشروی',
        previous_region: 'منطقه الف',
        region: 'منطقه ب',
      })
    ).toBe('نماد تاکتیکی «محور پیشروی» از «منطقه الف» به «منطقه ب» منتقل شد.');
  });

  it('falls back to the layer name when a region is unavailable', () => {
    expect(
      describeScenarioHistoryChange({
        category: 'map_feature',
        operation: 'added',
        name: 'خاکریز جدید',
        layer: 'استحکامات',
      })
    ).toBe('عارضه نقشه «خاکریز جدید» در لایه «استحکامات» اضافه شد.');
  });
});
