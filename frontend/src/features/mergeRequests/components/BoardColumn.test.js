import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { buildMergeRequest } from '../../../../test/fixtures/mergeRequests.js'
import BoardColumn from './BoardColumn.vue'
import MrCard from './MrCard.vue'

function mountColumn(props = {}) {
  return mount(BoardColumn, {
    props: {
      title: 'Code Review',
      idPrefix: 'equipo-tablero',
      mergeRequests: [],
      ...props,
    },
  })
}

describe('BoardColumn', () => {
  it('usa el título como nombre accesible de la columna', () => {
    const wrapper = mountColumn({ title: 'Listas para mergear' })
    const heading = wrapper.get('h3')

    expect(heading.text()).toBe('Listas para mergear')
    expect(wrapper.get('section').attributes('aria-labelledby')).toBe(heading.attributes('id'))
  })

  it('genera identificadores distintos por proyecto', () => {
    const primero = mountColumn({ idPrefix: 'equipo-tablero' }).get('h3').attributes('id')
    const segundo = mountColumn({ idPrefix: 'equipo-api' }).get('h3').attributes('id')

    expect(primero).not.toBe(segundo)
  })

  it('renderiza una tarjeta por merge request', () => {
    const wrapper = mountColumn({
      mergeRequests: [
        buildMergeRequest({ id: '101-1', title: 'Primero' }),
        buildMergeRequest({ id: '101-2', title: 'Segundo' }),
      ],
    })

    expect(wrapper.findAllComponents(MrCard)).toHaveLength(2)
    expect(wrapper.findAll('li')).toHaveLength(2)
    expect(wrapper.text()).toContain('Primero')
    expect(wrapper.text()).toContain('Segundo')
  })

  it('acompaña el contador con un texto accesible', () => {
    const wrapper = mountColumn({
      mergeRequests: [buildMergeRequest({ id: '101-1' }), buildMergeRequest({ id: '101-2' })],
    })

    expect(wrapper.get('.sr-only').text()).toBe('2 merge requests')
  })

  it('muestra la columna vacía sin tarjetas', () => {
    const wrapper = mountColumn({ mergeRequests: [] })

    expect(wrapper.findAllComponents(MrCard)).toHaveLength(0)
    expect(wrapper.get('.sr-only').text()).toBe('0 merge requests')
  })

  it('expone la lista de tarjetas con rol de lista', () => {
    const wrapper = mountColumn({ mergeRequests: [buildMergeRequest()] })

    expect(wrapper.get('ul').attributes('role')).toBe('list')
  })
})
