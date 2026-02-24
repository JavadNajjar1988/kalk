<template>
  <div
    class="floating-panel rounded-xl border text-sm text-foreground"
  >
    <slot />
  </div>
  </template>
<style scoped>
.floating-panel {
  background-color: var(--surface-panel);
  border-color: var(--surface-border);
  box-shadow: 0 10px 24px var(--surface-shadow);
}
</style>
