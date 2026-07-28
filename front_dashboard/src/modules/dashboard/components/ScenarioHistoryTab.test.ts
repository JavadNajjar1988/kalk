import { describe, expect, it } from 'vitest';
import { describeScenarioHistoryEntry } from './ScenarioHistoryTab';

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
});
