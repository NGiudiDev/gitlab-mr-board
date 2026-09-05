import { describe, expect, it } from 'vitest'

import { buildMergeRequest } from '../../../test/fixtures/mergeRequests.js'
import {
  findPersonByUsername,
  mergeRequestsForPerson,
  peopleFromMergeRequests,
  responsiblePeopleOf,
} from './responsibility.js'

describe('findPersonByUsername', () => {
  it('encuentra la identidad sin distinguir mayúsculas ni espacios', () => {
    const people = [{ name: 'Ana Pérez', username: 'Ana' }]

    expect(findPersonByUsername(people, ' ANA ')).toEqual(people[0])
  })

  it('devuelve null cuando no hay una identidad seleccionada', () => {
    expect(findPersonByUsername([], null)).toBeNull()
  })
})

describe('responsiblePeopleOf', () => {
  it.each(['in_progress', 'mr_warning', 'qa', 'ready_to_merge'])(
    'asigna el autor en %s',
    (mergeability) => {
      const mr = buildMergeRequest({ mergeability, authorUsername: 'ana' })

      expect(responsiblePeopleOf(mr)).toEqual([{ name: 'Ana Pérez', username: 'ana' }])
    },
  )

  it('mantiene sólo los reviewers que todavía no aprobaron', () => {
    const mr = buildMergeRequest({
      mergeability: 'review',
      reviewers: [
        { name: 'Beto Ruiz', username: 'beto', avatar: null },
        { name: 'Caro Díaz', username: 'caro', avatar: null },
      ],
      blockers: { approvals: { status: 'pending', approvers: ['BETO'] } },
    })

    expect(responsiblePeopleOf(mr)).toEqual([
      { name: 'Caro Díaz', username: 'caro' },
    ])
  })

  it('devuelve la responsabilidad al autor cuando todos los reviewers aprobaron', () => {
    const mr = buildMergeRequest({
      mergeability: 'review',
      reviewers: [{ name: 'Beto Ruiz', username: 'beto', avatar: null }],
      blockers: { approvals: { status: 'pending', approvers: ['beto'] } },
    })

    expect(responsiblePeopleOf(mr)).toEqual([{ name: 'Ana Pérez', username: 'ana' }])
  })

  it.each(['backlog', 'unknown'])('no asigna responsables en %s', (mergeability) => {
    expect(responsiblePeopleOf(buildMergeRequest({ mergeability }))).toEqual([])
  })

  it('no asigna responsable a una revisión sin reviewers', () => {
    expect(responsiblePeopleOf(buildMergeRequest({ mergeability: 'review' }))).toEqual([])
  })

  it('no interpreta aprobaciones desconocidas como aprobaciones realizadas', () => {
    const mr = buildMergeRequest({
      mergeability: 'review',
      reviewers: [{ name: 'Beto Ruiz', username: 'beto', avatar: null }],
      blockers: { approvals: { status: 'unknown', required: 0, given: 0 } },
    })

    expect(responsiblePeopleOf(mr)).toEqual([
      { name: 'Beto Ruiz', username: 'beto' },
    ])
  })
})

describe('peopleFromMergeRequests', () => {
  it('reúne y ordena autores y reviewers sin duplicar usernames', () => {
    const people = peopleFromMergeRequests([
      buildMergeRequest({
        author: 'Ana Pérez',
        authorUsername: 'Ana',
        reviewers: [{ name: 'Beto Ruiz', username: 'beto', avatar: null }],
      }),
      buildMergeRequest({
        author: 'Beto Ruiz',
        authorUsername: 'BETO',
        reviewers: [{ name: 'Otra Ana', username: 'ana', avatar: null }],
      }),
    ])

    expect(people).toEqual([
      { name: 'Ana Pérez', username: 'Ana' },
      { name: 'Beto Ruiz', username: 'beto' },
    ])
  })

  it('conserva personas distintas que comparten el nombre visible', () => {
    const people = peopleFromMergeRequests([
      buildMergeRequest({ author: 'Alex', authorUsername: 'alex-uno' }),
      buildMergeRequest({ author: 'Alex', authorUsername: 'alex-dos' }),
    ])

    expect(people.map((person) => person.username)).toEqual(['alex-dos', 'alex-uno'])
  })
})

describe('mergeRequestsForPerson', () => {
  it('filtra por username responsable sin duplicar el MR', () => {
    const authored = buildMergeRequest({ id: '101-1', authorUsername: 'ana' })
    const review = buildMergeRequest({
      id: '101-2',
      mergeability: 'review',
      reviewers: [{ name: 'Ana Pérez', username: 'ANA', avatar: null }],
      blockers: { approvals: { status: 'pending', approvers: [] } },
    })
    const unrelated = buildMergeRequest({ id: '101-3', authorUsername: 'otra' })

    expect(mergeRequestsForPerson([authored, review, unrelated], 'ana'))
      .toEqual([authored, review])
  })
})
