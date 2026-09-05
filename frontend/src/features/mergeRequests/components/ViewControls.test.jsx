import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import ViewControls from './ViewControls.jsx'

const PEOPLE = [
  { name: 'Ana Pérez', username: 'ana' },
  { name: 'Beto Ruiz', username: 'beto' },
]

describe('ViewControls', () => {
  it('expone las dos vistas como botones con estado accesible', () => {
    render(<ViewControls viewMode="general" />)

    expect(screen.getByRole('button', { name: 'General' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Personal' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('notifica el cambio a la vista personal', () => {
    const onViewChange = vi.fn()
    render(<ViewControls onViewChange={onViewChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Personal' }))

    expect(onViewChange).toHaveBeenCalledWith('personal')
  })

  it('muestra un selector etiquetado con nombre y username', () => {
    render(<ViewControls viewMode="personal" people={PEOPLE} />)

    const select = screen.getByRole('combobox', { name: 'Persona' })
    expect(select.textContent).toContain('Ana Pérez (@ana)')
    expect(select.textContent).toContain('Beto Ruiz (@beto)')
  })

  it('notifica la persona seleccionada', () => {
    const onPersonChange = vi.fn()
    render(<ViewControls viewMode="personal" people={PEOPLE} onPersonChange={onPersonChange} />)

    fireEvent.change(screen.getByRole('combobox', { name: 'Persona' }), { target: { value: 'beto' } })

    expect(onPersonChange).toHaveBeenCalledWith('beto')
  })

  it('conserva una selección que ya no aparece en los datos actuales', () => {
    render(
      <ViewControls
        viewMode="personal"
        selectedUsername="ana"
        selectedPersonName="Ana Pérez"
      />,
    )

    const select = screen.getByRole('combobox', { name: 'Persona' })
    expect(select.value).toBe('ana')
    expect(select.textContent).toContain('Ana Pérez (sin tareas actuales)')
  })
})
