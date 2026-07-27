import { EventEmitter } from 'node:events'
import { describe, expect, it } from 'vitest'
import { existsKey, read } from './index.js'

describe('browser Level stream completion', () => {
  it('finishes a read when the stream emits end without close', async () => {
    const stream = new EventEmitter()
    const result = read(stream, value => value)

    stream.emit('data', 'feature:1')
    stream.emit('end')

    await expect(result).resolves.toEqual(['feature:1'])
  })

  it('reports an empty key lookup when the stream emits end without close', async () => {
    const stream = new EventEmitter()
    const db = {
      createReadStream: () => stream,
    }
    const result = existsKey(db, { gte: 'feature:', lte: 'feature:\xff' })

    stream.emit('end')

    await expect(result).resolves.toBe(false)
  })

  it('keeps the first matching key result when end follows data', async () => {
    const stream = new EventEmitter()
    const db = {
      createReadStream: () => stream,
    }
    const result = existsKey(db, { gte: 'feature:', lte: 'feature:\xff' })

    stream.emit('data', 'feature:1')
    stream.emit('end')

    await expect(result).resolves.toBe(true)
  })
})
