import type { Scenario } from '@/types';

export type ScenarioDialogPayload = Partial<Scenario> & {
  image?: string;
  metadata?: Record<string, unknown>;
};

export interface ScenarioDialogPayloadInput {
  scenarioId?: string;
  formData: {
    name: string;
    description: string;
    scenarioCode: string;
    authorName: string;
    createdDate: string;
    purpose: string;
    bboxText: string;
    symbologyStandard: 'app6' | '2525';
    timeZone: string;
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    endTime: string;
    status: Scenario['status'];
    objectives: string[];
    tags: string[];
  };
  noInitialOrbat: boolean;
  sides: unknown[];
  weather: unknown;
  imageUrl?: string;
}

export function buildScenarioDialogPayload({
  scenarioId,
  formData,
  noInitialOrbat,
  sides,
  weather,
  imageUrl,
}: ScenarioDialogPayloadInput): ScenarioDialogPayload {
  const startTime = new Date(
    formData.year,
    formData.month - 1,
    formData.day,
    formData.hour,
    formData.minute
  ).toISOString();

  let boundingBox: number[] | undefined;
  if (formData.bboxText.trim().length > 0) {
    const nums = formData.bboxText.split(',').map(s => Number(s.trim()));
    if (nums.length === 4 && nums.every(n => Number.isFinite(n))) {
      boundingBox = [nums[0], nums[1], nums[2], nums[3]];
    }
  }

  const payload: ScenarioDialogPayload = {
    name: formData.name,
    description: formData.description,
    status: formData.status,
    startTime,
    endTime: formData.endTime
      ? new Date(formData.endTime).toISOString()
      : undefined,
    objectives: formData.objectives.filter(obj => obj.trim()),
    image: imageUrl,
    metadata: {
      scenarioCode: formData.scenarioCode,
      authorName: formData.authorName || undefined,
      purpose: formData.purpose || undefined,
      createdDate: formData.createdDate || new Date().toISOString(),
      symbologyStandard: formData.symbologyStandard,
      timeZone: formData.timeZone,
      tags: formData.tags.filter(tag => tag.trim()),
      weather,
      sides: noInitialOrbat ? [] : sides,
      boundingBox,
      image: imageUrl,
    } as any,
  };

  if (scenarioId) {
    payload.id = scenarioId;
  }

  return payload;
}
