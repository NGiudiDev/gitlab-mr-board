// 2. Dependencias externas.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

// 6. Imports relativos restantes.
import RegisterForm from './RegisterForm.jsx'

const PASSWORD = 'contrasena-de-prueba'
const INVITE_CODE = 'ABCD234XYZ'

function renderRegisterForm(props = {}) {
  return render(<RegisterForm {...props} />)
}

function submitButton() {
  return screen.getByRole('button', { name: /Crear cuenta|Creando/ })
}

/** Cambia al camino de crear un equipo nuevo. */
async function chooseNewTeam() {
  await userEvent.click(screen.getByRole('button', { name: 'Crear un equipo' }))
}

/**
 * Completa el formulario con datos válidos y lo envía.
 *
 * Por omisión usa el camino que trae el formulario: sumarse a un equipo con su
 * código de invitación.
 */
async function fillAndSubmit({
  password = PASSWORD,
  confirmation = PASSWORD,
  displayName = '',
  inviteCode = INVITE_CODE,
  accountName = '',
} = {}) {
  if (inviteCode) await userEvent.type(screen.getByLabelText('Código de invitación'), inviteCode)
  if (accountName) await userEvent.type(screen.getByLabelText('Nombre del equipo (opcional)'), accountName)
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
    expect(screen.getByLabelText('Código de invitación')).toBeDefined()
    expect(screen.getByLabelText('Usuario')).toBeDefined()
    expect(screen.getByLabelText('Nombre visible (opcional)')).toBeDefined()
    expect(screen.getByLabelText('Contraseña')).toBeDefined()
    expect(screen.getByLabelText('Repetí la contraseña')).toBeDefined()
  })

  it('arranca ofreciendo sumarse a un equipo, que es el caso frecuente', () => {
    renderRegisterForm()

    expect(screen.getByRole('button', { name: 'Sumarme a un equipo' }).getAttribute('aria-pressed'))
      .toBe('true')
    expect(screen.queryByLabelText('Nombre del equipo (opcional)')).toBeNull()
  })

  it('cambia al nombre del equipo al elegir crear uno', async () => {
    renderRegisterForm()

    await chooseNewTeam()

    expect(screen.getByLabelText('Nombre del equipo (opcional)')).toBeDefined()
    expect(screen.queryByLabelText('Código de invitación')).toBeNull()
  })

  it('explica las reglas del nombre de usuario en el propio campo', () => {
    renderRegisterForm()
    const field = screen.getByLabelText('Usuario')
    const help = document.getElementById(field.getAttribute('aria-describedby'))

    expect(help.textContent).toContain('Entre 3 y 32 caracteres')
  })

  it('explica que sumarse a un equipo no exige credenciales de GitLab', () => {
    renderRegisterForm()
    const field = screen.getByLabelText('Código de invitación')
    const help = document.getElementById(field.getAttribute('aria-describedby'))

    expect(help.textContent).toContain('sin cargar credenciales de GitLab')
  })

  it('pide contraseñas nuevas al gestor de contraseñas', () => {
    renderRegisterForm()

    expect(screen.getByLabelText('Contraseña').getAttribute('autocomplete')).toBe('new-password')
    expect(screen.getByLabelText('Repetí la contraseña').getAttribute('autocomplete')).toBe('new-password')
  })

  it('envía el código de invitación al sumarse a un equipo', async () => {
    const onSubmit = vi.fn()
    renderRegisterForm({ onSubmit })

    await fillAndSubmit({ displayName: 'Zoe Ruiz' })

    expect(onSubmit).toHaveBeenCalledWith({
      username: 'zoe',
      password: PASSWORD,
      displayName: 'Zoe Ruiz',
      inviteCode: INVITE_CODE,
    })
  })

  it('envía el nombre del equipo al crear una cuenta nueva', async () => {
    const onSubmit = vi.fn()
    renderRegisterForm({ onSubmit })

    await chooseNewTeam()
    await fillAndSubmit({ inviteCode: '', accountName: 'Plataforma' })

    expect(onSubmit).toHaveBeenCalledWith({
      username: 'zoe',
      password: PASSWORD,
      displayName: '',
      accountName: 'Plataforma',
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
