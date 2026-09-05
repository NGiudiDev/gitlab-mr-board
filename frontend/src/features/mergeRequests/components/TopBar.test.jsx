import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import TopBar from './TopBar.jsx'

function renderTopBar(props = {}) {
  return render(<TopBar onRefresh={() => {}} {...props} />)
}

/** Región de estado de la barra superior. */
function status() {
  return screen.getByRole('status')
}

describe('TopBar', () => {
  it('muestra el título del tablero como encabezado principal', () => {
    renderTopBar()

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Tablero de MRs')
  })

  it('resume los proyectos y merge requests cuando hay metadatos', () => {
    const { container } = renderTopBar({ meta: { projectCount: 2, totalMRs: 5 } })

    expect(container.textContent).toContain('2 proyectos')
    expect(container.textContent).toContain('5 MRs abiertas')
  })

  it('indica que está cargando mientras no hay metadatos', () => {
    const { container } = renderTopBar()

    expect(container.textContent).toContain('Cargando...')
  })

  it('anuncia el estado de actualización en una región de estado', () => {
    renderTopBar({ loading: true })

    expect(status().textContent).toContain('Actualizando...')
  })

  it('anuncia el error con texto y no sólo con color', () => {
    renderTopBar({ error: 'No se pudo conectar al backend.' })

    expect(status().textContent).toContain('Error')
  })

  it('muestra la hora de la última actualización', () => {
    renderTopBar({ lastFetched: new Date('2026-08-28T15:30:00.000Z') })

    expect(status().textContent).toMatch(/\d{2}:\d{2}/)
  })

  it('informa que no hay datos todavía', () => {
    renderTopBar()

    expect(status().textContent).toContain('Sin datos')
  })

  it('avisa al padre al usar el botón de actualización manual', async () => {
    const user = userEvent.setup()
    const onRefresh = vi.fn()
    renderTopBar({ onRefresh })

    await user.click(screen.getByRole('button', { name: 'Refrescar ahora' }))

    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('deshabilita el botón mientras carga', () => {
    renderTopBar({ loading: true })

    expect(screen.getByRole('button', { name: 'Refrescar ahora' }).disabled).toBe(true)
  })

  it('no avisa al padre con el botón deshabilitado', async () => {
    const user = userEvent.setup()
    const onRefresh = vi.fn()
    renderTopBar({ loading: true, onRefresh })

    await user.click(screen.getByRole('button', { name: 'Refrescar ahora' }))

    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('oculta el indicador decorativo a las tecnologías de asistencia', () => {
    renderTopBar({ loading: true })

    expect(status().querySelector('[aria-hidden="true"]')).not.toBeNull()
  })
})
