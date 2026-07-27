import { describe, expect, it } from 'vitest';
import {
  ScenarioApiService,
  transformFormToScenario,
} from './scenarioApiService';

describe('transformFormToScenario', () => {
  it('keeps status, initial ORBAT sides and tags selected in the wizard', () => {
    const side = {
      name: 'آبی',
      standardIdentity: '3',
      symbolOptions: {},
      units: [
        {
          rootUnitName: 'قرارگاه',
          rootUnitEchelon: '18',
          rootUnitIcon: '121000',
        },
      ],
    };

    const scenario = transformFormToScenario({
      name: 'سناریوی آزمون',
      description: '',
      status: 'active',
      startTime: '2026-07-26T00:00:00.000Z',
      metadata: {
        sides: [side],
        tags: ['آموزشی'],
        timeZone: 'UTC',
        symbologyStandard: 'app6',
      },
    });

    expect(scenario.status).toBe('active');
    expect(scenario.sides).toEqual([side]);
    expect(scenario.tags).toEqual(['آموزشی']);
  });
});

describe('ScenarioApiService response mapping', () => {
  it('maps backend audit timestamps to the detail page entity fields', () => {
    const service = new ScenarioApiService();
    const scenario = service.mapScenarioOutToEnhanced({
      id: 'scenario-1',
      name: 'سناریوی آزمون',
      description: '',
      created: '2026-07-25T10:00:00.000Z',
      modified: '2026-07-26T11:30:00.000Z',
      content: {
        id: 'stale-id',
        name: 'نام قدیمی',
        status: 'draft',
      },
    });

    expect(scenario.createdAt).toBe('2026-07-25T10:00:00.000Z');
    expect(scenario.updatedAt).toBe('2026-07-26T11:30:00.000Z');
  });

  it('merges a partial update with the latest server content before PUT', async () => {
    const service = new ScenarioApiService();
    let submittedPayload: any;

    (service as any).getScenarioById = async () => ({
      id: 'scenario-1',
      name: 'سناریوی موجود',
      description: 'شرح موجود',
      status: 'draft',
      objectives: ['حفظ هدف'],
      metadata: { classification: 'محرمانه' },
    });
    (service as any).put = async (_endpoint: string, payload: any) => {
      submittedPayload = payload;
      return {
        success: true,
        data: {
          id: 'scenario-1',
          name: payload.name,
          description: payload.description,
          content: payload.content,
          created: '2026-07-25T10:00:00.000Z',
          modified: '2026-07-26T11:30:00.000Z',
        },
      };
    };

    await service.updateScenario('scenario-1', { status: 'active' } as any);

    expect(submittedPayload.name).toBe('سناریوی موجود');
    expect(submittedPayload.description).toBe('شرح موجود');
    expect(submittedPayload.content.status).toBe('active');
    expect(submittedPayload.content.objectives).toEqual(['حفظ هدف']);
    expect(submittedPayload.content.metadata).toEqual({
      classification: 'محرمانه',
    });
  });
});
