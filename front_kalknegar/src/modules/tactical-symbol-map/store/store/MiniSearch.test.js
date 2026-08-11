import { describe, expect, it } from 'vitest'
import { createIndex } from './MiniSearch.js'

describe('tactical symbol Persian search index', () => {
  it('finds Persian labels with Arabic keyboard variants', () => {
    const index = createIndex()
    index.add({
      id: 'symbol:test',
      scope: 'symbol',
      text: 'آزمایشگاه کشاورزی زیرساخت مخابراتی',
      tags: []
    })

    expect(index.search('كشاورزي').map(result => result.id))
      .toContain('symbol:test')
    expect(index.search('مخابرات', { prefix: true }).map(result => result.id))
      .toContain('symbol:test')
  })

  it('treats the half-space as a searchable word boundary', () => {
    const index = createIndex()
    index.add({
      id: 'symbol:fire-line',
      scope: 'symbol',
      text: 'خط آتش هماهنگ‌شده',
      tags: []
    })

    expect(index.search('هماهنگ').map(result => result.id))
      .toContain('symbol:fire-line')
  })
})
