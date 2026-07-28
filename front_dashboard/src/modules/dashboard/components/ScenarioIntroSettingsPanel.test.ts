import { describe, expect, it } from 'vitest';
import {
  buildScenarioIntroUpdates,
  hasExpectedVideoSignature,
} from './ScenarioIntroSettingsPanel';

describe('ScenarioIntroSettingsPanel helpers', () => {
  it('builds a partial update containing only intro fields', () => {
    expect(
      buildScenarioIntroUpdates(
        '  عنوان معرفی  ',
        '  نکته اول\nنکته دوم  ',
        '  /api/scenarios/intro-videos/video.mp4  '
      )
    ).toEqual({
      intro_title: 'عنوان معرفی',
      intro_summary: 'نکته اول\nنکته دوم',
      intro_video_url: '/api/scenarios/intro-videos/video.mp4',
    });
  });

  it('normalizes empty intro fields to null', () => {
    expect(buildScenarioIntroUpdates(' ', '', '\n')).toEqual({
      intro_title: null,
      intro_summary: null,
      intro_video_url: null,
    });
  });

  it('validates MP4 and WebM signatures instead of trusting the extension', async () => {
    const mp4 = new File(
      [new Uint8Array([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 1, 2, 3, 4])],
      'intro.mp4',
      { type: 'video/mp4' }
    );
    const webm = new File(
      [new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 1, 2, 3, 4])],
      'intro.webm',
      { type: 'video/webm' }
    );
    const fake = new File(['not-a-video'], 'fake.mp4', { type: 'video/mp4' });

    await expect(hasExpectedVideoSignature(mp4, '.mp4')).resolves.toBe(true);
    await expect(hasExpectedVideoSignature(webm, '.webm')).resolves.toBe(true);
    await expect(hasExpectedVideoSignature(fake, '.mp4')).resolves.toBe(false);
  });
});
