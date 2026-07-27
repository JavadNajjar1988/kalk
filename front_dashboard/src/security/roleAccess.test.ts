import { describe, expect, it } from 'vitest';

import {
  canAccessFeature,
  canAccessSidebarItem,
  SIDEBAR_FEATURES,
  type AppRole,
} from './roleAccess';

describe('sidebar role access', () => {
  it.each([
    ['admin', true],
    ['commander', false],
    ['operator', false],
    ['viewer', false],
    [undefined, false],
  ] as const)('limits user management for %s', (role, expected) => {
    expect(canAccessFeature(role, 'users.manage')).toBe(expected);
  });

  it.each([
    ['admin', true],
    ['commander', true],
    ['operator', false],
    ['viewer', false],
  ] as const)('keeps read-only user access separate for %s', (role, expected) => {
    expect(canAccessFeature(role, 'users.view')).toBe(expected);
  });

  it('treats unknown roles as viewer access', () => {
    expect(canAccessFeature('guest', 'dashboard.view')).toBe(true);
    expect(canAccessFeature('guest', 'users.manage')).toBe(false);
    expect(canAccessFeature(null, 'data.manage')).toBe(false);
  });

  it.each([
    ['admin', ['home', 'scenarios', 'users', 'resources', 'dataManagement']],
    ['commander', ['home', 'scenarios', 'resources', 'dataManagement']],
    ['operator', ['home', 'scenarios', 'resources']],
    ['viewer', ['home', 'scenarios', 'resources']],
  ] as const)('returns the expected sidebar for %s', (role, expected) => {
    const visibleItems = Object.keys(SIDEBAR_FEATURES).filter((itemId) =>
      canAccessSidebarItem(role as AppRole, itemId as keyof typeof SIDEBAR_FEATURES)
    );

    expect(visibleItems).toEqual(expected);
  });
});
