import { describe, expect, it } from 'vitest'
import { DEFAULT_API_BASE_URL, parseApiBaseUrl } from './config.js'

describe('parseApiBaseUrl', () => {
  it('usa localhost:3001 cuando no se configura un valor', () => {
    expect(parseApiBaseUrl()).toBe(DEFAULT_API_BASE_URL)
    expect(parseApiBaseUrl('')).toBe(DEFAULT_API_BASE_URL)
  })

  it('normaliza espacios y barras finales', () => {
    expect(parseApiBaseUrl(' https://api.example.com/base/ ')).toBe('https://api.example.com/base')
  })

  it('rechaza una URL inválida', () => {
    expect(() => parseApiBaseUrl('backend-local')).toThrow('VITE_API_BASE_URL debe ser una URL válida.')
  })

  it('rechaza protocolos distintos de HTTP y HTTPS', () => {
    expect(() => parseApiBaseUrl('ftp://api.example.com')).toThrow(
      'VITE_API_BASE_URL debe usar el protocolo http o https.',
    )
  })
})
