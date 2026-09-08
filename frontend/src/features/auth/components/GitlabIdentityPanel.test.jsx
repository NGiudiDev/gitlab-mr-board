// 2. Dependencias externas.
import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

// 6. Imports relativos restantes.
import { TEST_USER } from '../../../../test/sharedState.js'
import GitlabIdentityPanel from './GitlabIdentityPanel.jsx'

function renderPanel(props = {}) {
  return render(<GitlabIdentityPanel user={TEST_USER} {...props} />)
}

/** Envía el formulario y espera la respuesta simulada del backend. */
async function submit() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Guardar mi nickname|Guardando/ }))
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('GitlabIdentityPanel', () => {
  it('no renderiza nada sin sesión', () => {
    const { container } = render(<GitlabIdentityPanel />)

    expect(container.textContent).toBe('')
  })

  it('completa el nickname que ya tiene la persona', () => {
    renderPanel()

    expect(screen.getByLabelText('Nickname de GitLab').value).toBe('ana-gitlab')
  })

  it('explica para qué sirve el nickname', () => {
    const { container } = renderPanel()

    expect(container.textContent).toContain('reconoce cuáles de los merge requests del equipo son tuyos')
  })

  it('arranca vacío y exige el campo cuando todavía no lo cargó', () => {
    renderPanel({ user: { ...TEST_USER, gitlabUsername: null } })

    const field = screen.getByLabelText('Nickname de GitLab')
    expect(field.value).toBe('')
    expect(field.required).toBe(true)
  })

  it('envía el nickname sin espacios alrededor', async () => {
    const onSave = vi.fn(async () => null)
    renderPanel({ onSave })

    fireEvent.change(screen.getByLabelText('Nickname de GitLab'), { target: { value: '  otro-nick  ' } })
    await submit()

    expect(onSave).toHaveBeenCalledWith('otro-nick')
  })

  it('confirma que quedó guardado', async () => {
    renderPanel({ onSave: async () => null })

    await submit()

    expect(screen.getByRole('status').textContent).toBe('Nickname de GitLab guardado.')
  })

  it('muestra el error que devuelve el backend', async () => {
    renderPanel({ onSave: async () => '«-ana» no es un nickname de GitLab.' })

    await submit()

    expect(screen.getByRole('alert').textContent).toBe('«-ana» no es un nickname de GitLab.')
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('bloquea el botón mientras se guarda', () => {
    renderPanel({ submitting: true })

    const button = screen.getByRole('button', { name: 'Guardando...' })
    expect(button.disabled).toBe(true)
  })
})
