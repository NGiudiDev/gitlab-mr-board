// 2. Dependencias externas.
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// 7. Imports relativos restantes.
import { jsonResponse, TEST_USER } from '../../../../test/sharedState.js'
import AccountPanel from './AccountPanel.jsx'

const ADMIN_USER = { ...TEST_USER, role: 'admin' }

/** Deja que se resuelvan las promesas pendientes y React vuelva a renderizar. */
async function flush() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  })
}

/** Completa el cambio de contraseña propio y lo envía. */
async function submitPasswordChange({ confirmation = 'contrasena-nueva' } = {}) {
  await userEvent.type(screen.getByLabelText('Contraseña actual'), 'contrasena-de-prueba')
  await userEvent.type(screen.getByLabelText('Contraseña nueva'), 'contrasena-nueva')
  await userEvent.type(screen.getByLabelText('Repetí la contraseña nueva'), confirmation)
  await userEvent.click(screen.getByRole('button', { name: /Cambiar contraseña|Guardando/ }))
  await flush()
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ users: [] })))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('AccountPanel', () => {
  it('no muestra nada sin usuario', () => {
    const { container } = render(<AccountPanel />)

    expect(container.innerHTML).toBe('')
  })

  it('ofrece el cambio de contraseña a cualquier usuario', () => {
    render(<AccountPanel user={TEST_USER} />)

    expect(screen.getByRole('heading', { level: 2, name: 'Mi contraseña' })).toBeDefined()
  })

  it('avisa que el cambio cierra las sesiones abiertas', () => {
    const { container } = render(<AccountPanel user={TEST_USER} />)

    expect(container.textContent).toContain('se cierran todas tus sesiones')
  })

  it('esconde la administración de usuarios a quien no es admin', () => {
    render(<AccountPanel user={TEST_USER} />)

    expect(screen.queryByRole('heading', { level: 2, name: 'Usuarios' })).toBeNull()
  })

  it('muestra la administración de usuarios a un admin', async () => {
    render(<AccountPanel user={ADMIN_USER} />)
    await flush()

    expect(screen.getByRole('heading', { level: 2, name: 'Usuarios' })).toBeDefined()
  })

  it('envía la contraseña actual y la nueva', async () => {
    const onChangePassword = vi.fn(async () => null)
    render(<AccountPanel user={TEST_USER} onChangePassword={onChangePassword} />)

    await submitPasswordChange()

    expect(onChangePassword).toHaveBeenCalledWith({
      currentPassword: 'contrasena-de-prueba',
      newPassword: 'contrasena-nueva',
    })
  })

  it('avisa y no envía cuando la confirmación no coincide', async () => {
    const onChangePassword = vi.fn(async () => null)
    render(<AccountPanel user={TEST_USER} onChangePassword={onChangePassword} />)

    await submitPasswordChange({ confirmation: 'otra-contrasena' })

    expect(screen.getByRole('alert').textContent).toBe('Las contraseñas no coinciden.')
    expect(onChangePassword).not.toHaveBeenCalled()
  })

  it('muestra el error que devuelve el backend', async () => {
    const onChangePassword = vi.fn(async () => 'La contraseña actual no coincide.')
    render(<AccountPanel user={TEST_USER} onChangePassword={onChangePassword} />)

    await submitPasswordChange()

    expect(screen.getByRole('alert').textContent).toBe('La contraseña actual no coincide.')
  })

  it('bloquea el botón mientras se guarda', () => {
    render(<AccountPanel user={TEST_USER} submitting />)

    const button = screen.getByRole('button', { name: 'Guardando...' })
    expect(button.disabled).toBe(true)
  })
})
