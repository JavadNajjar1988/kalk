<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  resourceApiService,
  type ResourceSearchResultDto,
  type ResourceType,
} from "@/services/api/resourceApiService";
import { PhDatabase, PhMagnifyingGlass, PhPackage, PhX } from "@phosphor-icons/vue";

interface Props {
  open: boolean;
  type?: ResourceType;
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: "انتخاب از کاتالوگ منابع",
});

const emit = defineEmits<{
  (e: "update:open", v: boolean): void;
  (e: "select", resource: ResourceSearchResultDto): void;
  (e: "cancel"): void;
}>();

const query = ref("");
const items = ref<ResourceSearchResultDto[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const filteredItems = computed(() => items.value);

async function runSearch(q: string) {
  loading.value = true;
  error.value = null;
  try {
    const normalized = q.trim();
    if (normalized) {
      items.value = await resourceApiService.search(normalized, props.type, 50);
    } else {
      const result = await resourceApiService.list({ type: props.type, limit: 50 });
      items.value = result.items;
    }
  } catch (e: any) {
    error.value = e?.message || "خطا در دریافت منابع";
    items.value = [];
  } finally {
    loading.value = false;
  }
}

let debounceTimer: number | null = null;
watch(query, (q) => {
  if (debounceTimer) window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => runSearch(q), 250);
});

watch(
  () => props.open,
  (v) => {
    if (v) {
      query.value = "";
      runSearch("");
    }
  },
);

function close() {
  emit("update:open", false);
  emit("cancel");
}

function pick(r: ResourceSearchResultDto) {
  emit("select", r);
  emit("update:open", false);
}

function resourceTypeLabel(type?: ResourceType) {
  switch (type) {
    case "personnel":
      return "پرسنل";
    case "equipment":
      return "تجهیزات";
    case "units":
      return "یگان‌ها";
    case "ammunition":
      return "مهمات";
    case "logistics":
      return "پشتیبانی";
    case "ranks":
      return "درجات";
    case "maps":
      return "نقشه";
    default:
      return "همه منابع";
  }
}

const typeLabel = computed(() => resourceTypeLabel(props.type));
</script>

<template>
  <div
    v-if="props.open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]"
    @click.self="close"
  >
    <div
      dir="rtl"
      class="flex max-h-[82vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-right shadow-2xl dark:border-slate-700 dark:bg-slate-950"
    >
      <div
        class="flex items-start justify-between border-b border-slate-200 bg-gradient-to-l from-slate-50 via-white to-indigo-50/60 px-5 py-4 dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/30"
      >
        <div class="flex items-center gap-3">
          <div
            class="flex size-10 items-center justify-center rounded-xl border border-indigo-100 bg-white text-indigo-600 shadow-sm dark:border-indigo-900 dark:bg-slate-900 dark:text-indigo-400"
          >
            <PhDatabase class="size-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-slate-50">
              {{ props.title }}
            </h3>
            <p class="text-muted-foreground mt-1 text-xs">دسته: {{ typeLabel }}</p>
          </div>
        </div>
        <button
          type="button"
          class="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="بستن"
          @click="close"
        >
          <PhX class="size-5" />
        </button>
      </div>
      <div class="border-b border-slate-100 p-4 dark:border-slate-800">
        <div class="relative">
          <PhMagnifyingGlass
            class="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-slate-400"
          />
          <Input
            v-model="query"
            class="h-11 rounded-xl pr-10"
            placeholder="جست‌وجو با نام یا کد مرجع…"
            autofocus
          />
        </div>
      </div>
      <div class="flex-1 overflow-y-auto bg-slate-50/60 p-3 dark:bg-slate-900/40">
        <div
          v-if="loading"
          class="text-muted-foreground flex min-h-40 flex-col items-center justify-center gap-3"
        >
          <div
            class="size-7 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600"
          />
          <span class="text-sm">در حال دریافت منابع…</span>
        </div>
        <div
          v-else-if="error"
          class="m-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {{ error }}
        </div>
        <ul v-else-if="filteredItems.length" class="space-y-2">
          <li v-for="r in filteredItems" :key="r.id" class="group">
            <button
              type="button"
              class="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-950 dark:hover:border-indigo-700"
              @click="pick(r)"
            >
              <span
                class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-400"
              >
                <PhPackage class="size-5" />
              </span>
              <span class="min-w-0 flex-1">
                <span
                  class="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100"
                  >{{ r.name }}</span
                >
                <span class="text-muted-foreground mt-1 block text-xs">
                  {{ resourceTypeLabel(r.type)
                  }}<span v-if="r.code"> · کد مرجع: {{ r.code }}</span>
                </span>
                <span
                  v-if="r.description"
                  class="mt-1 line-clamp-2 block text-xs text-slate-500 dark:text-slate-400"
                  >{{ r.description }}</span
                >
              </span>
            </button>
          </li>
        </ul>
        <div
          v-else
          class="text-muted-foreground flex min-h-40 flex-col items-center justify-center gap-2"
        >
          <PhPackage class="size-8 opacity-50" />
          <span class="text-sm">منبعی با این مشخصات پیدا نشد.</span>
        </div>
      </div>
      <div
        class="flex justify-start gap-2 border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
      >
        <Button variant="outline" class="rounded-xl" @click="close">انصراف</Button>
      </div>
    </div>
  </div>
</template>
