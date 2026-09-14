import { describe, expect, it } from 'vitest';
import {
  buildUnitReferenceLabels,
  resolveUnitReferenceLabel,
} from './resourceReferenceLabels';

describe('resource reference labels', () => {
  const labels = buildUnitReferenceLabels([
    { id: 'unit-1', code: 'u1', name: 'گردان ۱' },
    { id: 'unit-2', code: 'u2', name: 'گروهان الف' },
  ]);

  it('shows a unit name for both stable id and reference code', () => {
    expect(resolveUnitReferenceLabel('u1', labels)).toBe('گردان ۱');
    expect(resolveUnitReferenceLabel('unit-2', labels)).toBe('گروهان الف');
  });

  it('keeps a free-text location and provides a Persian empty value', () => {
    expect(resolveUnitReferenceLabel('انبار مرکزی', labels)).toBe(
      'انبار مرکزی'
    );
    expect(resolveUnitReferenceLabel('', labels)).toBe('—');
  });
});
