// 2. Dependencias externas.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

// 7. Imports relativos restantes.
import { TEST_USER } from '../../test/sharedState.js'
import AppShell, { sectionsFor } from './AppShell.jsx'

const ADMIN_USER = { ...TEST_USER, role: 'admin' }

function renderShell(props = {}) {
  return render(<AppShell {...props}><p>Contenido de la sección</p></AppShell>)
}

/** Etiquetas de la barra de navegación, en el orden en que aparecen. */
function navLabels() {
  return screen.getAllByRole('button')
    .filter((button) => button.closest('nav'))
    .map((button) => button.textContent)
}

describe('AppShell', () => {
  it('presenta el contenido dentro de un único main accesible', () => {
    const { container } = renderShell({ user: TEST_USER })

    const main = container.querySelector('main')
    expect(container.querySelectorAll('main')).toHaveLength(1)
    expect(main.id).toBe('contenido-principal')
    expect(main.textContent).toContain('Contenido de la sección')
  })

  it('ofrece el enlace para saltar al contenido principal', () => {
    const { container } = renderShell({ user: TEST_USER })

    expect(container.querySelector('a[href="#contenido-principal"]').textContent)
      .toContain('Saltar al contenido principal')
  })

  it('usa el nombre del tablero como encabezado principal', () => {
    renderShell({ user: TEST_USER })

    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Tablero de MRs')
  })

  it('esconde la barra sin sesión, para que el ingreso ocupe la pantalla', () => {
    renderShell()

    expect(screen.queryByRole('navigation')).toBeNull()
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).toBeNull()
  })
})

describe('AppShell: navegación', () => {
  it('ofrece el tablero y la cuenta a cualquier usuario', () => {
    renderShell({ user: TEST_USER })

    expect(navLabels()).toEqual(['Tablero', 'Mi cuenta'])
  })

  it('agrega la sección de usuarios a un admin', () => {
    renderShell({ user: ADMIN_USER })

    expect(navLabels()).toEqual(['Tablero', 'Mi cuenta', 'Usuarios'])
  })

  it('marca la sección activa sin depender del color', () => {
    renderShell({ user: TEST_USER, view: 'account' })

    expect(screen.getByRole('button', { name: 'Mi cuenta' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('button', { name: 'Tablero' }).getAttribute('aria-current')).toBeNull()
  })

  it('avisa al padre la sección elegida', async () => {
    const onChangeView = vi.fn()
    renderShell({ user: ADMIN_USER, onChangeView })

    await userEvent.click(screen.getByRole('button', { name: 'Usuarios' }))

    expect(onChangeView).toHaveBeenCalledWith('users')
  })

  it('vuelve al tablero desde la cuenta', async () => {
    const onChangeView = vi.fn()
    renderShell({ user: TEST_USER, view: 'account', onChangeView })

    await userEvent.click(screen.getByRole('button', { name: 'Tablero' }))

    expect(onChangeView).toHaveBeenCalledWith('board')
  })

  it('avisa al padre al cerrar la sesión', async () => {
    const onLogout = vi.fn()
    renderShell({ user: TEST_USER, onLogout })

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(onLogout).toHaveBeenCalledTimes(1)
  })
})

describe('sectionsFor', () => {
  it('deja la administración de usuarios sólo para el rol admin', () => {
    expect(sectionsFor(TEST_USER).map((section) => section.id)).toEqual(['board', 'account'])
    expect(sectionsFor(ADMIN_USER).map((section) => section.id)).toEqual(['board', 'account', 'users'])
  })

  it('sin usuario no ofrece ninguna sección de administración', () => {
    expect(sectionsFor(null).some((section) => section.id === 'users')).toBe(false)
  })
})
