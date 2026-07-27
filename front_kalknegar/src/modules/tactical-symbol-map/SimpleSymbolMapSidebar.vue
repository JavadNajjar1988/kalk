<template>
  <div
    class="e3de-sidebar"
    tabindex="0"
    @keydown="onKeyDown"
    @click="onClick(null)"
  >
    <FilterInput
      @focus="onFocus"
      memento-key="ui.sidebar.symbol-search"
      :initial-search="symbolDefaultSearch"
    />
    <div class="symbol-categories">
      <div
        v-for="(category, categoryName) in groupedEntries"
        :key="categoryName"
        class="category-group"
      >
        <div 
          class="category-header"
          :class="{ 'collapsed': !isCategoryExpanded(categoryName) }"
          @click="toggleCategory(categoryName)"
        >
          <span class="category-icon">{{ isCategoryExpanded(categoryName) ? '▼' : '▶' }}</span>
          <span class="category-title">{{ categoryName || 'سایر' }}</span>
          <span class="category-count">({{ category.length }})</span>
        </div>
        <transition name="slide">
          <div 
            v-if="isCategoryExpanded(categoryName)"
            class="category-items"
          >
          <Card
            v-for="entry in category"
            :key="entry.id"
            v-bind="translateEntry(entry)"
            :selected="state.selected.includes(entry.id)"
            :editing="state.editing"
            :onClick="onClick"
            @symbol-dblclick="handleSymbolDoubleClick"
          />
          </div>
        </transition>
      </div>
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
import { translateEntity } from '../../symbology/translations'
import {
  ensurePersianTacticalLabel,
  tacticalWordTranslations
} from './persianTacticalLabels.js'
// Use Ramda's equals for deep equality check
const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b)
import FilterInput from './components/sidebar/FilterInput.vue'
import Card from './components/sidebar/Card.vue'
import './components/sidebar/Sidebar.css'

const emit = defineEmits(['selection-change', 'symbol-dblclick'])

// Custom default search with @symbol scope
const symbolDefaultSearch = {
  history: [{ key: 'root', scope: `@${ID.SYMBOL}`, label: 'symbol' }],
  filter: ''
}
const symbolRootHistory = [{ key: 'root', scope: `@${ID.SYMBOL}`, label: 'symbol' }]

// Get project-specific services from parent
const servicesRef = inject('services')
const services = computed(() => servicesRef?.value || {})
const [search, setSearch] = useMemento('ui.sidebar.symbol-search', symbolDefaultSearch)
const emitter = useEmitter('sidebar')
const state = reactive({ ...defaultState })
const lastSearch = ref(null)

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
  }
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
  return state.entries.find((entry) => entry.id === id) || null
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
  'Rape': 'تجاوز جنسی',
  'Rape Attempted': 'اقدام به تجاوز جنسی',
  'Sea Surface Track': 'رد سطحی دریایی',
  'Space Track': 'رد فضایی',
  'Special Operations Forces (SOF) Unit': 'یگان نیروهای عملیات ویژه',
  'Subsurface Track': 'رد زیرسطحی',
  'Telecommunications Infrastructure': 'زیرساخت مخابرات',
  'Vehicle Incident': 'حادثه وسیله نقلیه',
  'Water Supply Infrastructure': 'زیرساخت تأمین آب',

  // Military dimensions
  'Air': 'هوایی',
  'Ground': 'زمینی',
  'Sea': 'دریایی',
  'Space': 'فضایی',
  'Equipment': 'تجهیزات',
  'Installation': 'تأسیسات',
  'Control Measure': 'اقدامات کنترلی',
  'Control': 'کنترل',
  'Measure': 'اقدامات',
  'Activity': 'فعالیت',
  'Meteorological': 'هواشناسی',
  'Oceanographic': 'اقیانوس‌شناسی',
  'Signal Intelligence': 'اطلاعات سیگنال',
  'SIGINT': 'اطلاعات سیگنال',
  'Cyberspace': 'فضای سایبری',
  'Subsurface': 'زیرسطحی',
  
  // Emergency Management Symbols
  'Emergency Management Symbols': 'نمادهای مدیریت اضطراری',
  'Emergency Management': 'مدیریت اضطراری',
  'Agriculture and Food Infrastructure': 'زیرساخت کشاورزی و غذایی',
  'Agriculture': 'کشاورزی',
  'Food': 'غذا',
  'Special Needs Infrastructure': 'زیرساخت نیازهای ویژه',
  'Special Needs': 'نیازهای ویژه',
  'Natural Events': 'رویدادهای طبیعی',
  'Natural': 'طبیعی',
  'Events': 'رویدادها',
  'Geologic': 'زمین‌شناسی',
  'Geological': 'زمین‌شناسی',
  'Fire Incident': 'حادثه آتش‌سوزی',
  'Fire': 'آتش',
  'Incident': 'حادثه',
  'Hazardous Material Incident': 'حادثه مواد خطرناک',
  'Hazardous Material': 'مواد خطرناک',
  'Hazardous': 'خطرناک',
  'Infrastructure': 'زیرساخت',
  'Transportation Infrastructure': 'زیرساخت حمل و نقل',
  'Transportation': 'حمل و نقل',
  'Energy Infrastructure': 'زیرساخت انرژی',
  'Energy': 'انرژی',
  'Water Infrastructure': 'زیرساخت آب',
  'Water': 'آب',
  'Medical Infrastructure': 'زیرساخت پزشکی',
  'Medical': 'پزشکی',
  'Health': 'بهداشت',
  'Public Works Infrastructure': 'زیرساخت کارهای عمومی',
  'Public Works': 'کارهای عمومی',
  'Emergency Operations': 'عملیات اضطراری',
  'Operations': 'عملیات',
  'Emergency Service': 'خدمات اضطراری',
  'Service': 'خدمات',
  'Search and Rescue': 'جستجو و نجات',
  'Search': 'جستجو',
  'Rescue': 'نجات',
  'Law Enforcement': 'اجرای قانون',
  'Law': 'قانون',
  'Enforcement': 'اجرا',
  'Fire Service': 'خدمات آتش‌نشانی',
  'Medical Service': 'خدمات پزشکی',
  'Communication': 'ارتباطات',
  'Security': 'امنیت',
  'Shelter': 'پناهگاه',
  'Supply': 'تدارکات',
  
  // Additional categories
  'Event (Damage)': 'رویداد (خسارت)',
  'Event (Danger)': 'رویداد (خطر)',
  'Event': 'رویداد',
  'Damage': 'خسارت',
  'Danger': 'خطر',
  'Forces': 'نیروها',
  'Force': 'نیرو',
  'Individual': 'فرد',
  'Items': 'اقلام',
  'Item': 'اقلام',
  'Locations': 'مکان‌ها',
  'Location': 'مکان',
  'Mobility / Survivability': 'تحرک / بقا',
  'Mobility': 'تحرک',
  'Survivability': 'بقا',
  'Nonmilitary Group or Organization': 'گروه یا سازمان غیرنظامی',
  'Nonmilitary Group or Organization (NGO)': 'گروه یا سازمان غیرنظامی (سازمان غیردولتی)',
  'Nonmilitary': 'غیرنظامی',
  'Group': 'گروه',
  'Organization': 'سازمان',
  'NGO': 'سازمان غیردولتی',
  'Tasks': 'وظایف',
  'Task': 'وظیفه',
  'Vehicle': 'وسیله نقلیه',
  'Vehicles': 'وسایل نقلیه',
  'Violent Activities (Death Causing)': 'فعالیت‌های خشونت‌آمیز (مرگ‌بار)',
  'Violent Activities': 'فعالیت‌های خشونت‌آمیز',
  'Violent': 'خشونت‌آمیز',
  'Death Causing': 'مرگ‌بار',
  'Death': 'مرگ',
  'Causing': 'بار',
  
  'Other': 'سایر',
  'Unknown': 'نامشخص'
}

const translateCategory = (category) => {
  if (!category || category.trim() === '') {
    return 'سایر'
  }
  
  const trimmedCategory = category.trim()
  
  // Check exact match first
  if (categoryTranslations[trimmedCategory]) {
    return categoryTranslations[trimmedCategory]
  }
  
  // Check case-insensitive exact match
  const lowerCategory = trimmedCategory.toLowerCase()
  for (const [key, value] of Object.entries(categoryTranslations)) {
    if (key.toLowerCase() === lowerCategory) {
      return value
    }
  }
  
  // Try to find partial matches (longer keys first for better accuracy)
  const sortedKeys = Object.keys(categoryTranslations).sort((a, b) => b.length - a.length)
  for (const key of sortedKeys) {
    const lowerKey = key.toLowerCase()
    // Check if category contains the key or key contains category
    if (lowerCategory.includes(lowerKey) || lowerKey.includes(lowerCategory)) {
      return categoryTranslations[key]
    }
  }
  
  // Try to translate categories with parentheses like "Event (Damage)"
  const parenMatch = trimmedCategory.match(/^(.+?)\s*\((.+?)\)$/)
  if (parenMatch) {
    const mainPart = parenMatch[1].trim()
    const parenPart = parenMatch[2].trim()
    const translatedMain = translateCategory(mainPart)
    const translatedParen = translateCategory(parenPart)
    
    // If both parts were translated, combine them
    if (translatedMain !== mainPart || translatedParen !== parenPart) {
      return `${translatedMain} (${translatedParen})`
    }
  }
  
  // Try word-by-word translation for compound categories
  const words = trimmedCategory.split(/\s+/)
  const translatedWords = words.map(word => {
    // Remove punctuation for matching
    const cleanWord = word.replace(/[()]/g, '')
    // Check if word has translation
    for (const [key, value] of Object.entries(categoryTranslations)) {
      if (key.toLowerCase() === cleanWord.toLowerCase()) {
        return word.replace(cleanWord, value)
      }
    }
    return word
  })
  
  // If any words were translated, join them
  const hasTranslation = translatedWords.some((w, idx) => {
    const originalWord = words[idx]
    return w !== originalWord
  })
  
  if (hasTranslation) {
    return translatedWords.join(' ')
  }
  
  // Return original if no translation found
  return trimmedCategory
}

// Group entries by category (dimension or description)
const groupedEntries = computed(() => {
  const groups = {}
  
  state.entries.forEach(entry => {
    // Extract category from description (hierarchy) or tags (dimensions)
    let category = 'سایر'
    
    // First try to get from description (hierarchy)
    // Skip first part if it's "Emergency Management Symbols" and use second or third part
    if (entry.description) {
      const parts = entry.description.split(' • ').map(p => p.trim()).filter(p => p)
      
      if (parts.length > 0) {
        // If first part is "Emergency Management Symbols", skip it and use next part
        if (parts[0] === 'Emergency Management Symbols' && parts.length > 1) {
          // Use second part (more specific category)
          category = parts[1]
        } else if (parts.length > 1) {
          // Use second part if available (more specific)
          category = parts[1]
        } else {
          // Use first part if only one part exists
          category = parts[0]
        }
      }
    }
    
    // If no description or category is still 'سایر', try tags
    if (category === 'سایر' && entry.tags) {
      const tags = entry.tags.split(' ')
      // Find SYSTEM tags (dimensions) - they are in format SYSTEM:dimension:NONE
      const systemTags = tags.filter(tag => tag.startsWith('SYSTEM:') && tag.includes(':NONE'))
      if (systemTags.length > 0) {
        // Get the first dimension
        const dimension = systemTags[0].split(':')[1]
        if (dimension) {
          category = dimension
        }
      }
    }
    
    // Translate category to Persian
    const persianCategory = ensurePersianTacticalLabel(translateCategory(category))
    
    if (!groups[persianCategory]) {
      groups[persianCategory] = []
    }
    groups[persianCategory].push(entry)
  })
  
  // Sort categories alphabetically (Persian)
  const sortedGroups = {}
  Object.keys(groups).sort().forEach(key => {
    sortedGroups[key] = groups[key]
  })
  
  return sortedGroups
})

// Accordion state for categories
const expandedCategories = ref({})

// Initialize categories expansion state depending on search query and count
watch(() => groupedEntries.value, (entries) => {
  const isFiltering = search.value && search.value.filter && search.value.filter.length > 0
  const isSmallList = Object.keys(entries).length <= 2 || state.entries.length <= 50
  const shouldExpand = isFiltering || isSmallList
  
  Object.keys(entries).forEach(categoryName => {
    if (!(categoryName in expandedCategories.value)) {
      expandedCategories.value[categoryName] = shouldExpand
    }
  })
}, { immediate: true })

// Also watch search filter to expand automatically when searching
watch(() => search.value?.filter, (filter) => {
  if (filter && filter.length > 0) {
    Object.keys(expandedCategories.value).forEach(category => {
      expandedCategories.value[category] = true
    })
  }
})

watch(
  () => state.selected,
  (selected) => {
    const id = selected[selected.length - 1] || null
    emit('selection-change', { id, entry: findEntryById(id) })
  },
  { deep: true }
)

// Check if category is expanded
const isCategoryExpanded = (categoryName) => {
  return expandedCategories.value[categoryName] !== false
}

// Toggle category expand/collapse
const toggleCategory = (categoryName) => {
  expandedCategories.value[categoryName] = !isCategoryExpanded(categoryName)
}

// Comprehensive word dictionary for symbol translation
const wordDictionary = {
  ...tacticalWordTranslations,

  // Common words
  'Area': 'منطقه', 'Areas': 'مناطق',
  'Coordination': 'هماهنگی', 'Coordinate': 'هماهنگ',
  'Airspace': 'حریم هوایی',
  'Circular': 'دایره‌ای', 'Circle': 'دایره',
  'Rectangular': 'مستطیلی', 'Rectangle': 'مستطیل',
  'Tactical': 'تاکتیکی', 'Tactics': 'تاکتیک',
  'Graphics': 'گرافیک‌ها', 'Graphic': 'گرافیک',
  'Fire': 'آتش', 'Fires': 'آتش‌ها',
  'Support': 'پشتیبانی', 'Supports': 'پشتیبانی‌ها',
  'Command': 'فرماندهی', 'Commands': 'فرماندهی‌ها',
  'Control': 'کنترل', 'Controls': 'کنترل‌ها',
  'Adult': 'بزرگسال', 'Adults': 'بزرگسالان',
  'Day': 'روز', 'Days': 'روزها',
  'Care': 'مراقبت', 'Cares': 'مراقبت‌ها',
  'Agricultural': 'کشاورزی', 'Agriculture': 'کشاورزی',
  'Laboratory': 'آزمایشگاه', 'Lab': 'آزمایشگاه', 'Labs': 'آزمایشگاه‌ها',
  'Infrastructure': 'زیرساخت', 'Infrastructures': 'زیرساخت‌ها',
  'Special': 'ویژه', 'Specials': 'ویژه‌ها',
  'Needs': 'نیازها', 'Need': 'نیاز',
  'Natural': 'طبیعی', 'Nature': 'طبیعت',
  'Events': 'رویدادها', 'Event': 'رویداد',
  'Geologic': 'زمین‌شناسی', 'Geological': 'زمین‌شناسی', 'Geology': 'زمین‌شناسی',
  'Aftershock': 'پس‌لرزه', 'Aftershocks': 'پس‌لرزه‌ها',
  'Animal': 'حیوان', 'Animals': 'حیوانات',
  'Feedlot': 'دامداری', 'Feedlots': 'دامداری‌ها',
  'Commercial': 'تجاری', 'Commerce': 'تجارت',
  'Food': 'غذا', 'Foods': 'غذاها',
  'Distribution': 'توزیع', 'Distribute': 'توزیع',
  'Center': 'مرکز', 'Centers': 'مراکز',
  'Farm': 'مزرعه', 'Farms': 'مزارع',
  'Ranch': 'مزرعه دام', 'Ranches': 'مزارع دام',
  'Production': 'تولید', 'Produce': 'تولید',
  'Retail': 'خرده‌فروشی', 'Retails': 'خرده‌فروشی‌ها',
  'Grain': 'غلات', 'Grains': 'غلات',
  'Storage': 'ذخیره‌سازی', 'Store': 'ذخیره',
  'Banking': 'بانکداری', 'Bank': 'بانک', 'Banks': 'بانک‌ها',
  'Finance': 'مالی', 'Financial': 'مالی',
  'Insurance': 'بیمه', 'Insurances': 'بیمه‌ها',
  'ATM': 'خودپرداز', 'ATMs': 'خودپردازها',
  'Bullion': 'شمش', 'Bullions': 'شمش‌ها',
  'Federal': 'فدرال', 'Federation': 'فدراسیون',
  'Reserve': 'ذخیره', 'Reserves': 'ذخایر',
  'Exchange': 'تبادل', 'Exchanges': 'تبادلات',
  'Services': 'خدمات', 'Service': 'خدمات',
  'Other': 'سایر', 'Others': 'سایر',
  'Chemical': 'شیمیایی', 'Chemicals': 'مواد شیمیایی',
  'Plant': 'کارخانه', 'Plants': 'کارخانه‌ها',
  'Firearms': 'اسلحه', 'Firearm': 'اسلحه',
  'Manufacturer': 'تولیدکننده', 'Manufacturers': 'تولیدکنندگان',
  'Facility': 'تأسیسات', 'Facilities': 'تأسیسات',
  'Medical': 'پزشکی', 'Medicine': 'پزشکی',
  'Health': 'بهداشت', 'Healthcare': 'مراقبت بهداشتی',
  'Hospital': 'بیمارستان', 'Hospitals': 'بیمارستان‌ها',
  'Clinic': 'کلینیک', 'Clinics': 'کلینیک‌ها',
  'Emergency': 'اضطراری', 'Emergencies': 'اضطراری‌ها',
  'Management': 'مدیریت', 'Manage': 'مدیریت',
  'Symbols': 'نمادها', 'Symbol': 'نماد',
  'Installation': 'تأسیسات', 'Installations': 'تأسیسات',
  'Activity': 'فعالیت', 'Activities': 'فعالیت‌ها',
  'Damage': 'خسارت', 'Damages': 'خسارات',
  'Danger': 'خطر', 'Dangers': 'خطرات',
  'Forces': 'نیروها', 'Force': 'نیرو',
  'Individual': 'فرد', 'Individuals': 'افراد',
  'Items': 'اقلام', 'Item': 'اقلام',
  'Locations': 'مکان‌ها', 'Location': 'مکان',
  'Mobility': 'تحرک', 'Mobile': 'متحرک',
  'Survivability': 'بقا', 'Survive': 'زنده ماندن',
  'Nonmilitary': 'غیرنظامی', 'Military': 'نظامی',
  'Group': 'گروه', 'Groups': 'گروه‌ها',
  'Organization': 'سازمان', 'Organizations': 'سازمان‌ها',
  'Tasks': 'وظایف', 'Task': 'وظیفه',
  'Vehicle': 'وسیله نقلیه', 'Vehicles': 'وسایل نقلیه',
  'Violent': 'خشونت‌آمیز', 'Violence': 'خشونت',
  'Death': 'مرگ', 'Deaths': 'مرگ‌ها',
  'Causing': 'بار', 'Cause': 'علت',
  'Transportation': 'حمل و نقل', 'Transport': 'حمل',
  'Energy': 'انرژی', 'Energies': 'انرژی‌ها',
  'Water': 'آب', 'Waters': 'آب‌ها',
  'Public': 'عمومی', 'Publics': 'عمومی‌ها',
  'Works': 'کارها', 'Work': 'کار',
  'Operations': 'عملیات', 'Operation': 'عملیات',
  'Search': 'جستجو', 'Searches': 'جستجوها',
  'Rescue': 'نجات', 'Rescues': 'نجات‌ها',
  'Law': 'قانون', 'Laws': 'قوانین',
  'Enforcement': 'اجرا', 'Enforce': 'اجرا',
  'Communication': 'ارتباطات', 'Communicate': 'ارتباط',
  'Security': 'امنیت', 'Secure': 'امن',
  'Shelter': 'پناهگاه', 'Shelters': 'پناهگاه‌ها',
  'Supply': 'تدارکات', 'Supplies': 'تدارکات',
  'Unknown': 'نامشخص',
  'Planned': 'برنامه‌ریزی شده',
  'Anticipated': 'پیش‌بینی شده',
  'Present': 'حاضر',
  'Friend': 'دوست',
  'Hostile': 'دشمن',
  'Neutral': 'خنثی'
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
  'Firearms Manufacturer': 'تولیدکننده اسلحه'
}

// Tag label translations
const tagLabelTranslations = {
  'SYMBOL': 'نماد',
  'EMS': 'EMS',
  'INSTALLATION': 'تأسیسات',
  'ACTIVITY': 'فعالیت',
  'FIRE': 'آتش',
  'CONTROL': 'کنترل',
  'FEATURE': 'ویژگی',
  'LAYER': 'لایه',
  'LINK': 'لینک',
  'MARKER': 'نشانگر',
  'BOOKMARK': 'بوکمارک',
  'PLACE': 'مکان',
  'MEASURE': 'اندازه‌گیری'
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
      .map(part => ensurePersianTacticalLabel(translateText(part.trim())))
      .join(' • ')
  }
  
  // Translate tags
  if (translated.tags) {
    const tags = translated.tags.split(' ')
    const translatedTags = tags.map(tag => {
      const parts = tag.split(':')
      if (parts.length >= 2) {
        const variant = parts[0]
        const label = parts[1]
        const translatedLabel = tagLabelTranslations[label] || label
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
  if (!text || text.trim() === '') {
    return text
  }
  
  const trimmedText = text.trim()

  // Reuse the centralized MIL-STD Persian glossary before applying the
  // sidebar's word-by-word fallback.
  const entityTranslation = translateEntity(trimmedText)
  if (entityTranslation !== trimmedText) {
    return entityTranslation
  }
  
  // Check exact match in symbol translations first
  if (symbolTranslations[trimmedText]) {
    return symbolTranslations[trimmedText]
  }
  
  // Check case-insensitive match in symbol translations
  const lowerText = trimmedText.toLowerCase()
  for (const [key, value] of Object.entries(symbolTranslations)) {
    if (key.toLowerCase() === lowerText) {
      return value
    }
  }
  
  // Try to translate word by word using comprehensive dictionary
  const words = trimmedText.split(/\s+/)
  const translatedWords = words.map(word => {
    // Remove punctuation for matching but keep it in result
    const cleanWord = word.replace(/[(),/]/g, '')
    const punctuation = word.match(/[(),/]/g)?.join('') || ''
    
    // Check in word dictionary first
    if (wordDictionary[cleanWord]) {
      return wordDictionary[cleanWord] + punctuation
    }
    
    // Check case-insensitive in word dictionary
    for (const [key, value] of Object.entries(wordDictionary)) {
      if (key.toLowerCase() === cleanWord.toLowerCase()) {
        return value + punctuation
      }
    }
    
    // Check in symbol translations
    for (const [key, value] of Object.entries(symbolTranslations)) {
      if (key.toLowerCase() === cleanWord.toLowerCase()) {
        return value + punctuation
      }
    }
    
    // Check in category translations
    for (const [key, value] of Object.entries(categoryTranslations)) {
      if (key.toLowerCase() === cleanWord.toLowerCase()) {
        return value + punctuation
      }
    }
    
    // Try partial match in word dictionary (for compound words)
    for (const [key, value] of Object.entries(wordDictionary)) {
      if (cleanWord.toLowerCase().includes(key.toLowerCase()) && key.length > 3) {
        return cleanWord.replace(new RegExp(key, 'gi'), value) + punctuation
      }
    }
    
    return word
  })
  
  // If any words were translated, join them
  const hasTranslation = translatedWords.some((w, idx) => {
    return w !== words[idx]
  })
  
  if (hasTranslation) {
    return translatedWords.join(' ')
  }
  
  // Try to find partial matches in symbol translations (for compound names)
  const sortedKeys = Object.keys(symbolTranslations).sort((a, b) => b.length - a.length)
  for (const key of sortedKeys) {
    const lowerKey = key.toLowerCase()
    if (lowerText.includes(lowerKey)) {
      return trimmedText.replace(new RegExp(key, 'gi'), symbolTranslations[key])
    }
  }
  
  // Return original if no translation found
  return trimmedText
}

// Effects
onMounted(() => {
  // Always start symbol sidebar from symbol scope so the full list is visible.
  setSearch({ history: symbolRootHistory, filter: '' })

  // Wait for services to be available
  watch(() => servicesRef?.value, (svcs) => {
    if (!svcs) return
    
    const disposable = Disposable.of()

    // Handle sidebar events
    const pin = (id) => svcs.store.addTag(id, 'pin')
    const unpin = (id) => svcs.store.removeTag(id, 'pin')

    const link = (id) => {
      const entry = R.find(R.propEq(id, 'id'), state.entries)
      setHistory([...search.value.history, {
        key: id,
        label: entry.title,
        scope: `@link !link+${id}`
      }])
    }

    const polygon = async (id) => {
      const entry = R.find(R.propEq(id, 'id'), state.entries)
      const geometry = await svcs.store.geometry(id)
      setHistory([...search.value.history, {
        scope: `@feature &geometry:${JSON.stringify(geometry)}`,
        key: id,
        label: entry.title || 'N/A'
      }])
    }

    const layerOpen = (id) => {
      const entry = R.find(R.propEq(id, 'id'), state.entries)
      setHistory([...search.value.history, {
        scope: `@feature !feature:${ID.layerUUID(id)}`,
        key: id,
        label: entry.title
      }])
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
    watch([() => search.value.history, () => search.value.filter, () => search.value.force], async ([history, filter, force], _, onCleanup) => {
      if (!svcs.searchIndex) {
        dispatch({ type: 'entries', entries: [] })
        return
      }

      const safeHistory = Array.isArray(history) && history.length ? history : symbolRootHistory
      const safeScope = R.last(safeHistory)?.scope || `@${ID.SYMBOL}`
      const safeFilter = typeof filter === 'string' ? filter : ''
      const terms = `${safeScope} ${safeFilter}`.trim()
      const options = { force: force || false }

      // Updated search/filter must clear any selection
      if (!isEqual(lastSearch.value, search.value)) {
        dispatch({ type: 'clear' })
      }

      const queryDisposable = await svcs.searchIndex.query(terms, options, (entries) => {
        dispatch({ type: 'entries', entries })
      })

      lastSearch.value = { ...search.value }

      onCleanup(() => {
        if (queryDisposable && queryDisposable.dispose) {
          queryDisposable.dispose()
        }
      })
    }, { immediate: true })

    // Sync global selection with list model
    if (svcs.selection) {
      const event = () => ({ type: 'selection', selected: svcs.selection.selected() })
      disposable.on(svcs.selection, 'selection', () => dispatch(event()))
      
      // Initial sync
      dispatch(event())
    }

    // Sync list selection with global selection
    watch(() => state.selected, (selected) => {
      if (svcs.selection) {
        svcs.selection.set(selected)
      }
    })

    // Keep this sidebar fixed on symbol scope.
    if (svcs.selection) {
      disposable.on(svcs.selection, 'focus', ({ id }) => {
        dispatch({ type: 'focus', id })
      })
    }

    onUnmounted(() => {
      disposable.dispose()
    })
  }, { immediate: true })
})
</script>

<style scoped>
@import './components/sidebar/Sidebar.css';

.symbol-categories {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.category-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.category-header {
  font-weight: 600;
  font-size: 0.9rem;
  color: #333;
  padding: 0.5rem 0.75rem;
  background-color: #f5f5f5;
  border-radius: 4px;
  border-right: 3px solid #40a9ff;
  text-align: right;
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(4px);
  background-color: rgba(245, 245, 245, 0.95);
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;
}

.category-header:hover {
  background-color: rgba(230, 230, 230, 0.95);
}

.category-header.collapsed {
  border-right-color: #999;
}

.category-icon {
  font-size: 0.7rem;
  color: #666;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.category-title {
  flex: 1;
  text-align: right;
}

.category-count {
  font-size: 0.8rem;
  color: #666;
  font-weight: normal;
  flex-shrink: 0;
}

.category-items {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0 0.5rem;
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
</style>
