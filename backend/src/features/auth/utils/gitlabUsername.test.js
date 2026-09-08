// 2. Dependencias externas.
import { describe, expect, it } from 'vitest';

// 6. Imports relativos restantes.
import { MAX_GITLAB_USERNAME_LENGTH, parseGitlabUsername } from './gitlabUsername.js';

describe('parseGitlabUsername', () => {
  it('acepta un nickname válido y le recorta los espacios', () => {
    expect(parseGitlabUsername('  ana-gitlab  ')).toBe('ana-gitlab');
  });

  it('acepta los caracteres que admite GitLab', () => {
    expect(parseGitlabUsername('ana.perez_2-b')).toBe('ana.perez_2-b');
  });

  it('lo exige: de él depende la vista personal', () => {
    expect(() => parseGitlabUsername('')).toThrow(/Indicá tu nickname/);
    expect(() => parseGitlabUsername('   ')).toThrow(/Indicá tu nickname/);
    expect(() => parseGitlabUsername(undefined)).toThrow(/Indicá tu nickname/);
  });

  it('rechaza los caracteres que GitLab no admite', () => {
    expect(() => parseGitlabUsername('ana pérez')).toThrow(/no es un nickname de GitLab/);
    expect(() => parseGitlabUsername('@ana')).toThrow(/no es un nickname de GitLab/);
  });

  it('rechaza un nickname que no empieza con letra o número', () => {
    expect(() => parseGitlabUsername('-ana')).toThrow(/no es un nickname de GitLab/);
    expect(() => parseGitlabUsername('.ana')).toThrow(/no es un nickname de GitLab/);
  });

  it('rechaza un nickname más largo que el máximo', () => {
    const tooLong = 'a'.repeat(MAX_GITLAB_USERNAME_LENGTH + 1);

    expect(() => parseGitlabUsername(tooLong)).toThrow(/no puede superar/);
  });

  it('responde con el código HTTP que corresponde a un dato inválido', () => {
    expect(() => parseGitlabUsername('')).toThrow(expect.objectContaining({ status: 400 }));
  });
});
