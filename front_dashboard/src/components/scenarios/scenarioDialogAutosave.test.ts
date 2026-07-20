import { describe, expect, it } from 'vitest';
import { ScenarioStatus } from '@/types';
import { buildScenarioDialogPayload } from './scenarioDialogAutosave';

describe('buildScenarioDialogPayload', () => {
  it('keeps the current scenario id for dashboard autosave updates', () => {
    const payload = buildScenarioDialogPayload({
      scenarioId: 'scenario-123',
      formData: {
        name: 'Updated scenario',
        description: 'Updated description',
        scenarioCode: 'SCN-1',
        authorName: 'operator',
        createdDate: '2026-06-10T00:00:00.000Z',
        purpose: 'training',
        bboxText: '1,2,3,4',
        symbologyStandard: '2525',
        timeZone: 'Asia/Tehran',
        year: 2026,
        month: 6,
        day: 10,
        hour: 12,
        minute: 30,
        endTime: '',
        status: ScenarioStatus.DRAFT,
        objectives: ['hold line', ''],
        tags: ['alpha', ''],
      },
      noInitialOrbat: false,
      sides: [
        { name: 'Blue', standardIdentity: '3', symbolOptions: {}, units: [] },
      ],
      weather: { sky: 'clear' },
      imageUrl: '/uploads/scenario.png',
    });

    expect(payload.id).toBe('scenario-123');
    expect(payload.name).toBe('Updated scenario');
    expect(payload.objectives).toEqual(['hold line']);
    expect(payload.image).toBe('/uploads/scenario.png');
    expect((payload.metadata as any).sides).toHaveLength(1);
    expect((payload.metadata as any).boundingBox).toEqual([1, 2, 3, 4]);
  });
});
