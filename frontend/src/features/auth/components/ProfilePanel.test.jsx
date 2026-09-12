// 2. Dependencias externas.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

// 6. Imports relativos restantes.
import { TEST_USER } from '../../../../test/sharedState.js'
import ProfilePanel from './ProfilePanel.jsx'

describe('ProfilePanel', () => {
  it('presenta los datos actuales en una pantalla de edición', () => {
    render(<ProfilePanel user={TEST_USER} />)

    expect(screen.getByRole('heading', { level: 2, name: 'Mi perfil' })).toBeDefined()
    expect(screen.getByLabelText('Nombre visible').value).toBe('Ana Pérez')
    expect(screen.getByLabelText('Email').value).toBe('ana@example.com')
  })

  it('guarda el nombre visible y el email editados', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn(async () => null)
    render(<ProfilePanel user={TEST_USER} onSave={onSave} />)

    await user.clear(screen.getByLabelText('Nombre visible'))
    await user.type(screen.getByLabelText('Nombre visible'), 'Ana García')
    await user.clear(screen.getByLabelText('Email'))
    await user.type(screen.getByLabelText('Email'), 'anita@example.com')
    await user.click(screen.getByRole('button', { name: 'Guardar perfil' }))

    expect(onSave).toHaveBeenCalledWith({ displayName: 'Ana García', email: 'anita@example.com' })
    expect(screen.getByRole('status').textContent).toBe('Perfil actualizado.')
  })

  it('muestra el error sin descartar lo escrito', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn(async () => 'Ya existe un usuario con ese email.')
    render(<ProfilePanel user={TEST_USER} onSave={onSave} />)

    await user.clear(screen.getByLabelText('Email'))
    await user.type(screen.getByLabelText('Email'), 'ocupado@example.com')
    await user.click(screen.getByRole('button', { name: 'Guardar perfil' }))

    expect(screen.getByRole('alert').textContent).toBe('Ya existe un usuario con ese email.')
    expect(screen.getByLabelText('Email').value).toBe('ocupado@example.com')
  })

  it('deshabilita el formulario durante el guardado', () => {
    render(<ProfilePanel user={TEST_USER} submitting />)

    expect(screen.getByLabelText('Nombre visible').disabled).toBe(true)
    expect(screen.getByLabelText('Email').disabled).toBe(true)
    expect(screen.getByRole('button', { name: 'Guardando…' }).disabled).toBe(true)
  })
})
