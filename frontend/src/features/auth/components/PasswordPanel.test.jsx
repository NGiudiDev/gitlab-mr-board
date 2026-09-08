// 2. Dependencias externas.
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

// 6. Imports relativos restantes.
import { TEST_USER } from '../../../../test/sharedState.js'
import PasswordPanel from './PasswordPanel.jsx'

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

describe('PasswordPanel', () => {
  it('no muestra nada sin usuario', () => {
    const { container } = render(<PasswordPanel />)

    expect(container.innerHTML).toBe('')
  })

  it('ofrece el cambio de contraseña a cualquier usuario', () => {
    render(<PasswordPanel user={TEST_USER} />)

    expect(screen.getByRole('heading', { level: 2, name: 'Mi contraseña' })).toBeDefined()
  })

  it('avisa que el cambio cierra las sesiones abiertas', () => {
    const { container } = render(<PasswordPanel user={TEST_USER} />)

    expect(container.textContent).toContain('se cierran todas tus sesiones')
  })

  it('deja la administración de usuarios fuera de la pantalla de cuenta', () => {
    render(<PasswordPanel user={{ ...TEST_USER, role: 'admin' }} />)

    expect(screen.queryByRole('heading', { name: 'Usuarios' })).toBeNull()
  })

  it('envía la contraseña actual y la nueva', async () => {
    const onChangePassword = vi.fn(async () => null)
    render(<PasswordPanel user={TEST_USER} onChangePassword={onChangePassword} />)

    await submitPasswordChange()

    expect(onChangePassword).toHaveBeenCalledWith({
      currentPassword: 'contrasena-de-prueba',
      newPassword: 'contrasena-nueva',
    })
  })

  it('avisa y no envía cuando la confirmación no coincide', async () => {
    const onChangePassword = vi.fn(async () => null)
    render(<PasswordPanel user={TEST_USER} onChangePassword={onChangePassword} />)

    await submitPasswordChange({ confirmation: 'otra-contrasena' })

    expect(screen.getByRole('alert').textContent).toBe('Las contraseñas no coinciden.')
    expect(onChangePassword).not.toHaveBeenCalled()
  })

  it('muestra el error que devuelve el backend', async () => {
    const onChangePassword = vi.fn(async () => 'La contraseña actual no coincide.')
    render(<PasswordPanel user={TEST_USER} onChangePassword={onChangePassword} />)

    await submitPasswordChange()

    expect(screen.getByRole('alert').textContent).toBe('La contraseña actual no coincide.')
  })

  it('bloquea el botón mientras se guarda', () => {
    render(<PasswordPanel user={TEST_USER} submitting />)

    const button = screen.getByRole('button', { name: 'Guardando...' })
    expect(button.disabled).toBe(true)
  })
})
