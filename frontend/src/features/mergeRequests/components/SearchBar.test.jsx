import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchBar from './SearchBar.jsx'

function renderSearchBar(props = {}) {
  return render(<SearchBar onChange={() => {}} {...props} />)
}

describe('SearchBar', () => {
  it('asocia una etiqueta accesible al campo de búsqueda', () => {
    const { container } = renderSearchBar()
    const input = screen.getByLabelText('Buscar merge requests')

    expect(input.getAttribute('type')).toBe('search')
    expect(container.querySelector('label').getAttribute('for')).toBe(input.getAttribute('id'))
  })

  it('muestra el valor recibido', () => {
    renderSearchBar({ value: 'approvals' })

    expect(screen.getByLabelText('Buscar merge requests').value).toBe('approvals')
  })

  it('informa el texto escrito al componente padre', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderSearchBar({ value: '', onChange })

    await user.type(screen.getByLabelText('Buscar merge requests'), 'f')

    expect(onChange).toHaveBeenCalledWith('f')
  })

  it('arranca vacío cuando no recibe valor', () => {
    renderSearchBar()

    expect(screen.getByLabelText('Buscar merge requests').value).toBe('')
  })
})
