import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { buildMergeRequest } from '../../../../test/fixtures/mergeRequests.js'
import BoardColumn from './BoardColumn.jsx'

function renderColumn(props = {}) {
  return render(
    <BoardColumn title="Code Review" idPrefix="equipo-tablero" mergeRequests={[]} {...props} />,
  )
}

describe('BoardColumn', () => {
  it('usa el título como nombre accesible de la columna', () => {
    const { container } = renderColumn({ title: 'Listas para mergear' })
    const heading = container.querySelector('h3')

    expect(heading.textContent).toBe('Listas para mergear')
    expect(container.querySelector('section').getAttribute('aria-labelledby')).toBe(heading.getAttribute('id'))
  })

  it('genera identificadores distintos por proyecto', () => {
    const primero = renderColumn({ idPrefix: 'equipo-tablero' }).container.querySelector('h3').id
    const segundo = renderColumn({ idPrefix: 'equipo-api' }).container.querySelector('h3').id

    expect(primero).not.toBe(segundo)
  })

  it('renderiza una tarjeta por merge request', () => {
    const { container } = renderColumn({
      mergeRequests: [
        buildMergeRequest({ id: '101-1', title: 'Primero' }),
        buildMergeRequest({ id: '101-2', title: 'Segundo' }),
      ],
    })

    expect(container.querySelectorAll('article')).toHaveLength(2)
    expect(container.querySelectorAll('li')).toHaveLength(2)
    expect(container.textContent).toContain('Primero')
    expect(container.textContent).toContain('Segundo')
  })

  it('acompaña el contador con un texto accesible', () => {
    const { container } = renderColumn({
      mergeRequests: [buildMergeRequest({ id: '101-1' }), buildMergeRequest({ id: '101-2' })],
    })

    expect(container.querySelector('.sr-only').textContent).toBe('2 merge requests')
  })

  it('muestra la columna vacía sin tarjetas', () => {
    const { container } = renderColumn({ mergeRequests: [] })

    expect(container.querySelectorAll('article')).toHaveLength(0)
    expect(container.querySelector('.sr-only').textContent).toBe('0 merge requests')
  })

  it('expone la lista de tarjetas con rol de lista', () => {
    const { container } = renderColumn({ mergeRequests: [buildMergeRequest()] })

    expect(container.querySelector('ul').getAttribute('role')).toBe('list')
  })

})
