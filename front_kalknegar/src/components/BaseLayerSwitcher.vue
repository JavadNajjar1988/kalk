<script setup lang="ts">
import {
  RadioGroup,
  RadioGroupDescription,
  RadioGroupLabel,
  RadioGroupOption,
} from "@headlessui/vue";
import { type LayerInfo } from "./LayersPanel.vue";
import OpacityInput from "./OpacityInput.vue";
import { computed } from "vue";

interface Props {
  settings: LayerInfo<any>[];
  defaultLayerName?: string;
}

const props = defineProps<Props>();
const emit = defineEmits(["update:layerOpacity"]);

const selected = defineModel<LayerInfo<any>>();
const nsettings = computed(() => [...props.settings]);
</script>

<template>
  <RadioGroup v-model="selected">
    <RadioGroupLabel class="sr-only">انتخاب لایه نقشه پایه</RadioGroupLabel>
    <div class="-space-y-px rounded-2xl border border-blue-400/30 dark:border-blue-500/30 bg-blue-400/10 supports-[backdrop-filter]:bg-blue-400/15 backdrop-blur-md">
      <RadioGroupOption
        as="template"
        v-for="(setting, settingIdx) in nsettings"
        :key="setting.title"
        :value="setting"
        v-slot="{ checked, active }"
      >
        <div
          :class="[
            settingIdx === 0 ? 'rounded-tl-2xl rounded-tr-2xl' : '',
            settingIdx === settings.length - 1 ? 'rounded-br-2xl rounded-bl-2xl' : '',
            checked ? 'z-10 border-blue-400/40 bg-blue-400/15' : 'border-blue-400/30',
            'relative flex cursor-pointer border p-4 focus:outline-hidden',
          ]"
        >
          <span
            class="shrink-0"
            :class="[
              checked ? 'border-transparent bg-blue-500' : 'border-blue-300 bg-white/80',
              active ? 'ring-2 ring-blue-400 ring-offset-2' : '',
              'mt-0.5 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border',
            ]"
            aria-hidden="true"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-white" />
          </span>
          <div class="ml-3 flex min-w-0 flex-auto flex-col">
            <RadioGroupLabel
              as="div"
              :class="[
                'flex items-center justify-between text-sm font-medium text-foreground',
              ]"
            >
              <div class="">
                <span class="flex-auto truncate">{{ setting.title }}</span>
                <span
                  v-if="defaultLayerName && setting.id === defaultLayerName"
                  class="ml-1 inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600"
                  >پیش‌فرض</span
                >
              </div>
              <span v-if="setting.title === 'هیچکدام'" />
              <OpacityInput
                v-else
                :model-value="setting.opacity"
                @update:model-value="$emit('update:layerOpacity', setting, $event)"
                class="shrink-0"
              />
            </RadioGroupLabel>
            <RadioGroupDescription
              as="span"
              :class="[checked ? 'text-foreground/80' : 'text-muted-foreground', 'block text-sm']"
            >
              {{ setting.description || "" }}
            </RadioGroupDescription>
          </div>
        </div>
      </RadioGroupOption>
    </div>
  </RadioGroup>
</template>
