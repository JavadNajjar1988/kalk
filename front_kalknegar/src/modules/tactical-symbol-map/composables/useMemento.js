import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useServices } from './useServices'

export function useMemento(key, defaultValue) {
  const { preferencesStore } = useServices()
  const value = ref(defaultValue)
  let stopUpdates = null

  const put = async (newValue) => {
    await preferencesStore.put(key, newValue)
  }

  onMounted(() => {
    const handleUpdates = ({ value: newValue }) => {
      value.value = newValue
    }

    stopUpdates = () => {
      if (preferencesStore) {
        preferencesStore.off(key, handleUpdates)
      }
    }

    ;(async () => {
      const stored = await preferencesStore.get(key, defaultValue)
      value.value = stored
      preferencesStore.on(key, handleUpdates)
    })()
  })

  onUnmounted(() => {
    if (stopUpdates) stopUpdates()
  })

  return [value, put]
}

