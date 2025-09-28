<script setup>
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/vue";
import { PhMinus as Minus, PhPlus as Plus } from "@phosphor-icons/vue";

const props = defineProps(["label"]);
const emit = defineEmits(["opened", "closed"]);
</script>

<template>
  <Disclosure
    as="div"
    class="border-b border-gray-200 py-6 dark:border-gray-700"
    v-slot="{ open }"
  >
    <h3 class="-my-3 flow-root">
      <DisclosureButton
        @click="open ? emit('closed') : emit('opened')"
        class="group flex w-full items-center justify-between py-3 text-sm text-gray-400"
      >
        <span class="text-heading font-bold">
          <slot name="label">{{ label }}</slot>
        </span>
        <span class="mr-6 flex items-center">
          <slot name="right"></slot>
          <Plus
            v-if="!open"
            class="dark:group-hover:text-heading h-5 w-5 group-hover:text-gray-500"
            aria-hidden="true"
          />
          <Minus
            v-else
            class="dark:group-hover:text-heading h-5 w-5 group-hover:text-gray-500"
            aria-hidden="true"
          />
        </span>
      </DisclosureButton>
    </h3>
    <slot v-if="!open" name="closedContent" />
    <DisclosurePanel class="space-y-4 pt-6 pr-6">
      <slot></slot>
    </DisclosurePanel>
  </Disclosure>
</template>
