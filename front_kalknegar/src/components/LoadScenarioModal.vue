<template>
  <NewSimpleModal
    v-model="open"
    dialog-title="بارگذاری سناریو"
    @cancel="onCancel"
    class="sm:max-w-xl"
  >
    <div class="overflow-x-hidden" dir="rtl">
      <p class="text-sm leading-6 text-gray-500 text-right">
        بارگذاری سناریوی ذخیره شده از فایل محلی
      </p>
      <LoadScenarioPanel
        @cancel="onCancel"
        @loaded="onLoaded"
      />
    </div>
  </NewSimpleModal>
</template>

<script setup lang="ts">
import { useVModel } from "@vueuse/core";
import LoadScenarioPanel from "@/modules/scenarioeditor/LoadScenarioPanel.vue";
import NewSimpleModal from "@/components/NewSimpleModal.vue";
import { useBrowserScenarios } from "@/composables/browserScenarios";

const props = withDefaults(defineProps<{ modelValue: boolean }>(), { modelValue: false });
const emit = defineEmits(["update:modelValue", "cancel"]);

const open = useVModel(props, "modelValue", emit);
const { loadScenario } = useBrowserScenarios();

function onLoaded(scenario: any) {
  loadScenario(scenario);
  open.value = false;
}

function onCancel() {
  open.value = false;
  emit("cancel");
}
</script>
