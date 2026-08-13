<template>
  <input
    type="text"
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
    placeholder="Buscar por título, autor o rama..."
    class="bg-bg text-text-primary border border-border rounded-md px-2.5 py-2 text-[13px] w-full max-w-xs focus:outline-2 focus:outline-accent focus:outline-offset-1"
  />
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: '' },
})
defineEmits(['update:modelValue'])
</script>
