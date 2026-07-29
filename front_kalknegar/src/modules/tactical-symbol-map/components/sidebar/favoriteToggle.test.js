import { describe, expect, it, vi } from 'vitest'
import { toggleFavorite } from './favoriteToggle.js'

describe('toggleFavorite', () => {
  it.each([
    [false, 'pin', true],
    [true, 'unpin', false],
  ])('changes favorite=%s through %s', (favorite, event, nextFavorite) => {
    const emitter = { emit: vi.fn(() => true) }
    const notify = vi.fn()

    expect(toggleFavorite({
      emitter,
      id: 'symbol:S*G*UCI---',
      favorite,
      notify,
    })).toBe(nextFavorite)
    expect(notify).toHaveBeenCalledWith({
      id: 'symbol:S*G*UCI---',
      favorite: nextFavorite,
    })
    expect(emitter.emit).toHaveBeenCalledWith(event, {
      id: 'symbol:S*G*UCI---',
    })
  })
})
