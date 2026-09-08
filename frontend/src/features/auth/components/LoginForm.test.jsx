// 2. Dependencias externas.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

// 6. Imports relativos restantes.
import LoginForm from './LoginForm.jsx'

function renderLoginForm(props = {}) {
  return render(<LoginForm {...props} />)
}

function usernameField() {
  return screen.getByLabelText('Usuario')
}

function passwordField() {
  return screen.getByLabelText('Contraseña')
}

function submitButton() {
  return screen.getByRole('button', { name: /Ingresar|Ingresando/ })
}

describe('LoginForm', () => {
  it('presenta el formulario con sus campos accesibles por etiqueta', () => {
    renderLoginForm()

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Tablero de MRs')
    expect(usernameField()).toBeDefined()
    expect(passwordField()).toBeDefined()
  })

  it('oculta la contraseña mientras se escribe', () => {
    renderLoginForm()

    expect(passwordField().getAttribute('type')).toBe('password')
  })

  it('ayuda al gestor de contraseñas con los autocomplete correctos', () => {
    renderLoginForm()

    expect(usernameField().getAttribute('autocomplete')).toBe('username')
    expect(passwordField().getAttribute('autocomplete')).toBe('current-password')
  })

  it('envía las credenciales al confirmar', async () => {
    const onSubmit = vi.fn()
    renderLoginForm({ onSubmit })

    await userEvent.type(usernameField(), 'ana')
    await userEvent.type(passwordField(), 'contrasena-de-prueba')
    await userEvent.click(submitButton())

    expect(onSubmit).toHaveBeenCalledWith({ username: 'ana', password: 'contrasena-de-prueba' })
  })

  it('recorta los espacios sobrantes del usuario', async () => {
    const onSubmit = vi.fn()
    renderLoginForm({ onSubmit })

    await userEvent.type(usernameField(), '  ana  ')
    await userEvent.type(passwordField(), 'contrasena-de-prueba')
    await userEvent.click(submitButton())

    expect(onSubmit).toHaveBeenCalledWith({ username: 'ana', password: 'contrasena-de-prueba' })
  })

  it('anuncia el error como alerta y no sólo con color', () => {
    renderLoginForm({ error: 'Usuario o contraseña incorrectos.' })

    expect(screen.getByRole('alert').textContent).toBe('Usuario o contraseña incorrectos.')
  })

  it('no muestra ninguna alerta cuando no hay error', () => {
    renderLoginForm()

    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('bloquea el botón mientras se está enviando', () => {
    renderLoginForm({ submitting: true })

    expect(submitButton().disabled).toBe(true)
    expect(submitButton().textContent).toBe('Ingresando...')
  })

  it('no falla si se envía sin recibir un manejador', async () => {
    renderLoginForm()

    await userEvent.type(usernameField(), 'ana')
    await userEvent.type(passwordField(), 'contrasena-de-prueba')

    await expect(userEvent.click(submitButton())).resolves.toBeUndefined()
  })
})

describe('LoginForm: avisos y registro', () => {
  it('presenta el aviso como región de estado, no como error', () => {
    renderLoginForm({ notice: 'Contraseña actualizada. Volvé a ingresar con la nueva.' })

    expect(screen.getByRole('status').textContent)
      .toBe('Contraseña actualizada. Volvé a ingresar con la nueva.')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('ofrece crear una cuenta y avisa al padre', async () => {
    const onShowRegister = vi.fn()
    renderLoginForm({ onShowRegister })

    await userEvent.click(screen.getByRole('button', { name: 'Crear una cuenta' }))

    expect(onShowRegister).toHaveBeenCalledTimes(1)
  })
})
