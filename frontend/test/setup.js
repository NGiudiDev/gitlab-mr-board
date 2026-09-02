import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// El proyecto no usa globals de Vitest, así que la limpieza automática de
// Testing Library no se registra sola.
afterEach(cleanup)
