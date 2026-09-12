// 2. Dependencias externas.
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// 6. Imports relativos restantes.
import { jsonResponse, resetSharedState, TEST_ACCOUNT, TEST_USER } from '../../test/sharedState.js'
import AccountMenu, { initialsFor } from './AccountMenu.jsx'

const ADMIN_USER = { ...TEST_USER, role: 'admin' }

beforeEach(() => {
  resetSharedState()
  vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ account: TEST_ACCOUNT })))
})

afterEach(() => {
  resetSharedState()
  vi.unstubAllGlobals()
})

describe('AccountMenu', () => {
  it('resume la sesión en un avatar y revela los datos al abrirlo', async () => {
    render(<AccountMenu user={TEST_USER} />)

    const trigger = screen.getByRole('button', { name: 'Abrir menú de cuenta de Ana Pérez' })
    expect(trigger.textContent).toContain('AP')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('region', { name: 'Menú de cuenta' })).toBeNull()

    await userEvent.click(trigger)

    const menu = screen.getByRole('region', { name: 'Menú de cuenta' })
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trigger.getAttribute('aria-label')).toBe('Cerrar menú de cuenta de Ana Pérez')
    expect(menu.textContent).toContain('Ana Pérez')
    expect(menu.textContent).toContain('ana@example.com')
    await waitFor(() => expect(menu.textContent).toContain('Equipo de prueba'))
  })

  it('cierra el menú con Escape y devuelve el foco al avatar', async () => {
    const user = userEvent.setup()
    render(<AccountMenu user={TEST_USER} />)

    const trigger = screen.getByRole('button', { name: 'Abrir menú de cuenta de Ana Pérez' })
    await user.click(trigger)
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Editar perfil' }))

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('region', { name: 'Menú de cuenta' })).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('cierra el menú al interactuar fuera', async () => {
    render(<AccountMenu user={TEST_USER} />)

    await userEvent.click(screen.getByRole('button', { name: 'Abrir menú de cuenta de Ana Pérez' }))
    fireEvent.pointerDown(document.body)

    expect(screen.queryByRole('region', { name: 'Menú de cuenta' })).toBeNull()
  })

  it('avisa al padre al cerrar sesión', async () => {
    const onLogout = vi.fn()
    render(<AccountMenu user={TEST_USER} onLogout={onLogout} />)

    await userEvent.click(screen.getByRole('button', { name: 'Abrir menú de cuenta de Ana Pérez' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it('avisa al layout que debe abrir la pantalla del perfil', async () => {
    const onEditProfile = vi.fn()
    render(<AccountMenu user={TEST_USER} onEditProfile={onEditProfile} />)

    await userEvent.click(screen.getByRole('button', { name: 'Abrir menú de cuenta de Ana Pérez' }))
    await userEvent.click(screen.getByRole('button', { name: 'Editar perfil' }))

    expect(onEditProfile).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('region', { name: 'Menú de cuenta' })).toBeNull()
  })

  it('ofrece editar la cuenta a un admin y avisa al layout', async () => {
    const onEditAccount = vi.fn()
    render(<AccountMenu user={ADMIN_USER} onEditAccount={onEditAccount} />)

    await userEvent.click(screen.getByRole('button', { name: 'Abrir menú de cuenta de Ana Pérez' }))
    await userEvent.click(screen.getByRole('button', { name: 'Editar cuenta' }))

    expect(onEditAccount).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('region', { name: 'Menú de cuenta' })).toBeNull()
  })

  it('ofrece ver la cuenta cuando sus datos son de sólo lectura', async () => {
    render(<AccountMenu user={TEST_USER} />)

    await userEvent.click(screen.getByRole('button', { name: 'Abrir menú de cuenta de Ana Pérez' }))

    expect(screen.getByRole('button', { name: 'Ver cuenta' })).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Editar cuenta' })).toBeNull()
  })

  it('no muestra nada sin usuario', () => {
    const { container } = render(<AccountMenu />)

    expect(container.innerHTML).toBe('')
  })
})

describe('initialsFor', () => {
  it('usa el primer y el último nombre', () => {
    expect(initialsFor({ displayName: 'Ana María Pérez', email: 'ana@example.com' })).toBe('AP')
  })

  it('usa el email cuando falta el nombre visible', () => {
    expect(initialsFor({ email: 'ana@example.com' })).toBe('AN')
  })
})
