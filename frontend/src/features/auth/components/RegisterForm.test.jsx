// 2. Dependencias externas.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

// 7. Imports relativos restantes.
import RegisterForm from './RegisterForm.jsx'

const PASSWORD = 'contrasena-de-prueba'

function renderRegisterForm(props = {}) {
  return render(<RegisterForm {...props} />)
}

function submitButton() {
  return screen.getByRole('button', { name: /Crear cuenta|Creando/ })
}

/** Completa el formulario con datos válidos y lo envía. */
async function fillAndSubmit({ password = PASSWORD, confirmation = PASSWORD, displayName = '' } = {}) {
  await userEvent.type(screen.getByLabelText('Usuario'), 'zoe')
  if (displayName) await userEvent.type(screen.getByLabelText('Nombre visible (opcional)'), displayName)
  await userEvent.type(screen.getByLabelText('Contraseña'), password)
  await userEvent.type(screen.getByLabelText('Repetí la contraseña'), confirmation)
  await userEvent.click(submitButton())
}

describe('RegisterForm', () => {
  it('presenta el alta con sus campos accesibles por etiqueta', () => {
    renderRegisterForm()

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Crear una cuenta')
    expect(screen.getByLabelText('Usuario')).toBeDefined()
    expect(screen.getByLabelText('Nombre visible (opcional)')).toBeDefined()
    expect(screen.getByLabelText('Contraseña')).toBeDefined()
    expect(screen.getByLabelText('Repetí la contraseña')).toBeDefined()
  })

  it('explica las reglas del nombre de usuario en el propio campo', () => {
    renderRegisterForm()
    const field = screen.getByLabelText('Usuario')
    const help = document.getElementById(field.getAttribute('aria-describedby'))

    expect(help.textContent).toContain('Entre 3 y 32 caracteres')
  })

  it('pide contraseñas nuevas al gestor de contraseñas', () => {
    renderRegisterForm()

    expect(screen.getByLabelText('Contraseña').getAttribute('autocomplete')).toBe('new-password')
    expect(screen.getByLabelText('Repetí la contraseña').getAttribute('autocomplete')).toBe('new-password')
  })

  it('envía el alta cuando las contraseñas coinciden', async () => {
    const onSubmit = vi.fn()
    renderRegisterForm({ onSubmit })

    await fillAndSubmit({ displayName: 'Zoe Ruiz' })

    expect(onSubmit).toHaveBeenCalledWith({
      username: 'zoe',
      password: PASSWORD,
      displayName: 'Zoe Ruiz',
    })
  })

  it('avisa y no envía cuando las contraseñas no coinciden', async () => {
    const onSubmit = vi.fn()
    renderRegisterForm({ onSubmit })

    await fillAndSubmit({ confirmation: 'otra-contrasena' })

    expect(screen.getByRole('alert').textContent).toBe('Las contraseñas no coinciden.')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('muestra el error que devuelve el backend', () => {
    renderRegisterForm({ error: 'Ya existe un usuario con el nombre «zoe».' })

    expect(screen.getByRole('alert').textContent).toBe('Ya existe un usuario con el nombre «zoe».')
  })

  it('bloquea el botón mientras se está creando la cuenta', () => {
    renderRegisterForm({ submitting: true })

    expect(submitButton().disabled).toBe(true)
    expect(submitButton().textContent).toBe('Creando la cuenta...')
  })

  it('ofrece volver al ingreso', async () => {
    const onShowLogin = vi.fn()
    renderRegisterForm({ onShowLogin })

    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(onShowLogin).toHaveBeenCalledTimes(1)
  })
})
