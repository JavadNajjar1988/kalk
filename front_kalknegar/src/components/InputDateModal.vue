<script setup lang="ts">
import { computed, ref, watch } from "vue";
import PrimaryButton from "./PrimaryButton.vue";
import ScenarioEventsPanel from "@/modules/scenarioeditor/ScenarioEventsPanel.vue";
import { type ScenarioEvent } from "@/types/scenarioModels";
import NewSimpleModal from "@/components/NewSimpleModal.vue";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PersianDateTimeField from "@/components/PersianDateTimeField.vue";
import dayjs from "@/dayjs";
import { jalaliDateTimeFormatter } from "@/utils/jalaliFormatters";

interface Props {
  dialogTitle?: string;
  timestamp?: number;
  modelValue?: boolean;
  timeZone?: string;
}

const props = withDefaults(defineProps<Props>(), {
  dialogTitle: "تنظیم تاریخ و زمان سناریو",
  timestamp: 386467200000,
  modelValue: false,
  timeZone: "UTC",
});
const emit = defineEmits(["update:timestamp", "cancel"]);

const open = defineModel<boolean>();
const localDateTime = ref("");

const inputDateTime = computed(() => dayjs.utc(props.timestamp).tz(props.timeZone));

watch(
  inputDateTime,
  (value) => {
    localDateTime.value = value.format("YYYY-MM-DDTHH:mm");
  },
  { immediate: true },
);

const resDateTime = computed(() => dayjs.tz(localDateTime.value, props.timeZone));

const updateTime = () => {
  emit("update:timestamp", resDateTime.value.valueOf());
  open.value = false;
};

function onEventClick(event: ScenarioEvent) {
  emit("update:timestamp", event.startTime);
  open.value = false;
}
</script>
<template>
  <NewSimpleModal v-model="open" :dialog-title="dialogTitle" @cancel="emit('cancel')">
    <Tabs class="" default-value="time">
      <TabsList class="w-full">
        <TabsTrigger value="time" class="">زمان</TabsTrigger>
        <TabsTrigger value="events" class="">رویدادها </TabsTrigger>
      </TabsList>
      <TabsContent value="time">
        <form @submit.prevent="updateTime" class="mt-4 space-y-6">
          <PersianDateTimeField
            v-model="localDateTime"
            label="تاریخ و زمان سناریو"
            required
          />

          <p class="flex items-center justify-between">
            <span class="font-mono text-gray-700">
              {{ jalaliDateTimeFormatter(resDateTime.valueOf()) }}
            </span>
            <PrimaryButton type="submit" class="">به‌روزرسانی زمان</PrimaryButton>
          </p>
        </form>
      </TabsContent>
      <TabsContent value="events">
        <ScenarioEventsPanel select-only @event-click="onEventClick" hide-dropdown />
      </TabsContent>
    </Tabs>
  </NewSimpleModal>
</template>
