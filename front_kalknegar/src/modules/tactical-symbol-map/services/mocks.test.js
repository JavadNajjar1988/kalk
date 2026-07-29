import { describe, expect, it, vi } from 'vitest'
import { MockIpcRenderer, MockUndo } from './mocks'

const reversibleCommand = (state, nextValue) => {
  const previousValue = state.value
  return {
    apply: async () => {
      state.value = nextValue
    },
    inverse: () => reversibleCommand(state, previousValue)
  }
}

describe('MockUndo', () => {
  it('stores commands and supports undo and redo', async () => {
    const history = new MockUndo()
    const state = { value: 'before' }
    const changed = vi.fn()
    history.on('changed', changed)

    await history.apply(reversibleCommand(state, 'after'))

    expect(state.value).toBe('after')
    expect(history.canUndo()).toBe(true)
    expect(history.canRedo()).toBe(false)
    const sequence = history.undoSequence()
    expect(sequence).toBeGreaterThan(0)

    await history.undo()
    expect(state.value).toBe('before')
    expect(history.canUndo()).toBe(false)
    expect(history.canRedo()).toBe(true)
    expect(history.redoSequence()).toBe(sequence)

    await history.redo()
    expect(state.value).toBe('after')
    expect(history.canUndo()).toBe(true)
    expect(history.canRedo()).toBe(false)
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(changed).toHaveBeenCalledTimes(3)
  })

  it('collapses repeated edits of the same tactical symbol into one step', async () => {
    const history = new MockUndo()
    const state = { value: 0 }

    await history.apply({
      ...reversibleCommand(state, 1),
      collapsible: true,
      id: 'feature:test'
    })
    await history.apply({
      ...reversibleCommand(state, 2),
      collapsible: true,
      id: 'feature:test'
    })

    expect(state.value).toBe(2)
    expect(history.undoStack).toHaveLength(1)

    await history.undo()
    expect(state.value).toBe(0)

    await history.redo()
    expect(state.value).toBe(2)
  })
})

describe('MockIpcRenderer map preview bridge', () => {
  it('captures the latest rendered map image on demand', async () => {
    const ipcRenderer = new MockIpcRenderer()
    ipcRenderer.setPreviewProvider(async () => 'data:image/webp;base64,new-preview')

    await expect(ipcRenderer.capturePreview()).resolves.toBe(
      'data:image/webp;base64,new-preview'
    )

    ipcRenderer.send('PREVIEW', 'data:image/webp;base64,pushed-preview')
    ipcRenderer.setPreviewProvider(null)
    await expect(ipcRenderer.capturePreview()).resolves.toBe(
      'data:image/webp;base64,pushed-preview'
    )
  })
})
