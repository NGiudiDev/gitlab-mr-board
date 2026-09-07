// 2. Dependencias externas.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

// 7. Imports relativos restantes.
import { TEST_USER } from '../../../../test/sharedState.js'
import SessionBar from './SessionBar.jsx'

describe('SessionBar', () => {
  it('muestra el nombre y el usuario de la sesión', () => {
    const { container } = render(<SessionBar user={TEST_USER} />)

    expect(container.textContent).toContain('Ana Pérez')
    expect(container.textContent).toContain('@ana')
  })

  it('avisa al padre al cerrar sesión', async () => {
    const onLogout = vi.fn()
    render(<SessionBar user={TEST_USER} onLogout={onLogout} />)

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it('no muestra nada sin usuario', () => {
    const { container } = render(<SessionBar />)

    expect(container.innerHTML).toBe('')
  })
})
