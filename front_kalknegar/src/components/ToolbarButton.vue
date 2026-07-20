<template>
  <button
    type="button"
    class="relative inline-flex items-center border px-3 py-2 text-sm font-medium transition-colors focus:z-10 focus:ring-1 focus:ring-gray-500/40 focus:outline-hidden disabled:opacity-50 sm:px-2"
    :class="[
      start && 'rounded-l-md',
      end && 'rounded-r-md',
      top && 'rounded-t-md',
      bottom && 'rounded-b-md',
      active
        ? 'border-lime-300 bg-lime-200/80 text-gray-900'
        : 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200',
    ]"
  >
    <slot />
  </button>
</template>

<script>
export default {
  name: "ToolbarButton",
  props: {
    start: { type: Boolean, default: false },
    end: { type: Boolean, default: false },
    top: { type: Boolean, default: false },
    bottom: { type: Boolean, default: false },
    active: { type: Boolean, default: false },
  },
};
</script>
