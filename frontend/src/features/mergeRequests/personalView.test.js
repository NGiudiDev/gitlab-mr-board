import { describe, expect, it } from 'vitest'
import { buildMergeRequest } from '../../../test/fixtures/mergeRequests.js'
import { findPersonByUsername, mergeRequestsForPerson } from './personalView.js'

describe('findPersonByUsername', () => {
  it('encuentra la identidad publicada por el backend', () => {
    const people = [{ name: 'Ana Pérez', username: 'ana' }]

    expect(findPersonByUsername(people, 'ana')).toEqual(people[0])
  })

  it('devuelve null cuando no hay una identidad seleccionada', () => {
    expect(findPersonByUsername([{ name: 'Ana Pérez', username: 'ana' }], null)).toBeNull()
  })

  it('devuelve null cuando la persona no está en la lista', () => {
    expect(findPersonByUsername([{ name: 'Ana Pérez', username: 'ana' }], 'beto')).toBeNull()
  })
})

describe('mergeRequestsForPerson', () => {
  it('filtra por el responsable que informó el backend, sin duplicar el MR', () => {
    const authored = buildMergeRequest({ id: '101-1', authorUsername: 'ana' })
    const review = buildMergeRequest({
      id: '101-2',
      mergeability: 'review',
      authorUsername: 'beto',
      responsiblePeople: [{ name: 'Ana Pérez', username: 'ana' }],
    })
    const unrelated = buildMergeRequest({ id: '101-3', authorUsername: 'otra' })

    expect(mergeRequestsForPerson([authored, review, unrelated], 'ana'))
      .toEqual([authored, review])
  })

  it('no devuelve tareas sin una persona seleccionada', () => {
    expect(mergeRequestsForPerson([buildMergeRequest()], '')).toEqual([])
  })

  it('deja fuera los merge requests sin responsable', () => {
    const paused = buildMergeRequest({ mergeability: 'backlog', responsiblePeople: [] })

    expect(mergeRequestsForPerson([paused], 'ana')).toEqual([])
  })
})
