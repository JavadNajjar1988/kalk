<template>
  <div class="e3de-sidebar" tabindex="0" @keydown="onKeyDown" @click="onClick(null)">
    <FilterInput
      @focus="onFocus"
      memento-key="ui.sidebar.symbol-search"
      :initial-search="symbolDefaultSearch"
    />
    <div class="taxonomy-filters" aria-label="فیلترهای دسته‌بندی نمادها">
      <label class="taxonomy-filter">
        <span>محیط</span>
        <select v-model="taxonomyFilters.environment">
          <option value="">همه محیط‌ها</option>
          <option
            v-for="option in TAXONOMY_ENVIRONMENTS"
            :key="option.key"
            :value="option.key"
          >
            {{ option.label }}
          </option>
        </select>
      </label>
      <label class="taxonomy-filter">
        <span>نوع ترسیم</span>
        <select v-model="taxonomyFilters.drawingType">
          <option value="">همه انواع</option>
          <option
            v-for="option in TAXONOMY_DRAWING_TYPES"
            :key="option.key"
            :value="option.key"
          >
            {{ option.label }}
          </option>
        </select>
      </label>
      <label class="taxonomy-filter">
        <span>استاندارد</span>
        <select v-model="taxonomyFilters.standard">
          <option value="">همه استانداردها</option>
          <option
            v-for="option in TAXONOMY_STANDARDS"
            :key="option.key"
            :value="option.key"
          >
            {{ option.label }}
          </option>
        </select>
      </label>
      <button
        v-if="hasTaxonomyFilter"
        type="button"
        class="taxonomy-reset"
        title="پاک‌کردن فیلترها"
        @click="resetTaxonomyFilters"
      >
        پاک‌کردن
      </button>
    </div>
    <div class="symbol-categories">
      <div class="category-group favorite-category">
        <button
          type="button"
          class="category-header favorite-category-header"
          :class="{ collapsed: !favoriteCategoryExpanded }"
          :aria-expanded="favoriteCategoryExpanded"
          @click="favoriteCategoryExpanded = !favoriteCategoryExpanded"
        >
          <span class="category-icon">{{
            favoriteCategoryExpanded ? '▼' : '▶'
          }}</span>
          <span class="favorite-category-icon" aria-hidden="true">♥</span>
          <span class="category-title">کاربردی‌تر</span>
        <span class="category-count">({{ filteredFavoriteEntries.length }})</span>
        </button>
        <transition name="slide">
          <div v-if="favoriteCategoryExpanded">
            <div v-if="filteredFavoriteEntries.length" class="category-items">
              <Card
                v-for="entry in filteredFavoriteEntries"
                :key="`favorite-${entry.id}`"
                v-bind="translateEntry(entry)"
                compact
                :draw-on-double-click="false"
                :selected="state.selected.includes(entry.id)"
                :editing="state.editing"
                :onClick="onClick"
                @favorite-change="handleFavoriteChange"
                @symbol-dblclick="handleSymbolDoubleClick"
              />
            </div>
            <p v-else class="favorite-empty">
              هنوز نمادی انتخاب نشده؛ برای افزودن به این بخش، روی قلب کنار نماد بزنید.
            </p>
          </div>
        </transition>
      </div>
      <div
        v-for="category in groupedEntries"
        :key="category.key"
        class="category-group"
      >
        <button
          type="button"
          class="category-header"
          :class="{ collapsed: !isCategoryExpanded(category.key) }"
          :aria-expanded="isCategoryExpanded(category.key)"
          @click="toggleCategory(category.key)"
        >
          <span class="category-icon">{{
            isCategoryExpanded(category.key) ? '▼' : '▶'
          }}</span>
          <span class="category-title">{{ category.label }}</span>
          <span class="category-count">({{ category.count }})</span>
        </button>
        <transition name="slide">
          <div v-if="isCategoryExpanded(category.key)" class="environment-groups">
            <section
              v-for="environment in category.environments"
              :key="`${category.key}-${environment.key}`"
              class="environment-group"
            >
              <button
                type="button"
                class="environment-header"
                :class="{ collapsed: !isEnvironmentExpanded(category.key, environment.key) }"
                :aria-expanded="isEnvironmentExpanded(category.key, environment.key)"
                @click="toggleEnvironment(category.key, environment.key)"
              >
                <span class="environment-icon">{{
                  isEnvironmentExpanded(category.key, environment.key) ? '−' : '+'
                }}</span>
                <span>{{ environment.label }}</span>
                <span class="category-count">({{ environment.entries.length }})</span>
              </button>
              <transition name="slide">
                <div
                  v-if="isEnvironmentExpanded(category.key, environment.key)"
                  class="category-items"
                >
                  <Card
                    v-for="entry in environment.entries"
                    :key="entry.id"
                    v-bind="translateEntry(entry)"
                    compact
                    :draw-on-double-click="false"
                    :selected="state.selected.includes(entry.id)"
                    :editing="state.editing"
                    :onClick="onClick"
                    @favorite-change="handleFavoriteChange"
                    @symbol-dblclick="handleSymbolDoubleClick"
                  />
                </div>
              </transition>
            </section>
          </div>
        </transition>
      </div>
      <p v-if="!groupedEntries.length" class="taxonomy-empty">
        نمادی با این ترکیب فیلتر پیدا نشد.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onUnmounted, inject, computed } from 'vue'
import { useMemento } from './composables/useMemento.js'
import { useEmitter } from './composables/useEmitter.js'
import { Disposable } from './shared/disposable.js'
import { multiselect } from './model/selection/multiselect.js'
import { defaultState } from './components/sidebar/state.js'
import { matcher, preventDefault } from './components/events.js'
import * as R from 'ramda'
import * as ID from './ids.js'
import {
  ensurePersianTacticalLabel,
  tacticalWordTranslations,
} from './persianTacticalLabels.js'
import {
  TAXONOMY_CATEGORIES,
  TAXONOMY_DRAWING_TYPES,
  TAXONOMY_ENVIRONMENTS,
  TAXONOMY_STANDARDS,
  classifySymbolEntry,
} from './symbolTaxonomy.js'
// Use Ramda's equals for deep equality check
const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b)
import FilterInput from './components/sidebar/FilterInput.vue'
import Card from './components/sidebar/Card.vue'
import './components/sidebar/Sidebar.css'

const emit = defineEmits(['selection-change', 'symbol-dblclick'])

// Custom default search with @symbol scope
const symbolDefaultSearch = {
  history: [{ key: 'root', scope: `@${ID.SYMBOL}`, label: 'symbol' }],
  filter: '',
}
const symbolRootHistory = [{ key: 'root', scope: `@${ID.SYMBOL}`, label: 'symbol' }]

// Get project-specific services from parent
const servicesRef = inject('services')
const services = computed(() => servicesRef?.value || {})
const [search, setSearch] = useMemento('ui.sidebar.symbol-search', symbolDefaultSearch)
const emitter = useEmitter('sidebar')
const state = reactive({ ...defaultState })
const lastSearch = ref(null)
const taxonomyFilters = reactive({
  environment: '',
  drawingType: '',
  standard: '',
})

const hasTaxonomyFilter = computed(() =>
  Object.values(taxonomyFilters).some(Boolean),
)

const resetTaxonomyFilters = () => {
  taxonomyFilters.environment = ''
  taxonomyFilters.drawingType = ''
  taxonomyFilters.standard = ''
}

// Handlers for state reducer
const handlers = {
  'edit/begin': (state, { id }) => {
    if (state.editing) return state
    else if (!id && state.selected.length === 0) return state
    else {
      const editing = id || R.last(state.selected)
      return { ...state, editing }
    }
  },
  'edit/rollback': (state) => {
    if (state.editing) return { ...state, editing: false }
    else return state
  },
  'edit/commit': (state) => {
    if (state.editing) return { ...state, editing: false }
    else return state
  },
  deselect: (state) => {
    if (state.selected.length) return { ...state, selected: [] }
    else return state
  },
}

const reducer = (state, event) => {
  if (Array.isArray(event)) {
    return event.reduce((state, event) => reducer(state, event), state)
  } else {
    const type = event.type
    const handler = handlers[type] || multiselect[type] || R.identity
    const next = handler(state, event)
    return next
  }
}

const dispatch = (action) => {
  const next = reducer(state, action)
  if (next !== state) {
    Object.assign(state, next)
  }
}

const setHistory = (history) => {
  setSearch({ filter: '', history })
}

const onClick = (id) => (event) => {
  if (!id) {
    dispatch({ type: 'clear' })
    return
  }
  event.stopPropagation()
  const { metaKey, ctrlKey, shiftKey } = event
  dispatch({ type: 'click', id, metaKey, ctrlKey, shiftKey })
}

const onKeyDown = (event) => {
  if (matcher('Escape')(event)) {
    preventDefault(event)
    dispatch({ type: 'clear' })
  }
}

const onFocus = () => {
  dispatch({ type: 'focus' })
}

const findEntryById = (id) => {
  if (!id) return null
  const entry = state.entries.find((entry) => entry.id === id)
  return entry ? translateEntry(entry) : null
}

const handleSymbolDoubleClick = (id) => {
  const entry = findEntryById(id)
  emit('symbol-dblclick', { id, entry })
}

// Category name translation to Persian
const categoryTranslations = {
  // MIL-STD-2525 warfighting hierarchy
  'Warfighting Symbols': 'نمادهای رزم',
  'Air Incident': 'حادثه هوایی',
  'Air Track': 'رد هوایی',
  'Civil Disturbance Incident': 'حادثه ناآرامی مدنی',
  'Combat Service Support': 'پشتیبانی خدمات رزمی',
  'Command and Control and General Maneuver': 'فرماندهی، کنترل و مانور عمومی',
  'Criminal Activity Incident': 'حادثه فعالیت مجرمانه',
  'Educational Facilities Infrastructure': 'زیرساخت تأسیسات آموزشی',
  'Energy Facilities Infrastructure': 'زیرساخت تأسیسات انرژی',
  'Generic / Unspecified': 'عمومی / نامشخص',
  'Government Site Infrastructure': 'زیرساخت مراکز دولتی',
  'Ground Track': 'رد زمینی',
  'Ground Track Equipment': 'تجهیزات رد زمینی',
  'Individual Leader': 'رهبر فردی',
  'Individual Targeted': 'فرد هدف‌گیری‌شده',
  'Individual Terrorist': 'فرد تروریست',
  'Marine Incident': 'حادثه دریایی',
  'Military Infrastructure': 'زیرساخت نظامی',
  'Postal Service Infrastructure': 'زیرساخت خدمات پستی',
  'Psychological Operations (PSYOP)': 'عملیات روانی',
  'Public Venues Infrastructure': 'زیرساخت اماکن عمومی',
  'Rail Incident': 'حادثه ریلی',
  Rape: 'تجاوز جنسی',
  'Rape Attempted': 'اقدام به تجاوز جنسی',
  'Sea Surface Track': 'رد سطحی دریایی',
  'Space Track': 'رد فضایی',
  'Special Operations Forces (SOF) Unit': 'یگان نیروهای عملیات ویژه',
  'Subsurface Track': 'رد زیرسطحی',
  'Telecommunications Infrastructure': 'زیرساخت مخابرات',
  'Vehicle Incident': 'حادثه وسیله نقلیه',
  'Water Supply Infrastructure': 'زیرساخت تأمین آب',

  // Military dimensions
  Air: 'هوایی',
  Ground: 'زمینی',
  Sea: 'دریایی',
  Space: 'فضایی',
  Equipment: 'تجهیزات',
  Installation: 'تأسیسات',
  'Control Measure': 'اقدامات کنترلی',
  Control: 'کنترل',
  Measure: 'اقدامات',
  Activity: 'فعالیت',
  Meteorological: 'هواشناسی',
  Oceanographic: 'اقیانوس‌شناسی',
  'Signal Intelligence': 'اطلاعات سیگنال',
  SIGINT: 'اطلاعات سیگنال',
  Cyberspace: 'فضای سایبری',
  Subsurface: 'زیرسطحی',

  // Emergency Management Symbols
  'Emergency Management Symbols': 'نمادهای مدیریت اضطراری',
  'Emergency Management': 'مدیریت اضطراری',
  'Agriculture and Food Infrastructure': 'زیرساخت کشاورزی و غذایی',
  Agriculture: 'کشاورزی',
  Food: 'غذا',
  'Special Needs Infrastructure': 'زیرساخت نیازهای ویژه',
  'Special Needs': 'نیازهای ویژه',
  'Natural Events': 'رویدادهای طبیعی',
  Natural: 'طبیعی',
  Events: 'رویدادها',
  Geologic: 'زمین‌شناسی',
  Geological: 'زمین‌شناسی',
  'Fire Incident': 'حادثه آتش‌سوزی',
  Fire: 'آتش',
  Incident: 'حادثه',
  'Hazardous Material Incident': 'حادثه مواد خطرناک',
  'Hazardous Material': 'مواد خطرناک',
  Hazardous: 'خطرناک',
  Infrastructure: 'زیرساخت',
  'Transportation Infrastructure': 'زیرساخت حمل و نقل',
  Transportation: 'حمل و نقل',
  'Energy Infrastructure': 'زیرساخت انرژی',
  Energy: 'انرژی',
  'Water Infrastructure': 'زیرساخت آب',
  Water: 'آب',
  'Medical Infrastructure': 'زیرساخت پزشکی',
  Medical: 'پزشکی',
  Health: 'بهداشت',
  'Public Works Infrastructure': 'زیرساخت کارهای عمومی',
  'Public Works': 'کارهای عمومی',
  'Emergency Operations': 'عملیات اضطراری',
  Operations: 'عملیات',
  'Emergency Service': 'خدمات اضطراری',
  Service: 'خدمات',
  'Search and Rescue': 'جستجو و نجات',
  Search: 'جستجو',
  Rescue: 'نجات',
  'Law Enforcement': 'اجرای قانون',
  Law: 'قانون',
  Enforcement: 'اجرا',
  'Fire Service': 'خدمات آتش‌نشانی',
  'Medical Service': 'خدمات پزشکی',
  Communication: 'ارتباطات',
  Security: 'امنیت',
  Shelter: 'پناهگاه',
  Supply: 'تدارکات',

  // Additional categories
  'Event (Damage)': 'رویداد (خسارت)',
  'Event (Danger)': 'رویداد (خطر)',
  Event: 'رویداد',
  Damage: 'خسارت',
  Danger: 'خطر',
  Forces: 'نیروها',
  Force: 'نیرو',
  Individual: 'فرد',
  Items: 'اقلام',
  Item: 'اقلام',
  Locations: 'مکان‌ها',
  Location: 'مکان',
  'Mobility / Survivability': 'تحرک / بقا',
  Mobility: 'تحرک',
  Survivability: 'بقا',
  'Nonmilitary Group or Organization': 'گروه یا سازمان غیرنظامی',
  'Nonmilitary Group or Organization (NGO)': 'گروه یا سازمان غیرنظامی (سازمان غیردولتی)',
  Nonmilitary: 'غیرنظامی',
  Group: 'گروه',
  Organization: 'سازمان',
  NGO: 'سازمان غیردولتی',
  Tasks: 'وظایف',
  Task: 'وظیفه',
  Vehicle: 'وسیله نقلیه',
  Vehicles: 'وسایل نقلیه',
  'Violent Activities (Death Causing)': 'فعالیت‌های خشونت‌آمیز (مرگ‌بار)',
  'Violent Activities': 'فعالیت‌های خشونت‌آمیز',
  Violent: 'خشونت‌آمیز',
  'Death Causing': 'مرگ‌بار',
  Death: 'مرگ',
  Causing: 'بار',

  Other: 'سایر',
  Unknown: 'نامشخص',
}

const translateCategory = (category) => {
  if (!category || category.trim() === '') return 'سایر'
  return ensurePersianTacticalLabel(category.trim())
}

const matchesTaxonomyFilters = (entry) => {
  const classification = classifySymbolEntry(entry)
  return (
    (!taxonomyFilters.environment ||
      classification.environment === taxonomyFilters.environment) &&
    (!taxonomyFilters.drawingType ||
      classification.drawingType === taxonomyFilters.drawingType) &&
    (!taxonomyFilters.standard || classification.standard === taxonomyFilters.standard)
  )
}

// Group first by semantic purpose, then by operational environment.
const groupedEntries = computed(() => {
  const groups = new Map(
    TAXONOMY_CATEGORIES.map((category) => [
      category.key,
      new Map(TAXONOMY_ENVIRONMENTS.map((environment) => [environment.key, []])),
    ]),
  )

  state.entries.filter(matchesTaxonomyFilters).forEach((entry) => {
    const classification = classifySymbolEntry(entry)
    groups.get(classification.category)?.get(classification.environment)?.push(entry)
  })

  return TAXONOMY_CATEGORIES.map((category) => {
    const environments = TAXONOMY_ENVIRONMENTS.map((environment) => ({
      ...environment,
      entries: groups.get(category.key)?.get(environment.key) || [],
    })).filter((environment) => environment.entries.length)

    return {
      ...category,
      environments,
      count: environments.reduce((total, environment) => total + environment.entries.length, 0),
    }
  }).filter((category) => category.count)
})

const favoriteTag = 'USER:pin:NONE'

const isFavoriteEntry = (entry) =>
  String(entry.tags || '')
    .split(' ')
    .some((tag) => tag.toUpperCase() === favoriteTag.toUpperCase())

const favoriteEntries = computed(() => state.entries.filter(isFavoriteEntry))
const filteredFavoriteEntries = computed(() =>
  favoriteEntries.value.filter(matchesTaxonomyFilters),
)
const favoriteCategoryExpanded = ref(true)

const handleFavoriteChange = ({ id, favorite }) => {
  const entry = state.entries.find((item) => item.id === id)
  if (!entry) return

  const tags = String(entry.tags || '')
    .split(' ')
    .filter(Boolean)
    .filter((tag) => tag.toUpperCase() !== favoriteTag.toUpperCase())

  if (favorite) tags.push(favoriteTag)
  entry.tags = tags.join(' ')
}

// Accordion state for categories
const expandedCategories = ref({})
const expandedEnvironments = ref({})

// Initialize categories expansion state depending on search query and count
watch(
  () => groupedEntries.value,
  (entries) => {
    const isFiltering =
      search.value && search.value.filter && search.value.filter.length > 0
    const isSmallList = entries.length <= 2 || state.entries.length <= 50
    const shouldExpand = isFiltering || isSmallList

    entries.forEach((category) => {
      if (!(category.key in expandedCategories.value)) {
        expandedCategories.value[category.key] = shouldExpand
      }
      category.environments.forEach((environment) => {
        const key = `${category.key}:${environment.key}`
        if (!(key in expandedEnvironments.value)) {
          expandedEnvironments.value[key] = shouldExpand || category.environments.length === 1
        }
      })
    })
  },
  { immediate: true },
)

// Also watch search filter to expand automatically when searching
watch(
  () => search.value?.filter,
  (filter) => {
    if (filter && filter.length > 0) {
      Object.keys(expandedCategories.value).forEach((category) => {
        expandedCategories.value[category] = true
      })
      Object.keys(expandedEnvironments.value).forEach((environment) => {
        expandedEnvironments.value[environment] = true
      })
    }
  },
)

watch(
  () => state.selected,
  (selected) => {
    const id = selected[selected.length - 1] || null
    emit('selection-change', { id, entry: findEntryById(id) })
  },
  { deep: true },
)

// Check if category is expanded
const isCategoryExpanded = (categoryName) => {
  return expandedCategories.value[categoryName] !== false
}

// Toggle category expand/collapse
const toggleCategory = (categoryName) => {
  expandedCategories.value[categoryName] = !isCategoryExpanded(categoryName)
}

const environmentExpansionKey = (categoryKey, environmentKey) =>
  `${categoryKey}:${environmentKey}`

const isEnvironmentExpanded = (categoryKey, environmentKey) =>
  expandedEnvironments.value[environmentExpansionKey(categoryKey, environmentKey)] !== false

const toggleEnvironment = (categoryKey, environmentKey) => {
  const key = environmentExpansionKey(categoryKey, environmentKey)
  expandedEnvironments.value[key] = !isEnvironmentExpanded(categoryKey, environmentKey)
}

// Comprehensive word dictionary for symbol translation
const wordDictionary = {
  ...tacticalWordTranslations,

  // Common words
  Area: 'منطقه',
  Areas: 'مناطق',
  Coordination: 'هماهنگی',
  Coordinate: 'هماهنگ',
  Airspace: 'حریم هوایی',
  Circular: 'دایره‌ای',
  Circle: 'دایره',
  Rectangular: 'مستطیلی',
  Rectangle: 'مستطیل',
  Tactical: 'تاکتیکی',
  Tactics: 'تاکتیک',
  Graphics: 'گرافیک‌ها',
  Graphic: 'گرافیک',
  Fire: 'آتش',
  Fires: 'آتش‌ها',
  Support: 'پشتیبانی',
  Supports: 'پشتیبانی‌ها',
  Command: 'فرماندهی',
  Commands: 'فرماندهی‌ها',
  Control: 'کنترل',
  Controls: 'کنترل‌ها',
  Adult: 'بزرگسال',
  Adults: 'بزرگسالان',
  Day: 'روز',
  Days: 'روزها',
  Care: 'مراقبت',
  Cares: 'مراقبت‌ها',
  Agricultural: 'کشاورزی',
  Agriculture: 'کشاورزی',
  Laboratory: 'آزمایشگاه',
  Lab: 'آزمایشگاه',
  Labs: 'آزمایشگاه‌ها',
  Infrastructure: 'زیرساخت',
  Infrastructures: 'زیرساخت‌ها',
  Special: 'ویژه',
  Specials: 'ویژه‌ها',
  Needs: 'نیازها',
  Need: 'نیاز',
  Natural: 'طبیعی',
  Nature: 'طبیعت',
  Events: 'رویدادها',
  Event: 'رویداد',
  Geologic: 'زمین‌شناسی',
  Geological: 'زمین‌شناسی',
  Geology: 'زمین‌شناسی',
  Aftershock: 'پس‌لرزه',
  Aftershocks: 'پس‌لرزه‌ها',
  Animal: 'حیوان',
  Animals: 'حیوانات',
  Feedlot: 'دامداری',
  Feedlots: 'دامداری‌ها',
  Commercial: 'تجاری',
  Commerce: 'تجارت',
  Food: 'غذا',
  Foods: 'غذاها',
  Distribution: 'توزیع',
  Distribute: 'توزیع',
  Center: 'مرکز',
  Centers: 'مراکز',
  Farm: 'مزرعه',
  Farms: 'مزارع',
  Ranch: 'مزرعه دام',
  Ranches: 'مزارع دام',
  Production: 'تولید',
  Produce: 'تولید',
  Retail: 'خرده‌فروشی',
  Retails: 'خرده‌فروشی‌ها',
  Grain: 'غلات',
  Grains: 'غلات',
  Storage: 'ذخیره‌سازی',
  Store: 'ذخیره',
  Banking: 'بانکداری',
  Bank: 'بانک',
  Banks: 'بانک‌ها',
  Finance: 'مالی',
  Financial: 'مالی',
  Insurance: 'بیمه',
  Insurances: 'بیمه‌ها',
  ATM: 'خودپرداز',
  ATMs: 'خودپردازها',
  Bullion: 'شمش',
  Bullions: 'شمش‌ها',
  Federal: 'فدرال',
  Federation: 'فدراسیون',
  Reserve: 'ذخیره',
  Reserves: 'ذخایر',
  Exchange: 'تبادل',
  Exchanges: 'تبادلات',
  Services: 'خدمات',
  Service: 'خدمات',
  Other: 'سایر',
  Others: 'سایر',
  Chemical: 'شیمیایی',
  Chemicals: 'مواد شیمیایی',
  Plant: 'کارخانه',
  Plants: 'کارخانه‌ها',
  Firearms: 'اسلحه',
  Firearm: 'اسلحه',
  Manufacturer: 'تولیدکننده',
  Manufacturers: 'تولیدکنندگان',
  Facility: 'تأسیسات',
  Facilities: 'تأسیسات',
  Medical: 'پزشکی',
  Medicine: 'پزشکی',
  Health: 'بهداشت',
  Healthcare: 'مراقبت بهداشتی',
  Hospital: 'بیمارستان',
  Hospitals: 'بیمارستان‌ها',
  Clinic: 'کلینیک',
  Clinics: 'کلینیک‌ها',
  Emergency: 'اضطراری',
  Emergencies: 'اضطراری‌ها',
  Management: 'مدیریت',
  Manage: 'مدیریت',
  Symbols: 'نمادها',
  Symbol: 'نماد',
  Installation: 'تأسیسات',
  Installations: 'تأسیسات',
  Activity: 'فعالیت',
  Activities: 'فعالیت‌ها',
  Damage: 'خسارت',
  Damages: 'خسارات',
  Danger: 'خطر',
  Dangers: 'خطرات',
  Forces: 'نیروها',
  Force: 'نیرو',
  Individual: 'فرد',
  Individuals: 'افراد',
  Items: 'اقلام',
  Item: 'اقلام',
  Locations: 'مکان‌ها',
  Location: 'مکان',
  Mobility: 'تحرک',
  Mobile: 'متحرک',
  Survivability: 'بقا',
  Survive: 'زنده ماندن',
  Nonmilitary: 'غیرنظامی',
  Military: 'نظامی',
  Group: 'گروه',
  Groups: 'گروه‌ها',
  Organization: 'سازمان',
  Organizations: 'سازمان‌ها',
  Tasks: 'وظایف',
  Task: 'وظیفه',
  Vehicle: 'وسیله نقلیه',
  Vehicles: 'وسایل نقلیه',
  Violent: 'خشونت‌آمیز',
  Violence: 'خشونت',
  Death: 'مرگ',
  Deaths: 'مرگ‌ها',
  Causing: 'بار',
  Cause: 'علت',
  Transportation: 'حمل و نقل',
  Transport: 'حمل',
  Energy: 'انرژی',
  Energies: 'انرژی‌ها',
  Water: 'آب',
  Waters: 'آب‌ها',
  Public: 'عمومی',
  Publics: 'عمومی‌ها',
  Works: 'کارها',
  Work: 'کار',
  Operations: 'عملیات',
  Operation: 'عملیات',
  Search: 'جستجو',
  Searches: 'جستجوها',
  Rescue: 'نجات',
  Rescues: 'نجات‌ها',
  Law: 'قانون',
  Laws: 'قوانین',
  Enforcement: 'اجرا',
  Enforce: 'اجرا',
  Communication: 'ارتباطات',
  Communicate: 'ارتباط',
  Security: 'امنیت',
  Secure: 'امن',
  Shelter: 'پناهگاه',
  Shelters: 'پناهگاه‌ها',
  Supply: 'تدارکات',
  Supplies: 'تدارکات',
  Unknown: 'نامشخص',
  Planned: 'برنامه‌ریزی شده',
  Anticipated: 'پیش‌بینی شده',
  Present: 'حاضر',
  Friend: 'دوست',
  Hostile: 'دشمن',
  Neutral: 'خنثی',
}

// Symbol name and description translations
const symbolTranslations = {
  // Keep specific translations for compound names
  'Airspace Coordination Area (ACA)': 'منطقه هماهنگی حریم هوایی (ACA)',
  'Airspace Coordination Area': 'منطقه هماهنگی حریم هوایی',
  'Tactical Graphics': 'گرافیک‌های تاکتیکی',
  'Fire Support': 'پشتیبانی آتش',
  'Command & Control Areas': 'مناطق فرماندهی و کنترل',
  'Command & Control': 'فرماندهی و کنترل',
  'Adult Day Care': 'مراقبت روزانه بزرگسالان',
  'Agricultural Laboratory': 'آزمایشگاه کشاورزی',
  'Animal Feedlot': 'دامداری',
  'Commercial Food Distribution Center': 'مرکز توزیع مواد غذایی تجاری',
  'Farm / Ranch': 'مزرعه / مزرعه دام',
  'Food Production Center': 'مرکز تولید مواد غذایی',
  'Food Retail': 'خرده‌فروشی مواد غذایی',
  'Grain Storage': 'ذخیره‌سازی غلات',
  'Banking Finance and Insurance Infrastructure': 'زیرساخت بانکداری، مالی و بیمه',
  'Federal Reserve Bank': 'بانک فدرال رزرو',
  'Financial Exchange': 'تبادل مالی',
  'Financial Services Other': 'سایر خدمات مالی',
  'Commercial Infrastructure': 'زیرساخت تجاری',
  'Chemical Plant': 'کارخانه شیمیایی',
  'Firearms Manufacturer': 'تولیدکننده اسلحه',
}

// Tag label translations
const tagLabelTranslations = {
  SYMBOL: 'نماد',
  AIR: 'هوایی',
  C2: 'فرماندهی و کنترل',
  CS: 'پشتیبانی رزمی',
  CSS: 'پشتیبانی خدمات رزمی',
  EMS: 'مدیریت اضطراری',
  LAND: 'زمینی',
  MARITIME: 'دریایی',
  SIGINT: 'اطلاعات سیگنال',
  SO: 'عملیات ویژه',
  SOF: 'نیروهای عملیات ویژه',
  SPACE: 'فضایی',
  SUBSURFACE: 'زیرسطحی',
  SURFACE: 'سطحی',
  TASK: 'وظیفه',
  UNIT: 'یگان',
  INSTALLATION: 'تأسیسات',
  EQUIPMENT: 'تجهیزات',
  ACTIVITY: 'فعالیت',
  FIRE: 'آتش',
  CONTROL: 'کنترل',
  FEATURE: 'ویژگی',
  LAYER: 'لایه',
  LINK: 'لینک',
  MARKER: 'نشانگر',
  BOOKMARK: 'بوکمارک',
  PLACE: 'مکان',
  MEASURE: 'اندازه‌گیری',
}

// Translate entry title, description and tags
const translateEntry = (entry) => {
  const translated = { ...entry }

  // Translate title
  if (translated.title) {
    translated.title = ensurePersianTacticalLabel(translateText(translated.title))
  }

  // Translate description
  if (translated.description) {
    translated.description = translated.description
      .split(' • ')
      .map((part) => ensurePersianTacticalLabel(translateText(part.trim())))
      .join(' • ')
  }

  // Translate tags
  if (translated.tags) {
    const tags = translated.tags.split(' ')
    const translatedTags = tags.map((tag) => {
      const parts = tag.split(':')
      if (parts.length >= 2) {
        const label = parts[1]
        const translatedLabel =
          tagLabelTranslations[label] ||
          ensurePersianTacticalLabel(translateText(label.replaceAll('_', ' ')))
        parts[1] = translatedLabel
        return parts.join(':')
      }
      return tag
    })
    translated.tags = translatedTags.join(' ')
  }

  return translated
}

// Translate text (title or description part)
const translateText = (text) => {
  if (!text || text.trim() === '') return text
  return ensurePersianTacticalLabel(text.trim())
}

const normalizePersianSearch = (value) =>
  String(value || '')
    .normalize('NFKC')
    .toLocaleLowerCase('fa')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ۀ/g, 'ه')
    .replace(/[\u064b-\u065f\u0670\u200c\u200d]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

// Effects
onMounted(() => {
  // Always start symbol sidebar from symbol scope so the full list is visible.
  setSearch({ history: symbolRootHistory, filter: '' })

  // Wait for services to be available
  watch(
    () => servicesRef?.value,
    (svcs) => {
      if (!svcs) return

      const disposable = Disposable.of()

      // Handle sidebar events
      const pin = (id) => svcs.store.addTag(id, 'pin')
      const unpin = (id) => svcs.store.removeTag(id, 'pin')

      const link = (id) => {
        const entry = R.find(R.propEq(id, 'id'), state.entries)
        setHistory([
          ...search.value.history,
          {
            key: id,
            label: entry.title,
            scope: `@link !link+${id}`,
          },
        ])
      }

      const polygon = async (id) => {
        const entry = R.find(R.propEq(id, 'id'), state.entries)
        const geometry = await svcs.store.geometry(id)
        setHistory([
          ...search.value.history,
          {
            scope: `@feature &geometry:${JSON.stringify(geometry)}`,
            key: id,
            label: entry.title || 'N/A',
          },
        ])
      }

      const layerOpen = (id) => {
        const entry = R.find(R.propEq(id, 'id'), state.entries)
        setHistory([
          ...search.value.history,
          {
            scope: `@feature !feature:${ID.layerUUID(id)}`,
            key: id,
            label: entry.title,
          },
        ])
      }

      const edit = async (event) => {
        if (event.action === 'commit') {
          await svcs.store.rename(event.id, event.value.trim())
        }
        if (event.action === 'commit' || event.action === 'rollback') {
          const sidebar = document.getElementsByClassName('e3de-sidebar')[0]
          if (sidebar) sidebar.focus()
        }
        dispatch({ type: event.path, id: event.id })
      }

      disposable.on(emitter, 'edit/:action', edit)
      disposable.on(emitter, 'pin', ({ id }) => pin(id))
      disposable.on(emitter, 'unpin', ({ id }) => unpin(id))
      disposable.on(emitter, 'link', ({ id }) => link(id))
      disposable.on(emitter, 'polygon', ({ id }) => polygon(id))
      disposable.on(emitter, 'layer/open', ({ id }) => layerOpen(id))

      // Fetch entries when history and/or filter changed
      watch(
        [() => search.value.history, () => search.value.filter, () => search.value.force],
        async ([history, filter, force], _, onCleanup) => {
          if (!svcs.searchIndex) {
            dispatch({ type: 'entries', entries: [] })
            return
          }

          const safeHistory =
            Array.isArray(history) && history.length ? history : symbolRootHistory
          const safeScope = R.last(safeHistory)?.scope || `@${ID.SYMBOL}`
          const safeFilter = typeof filter === 'string' ? filter.trim() : ''
          const isPersianFilter = /[\u0600-\u06ff]/.test(safeFilter)
          // The source index contains the original MIL-STD English hierarchy.
          // For a Persian query, retrieve the current symbol scope and filter
          // against the exact localized strings rendered by this component.
          const terms = `${safeScope} ${isPersianFilter ? '' : safeFilter}`.trim()
          const options = { force: force || false }

          // Updated search/filter must clear any selection
          if (!isEqual(lastSearch.value, search.value)) {
            dispatch({ type: 'clear' })
          }

          const queryDisposable = await svcs.searchIndex.query(
            terms,
            options,
            (entries) => {
              if (!isPersianFilter) {
                dispatch({ type: 'entries', entries })
                return
              }

              const normalizedFilter = normalizePersianSearch(safeFilter)
              const filteredEntries = entries.filter((entry) => {
                const translated = translateEntry(entry)
                const category = entry.description
                  ?.split(' • ')
                  .map((part) => ensurePersianTacticalLabel(translateCategory(part)))
                  .join(' ')
                const searchableText = [
                  translated.title,
                  translated.description,
                  translated.tags,
                  category,
                ]
                  .filter(Boolean)
                  .join(' ')

                return normalizePersianSearch(searchableText).includes(normalizedFilter)
              })

              dispatch({ type: 'entries', entries: filteredEntries })
            },
          )

          lastSearch.value = { ...search.value }

          onCleanup(() => {
            if (queryDisposable && queryDisposable.dispose) {
              queryDisposable.dispose()
            }
          })
        },
        { immediate: true },
      )

      // Sync global selection with list model
      if (svcs.selection) {
        const event = () => ({ type: 'selection', selected: svcs.selection.selected() })
        disposable.on(svcs.selection, 'selection', () => dispatch(event()))

        // Initial sync
        dispatch(event())
      }

      // Sync list selection with global selection
      watch(
        () => state.selected,
        (selected) => {
          if (svcs.selection) {
            svcs.selection.set(selected)
          }
        },
      )

      // Keep this sidebar fixed on symbol scope.
      if (svcs.selection) {
        disposable.on(svcs.selection, 'focus', ({ id }) => {
          dispatch({ type: 'focus', id })
        })
      }

      onUnmounted(() => {
        disposable.dispose()
      })
    },
    { immediate: true },
  )
})
</script>

<style scoped>
@import './components/sidebar/Sidebar.css';

.symbol-categories {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.15rem 0.15rem 1rem;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--color-primary) 24%, transparent) transparent;
}

.taxonomy-filters {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.4rem;
  margin-bottom: 0.65rem;
  padding: 0.55rem;
  border: 1px solid var(--surface-border);
  border-radius: 0.7rem;
  background: color-mix(in srgb, var(--surface-panel) 92%, transparent);
}

.taxonomy-filter {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.2rem;
  color: hsl(var(--muted-foreground));
  font-size: 0.6rem;
  font-weight: 700;
}

.taxonomy-filter select {
  min-width: 0;
  height: 2rem;
  border: 1px solid var(--surface-border);
  border-radius: 0.5rem;
  padding: 0 0.4rem;
  color: var(--color-foreground);
  background: var(--surface-panel-muted);
  font: inherit;
  font-size: 0.66rem;
  outline: none;
}

.taxonomy-filter select:focus {
  border-color: color-mix(in srgb, var(--color-primary) 60%, var(--surface-border));
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 14%, transparent);
}

.taxonomy-reset {
  grid-column: 1 / -1;
  justify-self: end;
  border: 0;
  padding: 0.15rem 0.25rem;
  color: var(--color-primary);
  background: transparent;
  font-size: 0.64rem;
  font-weight: 700;
  cursor: pointer;
}

.taxonomy-empty {
  margin: 0;
  border: 1px dashed var(--surface-border);
  border-radius: 0.65rem;
  padding: 1rem 0.75rem;
  color: hsl(var(--muted-foreground));
  font-size: 0.72rem;
  text-align: center;
}

.category-group {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.favorite-category {
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--surface-border);
}

.favorite-category-header {
  width: 100%;
  cursor: pointer;
  border-color: color-mix(in srgb, #e11d48 25%, var(--surface-border));
  background: color-mix(in srgb, #e11d48 6%, var(--surface-panel));
  font-family: inherit;
}

.favorite-category-header:hover {
  border-color: color-mix(in srgb, #e11d48 42%, var(--surface-border));
  background: color-mix(in srgb, #e11d48 10%, var(--surface-panel));
}

.favorite-category-icon {
  display: grid;
  width: 1.25rem;
  height: 1.25rem;
  place-items: center;
  color: #e11d48;
  font-size: 0.85rem;
}

.favorite-empty {
  margin: 0;
  border: 1px dashed var(--surface-border);
  border-radius: 0.65rem;
  padding: 0.7rem 0.8rem;
  color: hsl(var(--muted-foreground));
  background: color-mix(in srgb, var(--surface-panel-muted) 45%, transparent);
  font-size: 0.7rem;
  line-height: 1.7;
  text-align: center;
}

.category-header {
  min-height: 38px;
  padding: 0.45rem 0.65rem;
  border: 1px solid var(--surface-border);
  border-radius: 0.65rem;
  color: var(--color-foreground);
  background: color-mix(in srgb, var(--surface-panel) 94%, transparent);
  font-size: 0.76rem;
  font-weight: 700;
  text-align: right;
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(10px);
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;
}

.category-header:hover {
  border-color: color-mix(in srgb, var(--color-primary) 28%, var(--surface-border));
  background: color-mix(in srgb, var(--color-primary) 5%, var(--surface-panel));
}

.category-header.collapsed {
  color: hsl(var(--muted-foreground));
}

.category-icon {
  display: grid;
  width: 1.25rem;
  height: 1.25rem;
  place-items: center;
  border-radius: 0.35rem;
  color: hsl(var(--muted-foreground));
  background: var(--surface-panel-muted);
  font-size: 0.55rem;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.category-title {
  flex: 1;
  text-align: right;
}

.category-count {
  min-width: 1.7rem;
  border-radius: 999px;
  padding: 0.15rem 0.35rem;
  color: hsl(var(--muted-foreground));
  background: var(--surface-panel-muted);
  font-size: 0.62rem;
  font-weight: 600;
  text-align: center;
  flex-shrink: 0;
}

.category-items {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem;
  padding: 0 0.15rem;
}

.environment-groups {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.1rem 0.25rem 0;
}

.environment-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.environment-header {
  display: flex;
  min-height: 30px;
  align-items: center;
  gap: 0.4rem;
  border: 0;
  border-inline-start: 3px solid
    color-mix(in srgb, var(--color-primary) 45%, var(--surface-border));
  border-radius: 0.4rem;
  padding: 0.3rem 0.55rem;
  color: var(--color-foreground);
  background: var(--surface-panel-muted);
  font-family: inherit;
  font-size: 0.68rem;
  font-weight: 700;
  text-align: right;
  cursor: pointer;
}

.environment-header > :nth-child(2) {
  flex: 1;
}

.environment-header.collapsed {
  color: hsl(var(--muted-foreground));
}

.environment-icon {
  display: grid;
  width: 1rem;
  height: 1rem;
  place-items: center;
  color: var(--color-primary);
  font-size: 0.8rem;
}

/* Accordion transition animations */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-enter-from {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.slide-enter-to {
  max-height: 5000px;
  opacity: 1;
}

.slide-leave-from {
  max-height: 5000px;
  opacity: 1;
}

.slide-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

@media (max-width: 380px) {
  .taxonomy-filters {
    grid-template-columns: 1fr;
  }

  .category-items {
    grid-template-columns: 1fr;
  }
}
</style>
