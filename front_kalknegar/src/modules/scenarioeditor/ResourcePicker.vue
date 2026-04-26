<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  resourceApiService,
  type ResourceSearchResultDto,
  type ResourceType,
} from "@/services/api/resourceApiService";

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
    const res = await resourceApiService.search(q || "", props.type, 50);
    items.value = res;
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

const typeLabel = computed(() => {
  switch (props.type) {
    case "personnel":
      return "پرسنل";
    case "equipment":
      return "تجهیزات";
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
});
</script>

<template>
  <div
    v-if="props.open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    @click.self="close"
  >
    <div
      class="bg-background flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-md shadow-lg"
    >
      <div class="border-b px-4 py-3">
        <h3 class="text-base font-semibold">{{ props.title }}</h3>
        <p class="text-muted-foreground text-xs">نوع: {{ typeLabel }}</p>
      </div>
      <div class="border-b p-3">
        <Input
          v-model="query"
          placeholder="جستجو در نام/کد منبع …"
          autofocus
        />
      </div>
      <div class="flex-1 overflow-y-auto">
        <div v-if="loading" class="text-muted-foreground p-4 text-sm">
          در حال بارگذاری…
        </div>
        <div v-else-if="error" class="p-4 text-sm text-red-600">
          {{ error }}
        </div>
        <ul v-else-if="filteredItems.length" class="divide-y">
          <li v-for="r in filteredItems" :key="r.id">
            <button
              type="button"
              class="hover:bg-accent flex w-full flex-col items-start gap-1 px-4 py-2 text-right"
              @click="pick(r)"
            >
              <span class="text-sm font-medium">{{ r.name }}</span>
              <span class="text-muted-foreground text-xs"
                >{{ r.type }}<span v-if="r.code"> · کد: {{ r.code }}</span></span
              >
              <span v-if="r.description" class="text-muted-foreground text-xs">
                {{ r.description }}
              </span>
            </button>
          </li>
        </ul>
        <div v-else class="text-muted-foreground p-4 text-sm">
          نتیجه‌ای یافت نشد.
        </div>
      </div>
      <div class="flex justify-end gap-2 border-t p-3">
        <Button variant="outline" size="sm" @click="close">بستن</Button>
      </div>
    </div>
  </div>
</template>
