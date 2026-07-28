<template>
  <div dir="rtl" class="flex gap-4 px-0.5">
    <aside class="border-border hidden w-56 flex-none border-l pl-4 md:block">
      <p class="text-sm leading-7 font-bold">نوع موجودیت</p>
      <ul class="text-muted-foreground space-y-1 text-sm font-medium">
        <li
          v-for="[entity, entityIcons] in filteredIconsByEntity"
          :key="entity"
          class="hover:text-foreground"
        >
          <a href="#" type="button" @click.prevent="goTo(entityIcons[0].code)">{{
            entity
          }}</a>
        </li>
      </ul>
      <p class="mt-4 text-sm leading-7 font-bold">تغییردهنده‌ها</p>
      <ul class="text-muted-foreground space-y-1 text-sm font-medium">
        <li v-if="filteredMod1Items.length" class="hover:text-foreground">
          <a href="#" type="button" @click.prevent="goTo('mod1')">تغییردهندهٔ نوع اول</a>
        </li>
        <li v-if="filteredMod2Items.length" class="hover:text-foreground">
          <a href="#" type="button" @click.prevent="goTo('mod2')">تغییردهندهٔ نوع دوم</a>
        </li>
      </ul>
    </aside>
    <div class="flex-auto">
      <div class="relative">
        <MagnifyingGlassIcon
          class="text-muted-foreground pointer-events-none absolute top-3.5 right-3 h-5 w-5"
          aria-hidden="true"
        />
        <input
          type="text"
          class="border-input bg-background placeholder:text-muted-foreground focus:ring-ring/30 h-12 w-full rounded-lg border pr-10 pl-3 focus:ring-2 sm:text-sm"
          placeholder="جستجو در نمادهای این مجموعه..."
          @keydown.esc="onEsc"
          v-model="searchQuery"
          ref="inputRef"
        />
      </div>
      <SymbolCodeSelect
        v-model="symbolSetValue"
        :items="symbolSets"
        :symbol-options="symbolOptions"
        label="مجموعه نماد"
      />

      <div class="mt-4 max-h-[40vh] overflow-auto sm:max-h-[50vh]">
        <section class="border-border mb-3 overflow-hidden rounded-xl border">
          <button
            type="button"
            class="bg-rose-50/70 hover:bg-rose-50 dark:bg-rose-950/20 dark:hover:bg-rose-950/30 flex w-full items-center gap-2 px-4 py-3 text-right transition-colors"
            :aria-expanded="favoriteCategoryExpanded"
            @click="favoriteCategoryExpanded = !favoriteCategoryExpanded"
          >
            <PhCaretDown
              class="text-muted-foreground size-4 shrink-0 transition-transform"
              :class="{ '-rotate-90': !favoriteCategoryExpanded }"
            />
            <PhHeart class="size-4 shrink-0 text-rose-600" weight="fill" />
            <span class="flex-auto text-sm font-bold">کاربردی‌تر</span>
            <span
              class="bg-background text-muted-foreground min-w-7 rounded-full border px-2 py-0.5 text-center text-xs font-semibold"
            >
              {{ favoriteIcons.length }}
            </span>
          </button>
          <div v-if="favoriteCategoryExpanded" class="border-border border-t">
            <div
              v-if="favoriteIcons.length"
              class="grid grid-cols-2 gap-2 p-2 sm:grid-cols-3"
            >
              <div
                v-for="icon in favoriteIcons"
                :key="`favorite-${icon.sidc}`"
                class="relative"
              >
                <button
                  type="button"
                  class="border-border bg-background hover:bg-accent flex min-h-28 w-full flex-col items-center justify-start rounded-xl border p-3 pt-8 transition-colors"
                  :class="
                    icon.code === iconValue ? 'ring-primary bg-primary/5 ring-2' : ''
                  "
                  :aria-label="icon.displayLabel"
                  :aria-pressed="icon.code === iconValue"
                  @click="iconValue = icon.code"
                >
                  <MilSymbol
                    aria-hidden="true"
                    :size="symbolSize"
                    :sidc="icon.sidc"
                    :modifiers="symbolOptions"
                  />
                  <p
                    v-if="icon.detailLabel"
                    class="text-muted-foreground mt-1 max-w-full truncate overflow-hidden text-center text-xs"
                  >
                    {{ icon.detailLabel }}
                  </p>
                  <p
                    class="mt-1 max-w-full overflow-hidden text-center text-sm font-medium break-words"
                    :class="icon.code === iconValue ? 'text-primary' : ''"
                  >
                    {{ icon.displayLabel }}
                  </p>
                </button>
                <button
                  type="button"
                  class="bg-background/90 absolute top-2 left-2 grid size-7 place-items-center rounded-full border text-rose-600 shadow-sm transition-transform hover:scale-105"
                  title="حذف از کاربردی‌تر"
                  aria-label="حذف از کاربردی‌تر"
                  @click.stop="toggleFavorite(icon.sidc)"
                >
                  <PhHeart class="size-4" weight="fill" />
                </button>
              </div>
            </div>
            <p
              v-else
              class="text-muted-foreground px-4 py-5 text-center text-xs leading-6"
            >
              هنوز نمادی انتخاب نشده؛ برای افزودن به این بخش، قلب کنار نماد را
              انتخاب کنید.
            </p>
          </div>
        </section>

        <div
          v-for="[entity, entityIcons] in filteredIconsByEntity"
          :key="entity"
          class="border-border relative mb-2 overflow-hidden rounded-xl border"
        >
          <button
            type="button"
            class="bg-muted/70 hover:bg-muted sticky top-0 z-10 flex w-full items-center gap-2 px-4 py-2.5 text-right text-sm font-semibold transition-colors"
            :id="entity"
            :aria-expanded="isEntityExpanded(entity)"
            @click="toggleEntity(entity)"
          >
            <PhCaretDown
              class="text-muted-foreground size-4 shrink-0 transition-transform"
              :class="{ '-rotate-90': !isEntityExpanded(entity) }"
            />
            <span class="flex-auto">{{ entity }}</span>
            <span
              class="bg-background text-muted-foreground min-w-7 rounded-full border px-2 py-0.5 text-center text-xs"
            >
              {{ entityIcons.length }}
            </span>
          </button>
          <div
            v-if="isEntityExpanded(entity)"
            class="grid grid-cols-2 gap-2 p-2 sm:grid-cols-3"
          >
            <div v-for="icon in entityIcons" :key="icon.sidc" class="relative">
              <button
                type="button"
                :id="`scode-${icon.code}`"
                @click="iconValue = icon.code"
                :aria-label="icon.displayLabel"
                :aria-pressed="icon.code === iconValue"
                class="border-border bg-background hover:bg-accent flex min-h-28 w-full scroll-m-12 flex-col items-center justify-start rounded-xl border p-3 pt-8 transition-colors"
                :class="
                  icon.code === iconValue ? 'ring-primary bg-primary/5 ring-2' : ''
                "
              >
                <MilSymbol
                  aria-hidden="true"
                  :size="symbolSize"
                  :sidc="icon.sidc"
                  :modifiers="symbolOptions"
                />
                <p
                  v-if="icon.detailLabel"
                  class="text-muted-foreground mt-1 max-w-full truncate overflow-hidden text-center text-xs"
                >
                  {{ icon.detailLabel }}
                </p>
                <p
                  class="mt-1 max-w-full overflow-hidden text-center text-sm font-medium break-words"
                  :class="icon.code === iconValue ? 'text-primary' : ''"
                >
                  {{ icon.displayLabel }}
                </p>
              </button>
              <button
                type="button"
                class="bg-background/90 absolute top-2 left-2 grid size-7 place-items-center rounded-full border shadow-sm transition-transform hover:scale-105"
                :class="
                  isFavorite(icon.sidc)
                    ? 'text-rose-600'
                    : 'text-muted-foreground hover:text-rose-600'
                "
                :title="
                  isFavorite(icon.sidc)
                    ? 'حذف از کاربردی‌تر'
                    : 'افزودن به کاربردی‌تر'
                "
                :aria-label="
                  isFavorite(icon.sidc)
                    ? 'حذف از کاربردی‌تر'
                    : 'افزودن به کاربردی‌تر'
                "
                :aria-pressed="isFavorite(icon.sidc)"
                @click.stop="toggleFavorite(icon.sidc)"
              >
                <PhHeart
                  class="size-4"
                  :weight="isFavorite(icon.sidc) ? 'fill' : 'regular'"
                />
              </button>
            </div>
          </div>
        </div>
        <h3
          v-if="filteredMod1Items.length"
          class="border-border bg-muted sticky top-0 z-10 border-y p-2 px-4 text-sm font-medium"
        >
          تغییردهندهٔ نوع اول
        </h3>
        <div
          v-if="filteredMod1Items.length"
          id="scode-mod1"
          class="mt-3 grid scroll-m-12 grid-cols-2 gap-2 p-1 sm:grid-cols-3"
        >
          <button
            type="button"
            v-for="{ sidc, text, code } in filteredMod1Items"
            :key="sidc"
            @click="mod1Value = code"
            :aria-label="text"
            :aria-pressed="code === mod1Value"
            class="border-border bg-background hover:bg-accent flex min-h-24 w-full flex-col items-center justify-start rounded-xl border p-3 transition-colors"
            :class="code === mod1Value ? 'ring-primary bg-primary/5 ring-2' : ''"
          >
            <MilSymbol
              aria-hidden="true"
              :size="symbolSize"
              :sidc="sidc"
              :modifiers="symbolOptions"
            />
            <p class="mt-1 max-w-full overflow-hidden text-center text-sm break-words">
              {{ text }}
            </p>
          </button>
        </div>
        <h3
          v-if="filteredMod2Items.length"
          class="border-border bg-muted sticky top-0 z-10 border-y p-2 px-4 text-sm font-medium"
        >
          تغییردهندهٔ نوع دوم
        </h3>
        <div
          v-if="filteredMod2Items.length"
          id="scode-mod2"
          class="mt-3 grid scroll-m-12 grid-cols-2 gap-2 p-1 sm:grid-cols-3"
        >
          <button
            type="button"
            v-for="{ sidc, text, code } in filteredMod2Items"
            :key="sidc"
            @click="mod2Value = code"
            :aria-label="text"
            :aria-pressed="code === mod2Value"
            class="border-border bg-background hover:bg-accent flex min-h-24 w-full flex-col items-center justify-start rounded-xl border p-3 transition-colors"
            :class="code === mod2Value ? 'ring-primary bg-primary/5 ring-2' : ''"
          >
            <MilSymbol
              aria-hidden="true"
              :size="symbolSize"
              :sidc="sidc"
              :modifiers="symbolOptions"
            />
            <p class="mt-1 max-w-full overflow-hidden text-center text-sm break-words">
              {{ text }}
            </p>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import MilSymbol from "./MilSymbol.vue";
import SymbolCodeSelect from "./SymbolCodeSelect.vue";
import { computed, nextTick, onActivated, ref, watch } from "vue";
import { groupBy } from "@/utils";
import { useSymbolItems } from "@/composables/symbolData";
import { type UnitSymbolOptions } from "@/types/scenarioModels";
import {
  PhCaretDown,
  PhHeart,
  PhMagnifyingGlass as MagnifyingGlassIcon,
} from "@phosphor-icons/vue";
import { breakpointsTailwind, useBreakpoints, useDebounce } from "@vueuse/core";
import {
  translateEntity,
  translateEntitySubtype,
  translateEntityType,
} from "@/symbology/translations";

interface Props {
  initialSidc: string;
  symbolSize?: number;
  symbolOptions?: UnitSymbolOptions;
}

const props = withDefaults(defineProps<Props>(), { symbolSize: 32 });
const searchQuery = ref("");
const debouncedQuery = useDebounce(searchQuery, 100);
const inputRef = ref();
const favoriteCategoryExpanded = ref(true);
const expandedEntities = ref<Set<string>>(new Set());
const favoritesStorageKey = "kalknegar.symbol-favorites.v1";

function loadFavoriteSidcs() {
  try {
    const stored = JSON.parse(localStorage.getItem(favoritesStorageKey) || "[]");
    return new Set<string>(Array.isArray(stored) ? stored : []);
  } catch {
    return new Set<string>();
  }
}

const favoriteSidcs = ref<Set<string>>(loadFavoriteSidcs());

const {
  mod1Items,
  mod2Items,
  mod1Value,
  mod2Value,
  symbolSets,
  symbolSetValue,
  icons,
  iconValue,
  csidc,
  isLoaded,
  loadData,
} = useSymbolItems(computed(() => props.initialSidc));

if (!isLoaded.value) loadData();

const emit = defineEmits(["update-sidc"]);

const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.smallerOrEqual("md");

function visiblePersianLabel(
  value: string | undefined,
  translator: (text: string) => string,
) {
  if (!value) return "";
  return translator(value);
}

const localizedIcons = computed(() =>
  icons.value.map((icon) => {
    const translatedEntity = visiblePersianLabel(icon.entity, translateEntity);
    const entityLabel = translatedEntity || "سایر نمادها";
    const entityTypeLabel = visiblePersianLabel(icon.entityType, translateEntityType);
    const entitySubtypeLabel = visiblePersianLabel(
      icon.entitySubtype,
      translateEntitySubtype,
    );
    const displayLabel =
      entitySubtypeLabel || entityTypeLabel || translatedEntity || "نماد نامشخص";

    return {
      ...icon,
      entityLabel,
      entityTypeLabel,
      entitySubtypeLabel,
      displayLabel,
      detailLabel: entitySubtypeLabel && entityTypeLabel ? entityTypeLabel : "",
    };
  }),
);

const filteredIconsByEntity = computed(() => {
  if (!debouncedQuery.value.trim()) return groupBy(localizedIcons.value, "entityLabel");
  const query = debouncedQuery.value.toLocaleLowerCase("fa");
  const filtered = localizedIcons.value.filter((icon) => {
    return (
      icon.entityLabel.toLocaleLowerCase("fa").includes(query) ||
      icon.entityTypeLabel.toLocaleLowerCase("fa").includes(query) ||
      icon.entitySubtypeLabel.toLocaleLowerCase("fa").includes(query) ||
      icon.entity.toLowerCase().includes(query) ||
      icon.entityType?.toLowerCase().includes(query) ||
      icon.entitySubtype?.toLowerCase().includes(query) ||
      icon.code.includes(query)
    );
  });
  return groupBy(filtered, "entityLabel");
});

const favoriteIcons = computed(() => {
  const query = debouncedQuery.value.trim().toLocaleLowerCase("fa");
  return localizedIcons.value.filter((icon) => {
    if (!favoriteSidcs.value.has(icon.sidc)) return false;
    if (!query) return true;
    return (
      icon.displayLabel.toLocaleLowerCase("fa").includes(query) ||
      icon.detailLabel.toLocaleLowerCase("fa").includes(query) ||
      icon.entityLabel.toLocaleLowerCase("fa").includes(query) ||
      icon.code.includes(query)
    );
  });
});

function isFavorite(sidc: string) {
  return favoriteSidcs.value.has(sidc);
}

function toggleFavorite(sidc: string) {
  const next = new Set(favoriteSidcs.value);
  if (next.has(sidc)) next.delete(sidc);
  else next.add(sidc);
  favoriteSidcs.value = next;
  localStorage.setItem(favoritesStorageKey, JSON.stringify([...next]));
}

function isEntityExpanded(entity: string) {
  return expandedEntities.value.has(entity);
}

function toggleEntity(entity: string) {
  const next = new Set(expandedEntities.value);
  if (next.has(entity)) next.delete(entity);
  else next.add(entity);
  expandedEntities.value = next;
}

function localizeModifierItems(items: typeof mod1Items.value) {
  return items.map((item) => ({
    ...item,
    searchText: item.text,
    text: item.text,
  }));
}

const localizedMod1Items = computed(() => localizeModifierItems(mod1Items.value));
const localizedMod2Items = computed(() => localizeModifierItems(mod2Items.value));

const filteredMod1Items = computed(() => {
  if (!debouncedQuery.value.trim()) return localizedMod1Items.value;
  const query = debouncedQuery.value.toLowerCase();
  return localizedMod1Items.value.filter(
    (item) =>
      item.text.toLowerCase().includes(query) ||
      item.searchText.toLowerCase().includes(query),
  );
});

const filteredMod2Items = computed(() => {
  if (!debouncedQuery.value.trim()) return localizedMod2Items.value;
  const query = debouncedQuery.value.toLowerCase();
  return localizedMod2Items.value.filter(
    (item) =>
      item.text.toLowerCase().includes(query) ||
      item.searchText.toLowerCase().includes(query),
  );
});

watch([mod1Value, mod2Value, iconValue], (value, oldValue) => {
  emit("update-sidc", csidc.value);
});

async function goTo(sidc: string) {
  const targetGroup = [...filteredIconsByEntity.value].find(([, entityIcons]) =>
    entityIcons.some((icon) => icon.code === sidc),
  );
  if (targetGroup && !isEntityExpanded(targetGroup[0])) {
    toggleEntity(targetGroup[0]);
    await nextTick();
  }
  document.getElementById(`scode-${sidc}`)?.scrollIntoView(true);
}

onActivated(() => {
  searchQuery.value = "";
  nextTick(() => {
    if (!isMobile.value) {
      inputRef.value.focus();
    }
    void goTo(iconValue.value);
  });
});

watch(
  [localizedIcons, iconValue],
  ([currentIcons, currentCode]) => {
    const currentIcon = currentIcons.find((icon) => icon.code === currentCode);
    if (!currentIcon || isEntityExpanded(currentIcon.entityLabel)) return;
    expandedEntities.value = new Set([
      ...expandedEntities.value,
      currentIcon.entityLabel,
    ]);
  },
  { immediate: true },
);

function onEsc(e: KeyboardEvent) {
  if (searchQuery.value.length) {
    e.stopPropagation();
    searchQuery.value = "";
  }
}
</script>
