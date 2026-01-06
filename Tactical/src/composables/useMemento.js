import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useServices } from './useServices'

export function useMemento(key, defaultValue) {
  const { preferencesStore } = useServices()
  const value = ref(defaultValue)

  const put = async (newValue) => {
    await preferencesStore.put(key, newValue)
  }

  onMounted(async () => {
    const stored = await preferencesStore.get(key, defaultValue)
    value.value = stored

    const handleUpdates = ({ value: newValue }) => {
      value.value = newValue
    }
    preferencesStore.on(key, handleUpdates)

    onUnmounted(() => {
      preferencesStore.off(key, handleUpdates)
    })
  })

  return [value, put]
}

