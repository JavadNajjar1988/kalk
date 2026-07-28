import { describe, expect, it } from 'vitest';
import { getSectionParent } from './navigation';

describe('getSectionParent', () => {
  it('returns the list page for detail routes', () => {
    expect(getSectionParent('/dashboard/scenarios/42')).toBe(
      '/dashboard/scenarios'
    );
    expect(getSectionParent('/dashboard/users/7/')).toBe('/dashboard/users');
  });

  it('returns dashboard only for section roots', () => {
    expect(getSectionParent('/dashboard/scenarios')).toBe('/dashboard');
  });
});
