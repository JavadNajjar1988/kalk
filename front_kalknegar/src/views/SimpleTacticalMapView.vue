<template>
  <div class="flex h-screen flex-col bg-background text-foreground">
    <header class="flex items-center justify-center border-b px-4 py-3 shadow-sm">
      <h1 class="text-lg font-semibold">
        نمادهای تاکتیکال
      </h1>
    </header>
    <main class="flex flex-1 min-h-0">
      <div class="flex-1">
        <MapContainer class="h-full w-full" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import MapContainer from "@/components/MapContainer.vue";
</script>


