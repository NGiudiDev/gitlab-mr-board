import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchBar from './SearchBar.vue'

describe('SearchBar', () => {
  it('asocia una etiqueta accesible al campo de búsqueda', () => {
    const wrapper = mount(SearchBar)
    const input = wrapper.get('input')

    expect(input.attributes('type')).toBe('search')
    expect(wrapper.get('label').attributes('for')).toBe(input.attributes('id'))
    expect(wrapper.get('label').text()).toBe('Buscar merge requests')
  })

  it('muestra el valor recibido', () => {
    const wrapper = mount(SearchBar, { props: { modelValue: 'approvals' } })

    expect(wrapper.get('input').element.value).toBe('approvals')
  })

  it('emite el texto escrito para el v-model', async () => {
    const wrapper = mount(SearchBar, { props: { modelValue: '' } })

    await wrapper.get('input').setValue('filtro')

    expect(wrapper.emitted('update:modelValue')).toEqual([['filtro']])
  })

  it('arranca vacío cuando no recibe valor', () => {
    const wrapper = mount(SearchBar)

    expect(wrapper.get('input').element.value).toBe('')
  })
})
