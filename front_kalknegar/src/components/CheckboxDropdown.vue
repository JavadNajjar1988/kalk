<script setup lang="ts">
import { PhCaretDown as ChevronDownIcon } from "@phosphor-icons/vue";
import { Popover, PopoverButton, PopoverGroup, PopoverPanel } from "@headlessui/vue";
import type { SelectItem } from "@/components/types";
import { useVModel } from "@vueuse/core";

interface Props {
  options: SelectItem[];
  modelValue: (string | number)[];
  label?: string;
}

const props = defineProps<Props>();
const emit = defineEmits(["update:modelValue"]);

const selectedItems = useVModel(props, "modelValue", emit);
</script>
<template>
  <PopoverGroup class="flex items-baseline sm:space-x-8">
    <Popover as="div" class="relative z-50 inline-block text-left w-32">
      <div>
        <PopoverButton
          class="group inline-flex items-center justify-center text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer relative z-50"
        >
          <span
            ><slot>{{ label }}</slot></span
          >
          <span
            class="checkbox-dropdown-badge ml-1.5 rounded backdrop-blur-sm px-1.5 py-0.5 text-xs font-semibold text-gray-700 tabular-nums"
            >{{ selectedItems.length }}</span
          >
          <ChevronDownIcon
            class="-mr-1 ml-1 h-5 w-5 shrink-0 text-gray-400 group-hover:text-gray-500"
            aria-hidden="true"
          />
        </PopoverButton>
      </div>

      <transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <PopoverPanel
          class="checkbox-dropdown-panel ring-opacity-5 absolute right-0 z-50 mt-2 origin-top-right rounded-md backdrop-blur-sm backdrop-saturate-150 p-4 shadow-2xl ring-1 focus:outline-hidden"
        >
          <form class="space-y-4">
            <div
              v-for="(option, optionIdx) in options"
              :key="option.value"
              class="flex items-center"
            >
              <input
                :id="`filter-${option.value}`"
                :value="option.value"
                v-model="selectedItems"
                type="checkbox"
                class="checkbox-dropdown-checkbox h-4 w-4 rounded cursor-pointer"
              />
              <label
                :for="`filter-${option.value}`"
                class="ml-3 pr-6 text-sm font-medium whitespace-nowrap text-gray-900 cursor-pointer"
                >{{ option.label }}</label
              >
            </div>
          </form>
        </PopoverPanel>
      </transition>
    </Popover>
  </PopoverGroup>
</template>
<style scoped>
.checkbox-dropdown-badge {
  background-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
}

:global(.dark) .checkbox-dropdown-badge {
  background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
}

.checkbox-dropdown-panel {
  background-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 25%, transparent);
  ring-color: color-mix(in srgb, var(--color-primary) 25%, transparent);
}

:global(.dark) .checkbox-dropdown-panel {
  background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
  ring-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
}

.checkbox-dropdown-checkbox {
  border-color: color-mix(in srgb, var(--color-primary) 25%, transparent);
  accent-color: var(--color-primary);
}

.checkbox-dropdown-checkbox:checked {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.checkbox-dropdown-checkbox:focus {
  ring-color: var(--color-primary);
  --tw-ring-color: var(--color-primary);
}

:global(.dark) .checkbox-dropdown-checkbox {
  border-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
}
</style>
