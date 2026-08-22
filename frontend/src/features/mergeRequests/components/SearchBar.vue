<template>
  <div class="w-full max-w-xs">
    <label for="search-merge-requests" class="sr-only">Buscar merge requests</label>
    <input
      id="search-merge-requests"
      type="search"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      placeholder="Buscar por título, autor o rama..."
      autocomplete="off"
      class="bg-bg text-text-primary placeholder:text-text-faint border border-control rounded-md px-2.5 py-2 text-[13px] w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    />
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: '' },
})
defineEmits(['update:modelValue'])
</script>
