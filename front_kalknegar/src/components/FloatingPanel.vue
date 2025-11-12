<template>
  <div
    class="floating-panel text-foreground backdrop-blur-md rounded-2xl text-sm shadow-xl"
  >
    <slot />
  </div>
  </template>
<style scoped>
.floating-panel {
  background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
}

:global(.dark) .floating-panel {
  background-color: color-mix(in srgb, var(--color-primary) 5%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
}

@supports (backdrop-filter: blur(1px)) {
  .floating-panel {
    background-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
  }
  
  :global(.dark) .floating-panel {
    background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
  }
}
</style>
