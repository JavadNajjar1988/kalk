<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { Button } from "@/components/ui/button";
import { activeScenarioKey } from "@/components/injects";
import { injectStrict } from "@/utils";
import { PhaseStatus, type ScenarioPhase } from "@/types/scenarioModels";
import { validateScenarioPhases } from "@/scenariostore/phases";

const { store, phases: phaseActions } = injectStrict(activeScenarioKey);

type PhaseForm = {
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  status: PhaseStatus;
  objectives: string;
};

const emptyForm = (): PhaseForm => ({
  name: "",
  description: "",
  startTime: toDateTimeLocal(store.state.currentTime || Date.now()),
  endTime: "",
  status: PhaseStatus.PLANNED,
  objectives: "",
});

const form = reactive<PhaseForm>(emptyForm());
const editingId = ref<string | null>(null);
const formOpen = ref(false);
const formError = ref("");

const sortedPhases = computed(() =>
  [...store.state.phases].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
);
const issues = computed(() => validateScenarioPhases(sortedPhases.value));

function toDateTimeLocal(value: number | string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toTimestamp(value: string) {
  return new Date(value).getTime();
}

function resetForm() {
  Object.assign(form, emptyForm());
  editingId.value = null;
  formError.value = "";
}

function openCreate() {
  resetForm();
  formOpen.value = true;
}

function openEdit(phase: ScenarioPhase) {
  editingId.value = phase.id;
  Object.assign(form, {
    name: phase.name,
    description: phase.description ?? "",
    startTime: toDateTimeLocal(phase.startTime),
    endTime: phase.endTime !== undefined ? toDateTimeLocal(phase.endTime) : "",
    status: phase.status,
    objectives: phase.objectives.join("\n"),
  });
  formError.value = "";
  formOpen.value = true;
}

function closeForm() {
  formOpen.value = false;
  resetForm();
}

function submitForm() {
  const startTime = toTimestamp(form.startTime);
  const endTime = form.endTime ? toTimestamp(form.endTime) : undefined;
  if (!form.name.trim()) {
    formError.value = "نام فاز الزامی است.";
    return;
  }
  if (!Number.isFinite(startTime)) {
    formError.value = "زمان شروع معتبر نیست.";
    return;
  }
  if (endTime !== undefined && (!Number.isFinite(endTime) || endTime <= startTime)) {
    formError.value = "زمان پایان باید بعد از زمان شروع باشد.";
    return;
  }

  const payload = {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    startTime,
    endTime,
    status: form.status,
    objectives: form.objectives
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
    tasks:
      editingId.value !== null
        ? (store.state.phases.find((phase) => phase.id === editingId.value)?.tasks ?? [])
        : [],
  };

  if (editingId.value) {
    phaseActions.updatePhase(editingId.value, payload);
  } else {
    phaseActions.addPhase(payload);
  }
  closeForm();
}

function removePhase(phase: ScenarioPhase) {
  const eventCount = countEvents(phase.id);
  const warning =
    eventCount > 0
      ? `این فاز به ${eventCount} رویداد متصل است. با حذف فاز، اتصال رویدادها نیز برداشته می‌شود. ادامه می‌دهید؟`
      : `فاز «${phase.name}» حذف شود؟`;
  if (window.confirm(warning)) phaseActions.deletePhase(phase.id);
}

function countEvents(phaseId: string) {
  return Object.values(store.state.eventMap).filter((event) => event.phaseId === phaseId)
    .length;
}

function phaseHasIssue(phaseId: string) {
  return issues.value.some(
    (issue) => issue.phaseId === phaseId || issue.relatedPhaseId === phaseId,
  );
}

function statusLabel(status: PhaseStatus) {
  const labels: Record<PhaseStatus, string> = {
    [PhaseStatus.PLANNED]: "برنامه‌ریزی‌شده",
    [PhaseStatus.IN_PROGRESS]: "در حال اجرا",
    [PhaseStatus.COMPLETED]: "تکمیل‌شده",
    [PhaseStatus.FAILED]: "ناموفق",
    [PhaseStatus.CANCELLED]: "لغوشده",
  };
  return labels[status];
}
</script>

<template>
  <section class="space-y-3" dir="rtl">
    <header class="flex items-start justify-between gap-3">
      <div>
        <h2 class="font-semibold">فازهای سناریو</h2>
        <p class="text-muted-foreground mt-1 text-xs">
          بازه‌های اصلی عملیات را تعریف کنید و سپس رویدادها را به آن‌ها متصل کنید.
        </p>
      </div>
      <Button size="sm" @click="openCreate">افزودن فاز</Button>
    </header>

    <div
      v-if="issues.length"
      class="rounded-md border border-amber-400 bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
    >
      {{ issues.length }} ناسازگاری زمانی وجود دارد؛ بازه‌های قرمز را بررسی کنید.
    </div>

    <form
      v-if="formOpen"
      class="bg-muted/40 space-y-3 rounded-lg border p-3"
      @submit.prevent="submitForm"
    >
      <h3 class="text-sm font-semibold">
        {{ editingId ? "ویرایش فاز" : "فاز جدید" }}
      </h3>
      <label class="block text-xs">
        <span>نام فاز</span>
        <input
          v-model="form.name"
          required
          class="bg-background mt-1 w-full rounded-md border px-3 py-2"
        />
      </label>
      <label class="block text-xs">
        <span>توضیحات</span>
        <textarea
          v-model="form.description"
          rows="2"
          class="bg-background mt-1 w-full rounded-md border px-3 py-2"
        />
      </label>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="block text-xs">
          <span>زمان شروع</span>
          <input
            v-model="form.startTime"
            type="datetime-local"
            required
            class="bg-background mt-1 w-full rounded-md border px-2 py-2"
          />
        </label>
        <label class="block text-xs">
          <span>زمان پایان (اختیاری)</span>
          <input
            v-model="form.endTime"
            type="datetime-local"
            class="bg-background mt-1 w-full rounded-md border px-2 py-2"
          />
        </label>
      </div>
      <label class="block text-xs">
        <span>وضعیت</span>
        <select
          v-model="form.status"
          class="bg-background mt-1 w-full rounded-md border px-3 py-2"
        >
          <option
            v-for="status in Object.values(PhaseStatus)"
            :key="status"
            :value="status"
          >
            {{ statusLabel(status) }}
          </option>
        </select>
      </label>
      <label class="block text-xs">
        <span>اهداف (هر هدف در یک خط)</span>
        <textarea
          v-model="form.objectives"
          rows="3"
          class="bg-background mt-1 w-full rounded-md border px-3 py-2"
        />
      </label>
      <p v-if="formError" class="text-xs text-red-600">{{ formError }}</p>
      <div class="flex justify-end gap-2">
        <Button type="button" size="sm" variant="ghost" @click="closeForm"> لغو </Button>
        <Button type="submit" size="sm">ذخیره</Button>
      </div>
    </form>

    <div
      v-if="!sortedPhases.length && !formOpen"
      class="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm"
    >
      هنوز فازی تعریف نشده است.
    </div>

    <article
      v-for="(phase, index) in sortedPhases"
      :key="phase.id"
      class="rounded-lg border p-3"
      :class="{ 'border-red-500': phaseHasIssue(phase.id) }"
    >
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="font-medium">{{ phase.name }}</h3>
            <span class="bg-muted rounded-full px-2 py-0.5 text-[11px]">
              {{ statusLabel(phase.status) }}
            </span>
            <span class="text-muted-foreground text-[11px]">
              {{ countEvents(phase.id) }} رویداد
            </span>
          </div>
          <p class="text-muted-foreground mt-1 text-xs">
            {{ new Date(phase.startTime).toLocaleString("fa-IR") }}
            تا
            {{
              phase.endTime
                ? new Date(phase.endTime).toLocaleString("fa-IR")
                : "بدون پایان"
            }}
          </p>
        </div>
        <div class="flex shrink-0 gap-1">
          <Button
            size="sm"
            variant="ghost"
            :disabled="index === 0"
            title="انتقال به بالا"
            @click="phaseActions.movePhase(phase.id, -1)"
          >
            ↑
          </Button>
          <Button
            size="sm"
            variant="ghost"
            :disabled="index === sortedPhases.length - 1"
            title="انتقال به پایین"
            @click="phaseActions.movePhase(phase.id, 1)"
          >
            ↓
          </Button>
          <Button size="sm" variant="outline" @click="openEdit(phase)"> ویرایش </Button>
          <Button size="sm" variant="destructive" @click="removePhase(phase)">
            حذف
          </Button>
        </div>
      </div>
      <p v-if="phase.description" class="mt-2 text-xs">{{ phase.description }}</p>
      <ul v-if="phase.objectives.length" class="mt-2 list-inside list-disc text-xs">
        <li v-for="objective in phase.objectives" :key="objective">
          {{ objective }}
        </li>
      </ul>
    </article>
  </section>
</template>
