import { describe, expect, it } from 'vitest';
import { transformFormToScenario } from './scenarioApiService';

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
