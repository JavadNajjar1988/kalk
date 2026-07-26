import { describe, expect, it } from 'vitest';
import {
  SCENARIO_ECHELON_OPTIONS,
  SCENARIO_LAND_UNIT_ICONS,
  STANDARD_IDENTITIES,
  buildSIDC,
  getStandardIdentityColor,
} from './militarySymbols';

describe('scenario military symbol options', () => {
  it('exposes only the primary organizational echelons', () => {
    expect(SCENARIO_ECHELON_OPTIONS.map(option => option.value)).toEqual([
      '14',
      '15',
      '16',
      '17',
      '18',
      '21',
      '22',
      '23',
    ]);
  });

  it('keeps the initial unit picker focused on primary unit types', () => {
    expect(SCENARIO_LAND_UNIT_ICONS).toHaveLength(7);
    expect(SCENARIO_LAND_UNIT_ICONS.some(icon => icon.value === '000000')).toBe(
      false
    );
  });

  it('places the selected echelon in the SIDC amplifier field', () => {
    expect(buildSIDC('6', '23', '121100')).toBe('10061000231211000000');
  });

  it('uses the softer identity palette from the symbol reference', () => {
    expect(getStandardIdentityColor('3')).toBe('#81D4FA');
    expect(getStandardIdentityColor('6')).toBe('#FF8A80');
    expect(getStandardIdentityColor('4')).toBe('#9BE79D');
    expect(getStandardIdentityColor('1')).toBe('#FFF176');
    expect(getStandardIdentityColor('missing')).toBe(
      STANDARD_IDENTITIES.UNKNOWN.color
    );
  });
});
