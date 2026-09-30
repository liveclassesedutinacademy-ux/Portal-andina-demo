import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  digitoControlRT,
  MENSAJES_DOCUMENTO,
  normalizarDocumento,
  validarDocumento,
  type TipoDocumento,
} from '../src/validaciones/documento.js';

const aqui = dirname(fileURLToPath(import.meta.url));

describe('DI', () => {
  it.each(['999123', '9991234567'])('acepta %s (CA4)', (numero) => {
    expect(validarDocumento('DI', numero)).toEqual({ valido: true, numero });
  });

  it.each(['99912', '99912345678', '99912A'])('rechaza %s (CA5)', (numero) => {
    expect(validarDocumento('DI', numero)).toEqual({ valido: false, error: MENSAJES_DOCUMENTO.DI });
  });

  it('quita los puntos: 999.124.001 → 999124001 (CA12)', () => {
    expect(validarDocumento('DI', '999.124.001')).toEqual({ valido: true, numero: '999124001' });
  });

  it('solo quita espacios y puntos: rechaza un tabulador', () => {
    expect(validarDocumento('DI', '999\t124001')).toEqual({ valido: false, error: MENSAJES_DOCUMENTO.DI });
  });
});

describe('RT', () => {
  it.each(['999123456-1', '999000013-0', '999000005-0'])('acepta %s (CA6)', (numero) => {
    expect(validarDocumento('RT', numero)).toEqual({ valido: true, numero });
  });

  it.each(['999123456-2', '99912345-6'])('rechaza %s (CA7)', (numero) => {
    expect(validarDocumento('RT', numero)).toEqual({ valido: false, error: MENSAJES_DOCUMENTO.RT });
  });

  it('rechaza el RT sin guion 9991234561 (CA8, P11 b)', () => {
    expect(validarDocumento('RT', '9991234561')).toEqual({ valido: false, error: MENSAJES_DOCUMENTO.RT });
  });

  it('quita los espacios: 999 000 024-4 → 999000024-4 (CA12)', () => {
    expect(validarDocumento('RT', '999 000 024-4')).toEqual({ valido: true, numero: '999000024-4' });
  });

  it('quita los puntos: 999.000.024-4 → 999000024-4 (anexo)', () => {
    expect(validarDocumento('RT', '999.000.024-4')).toEqual({ valido: true, numero: '999000024-4' });
  });

  it('calcula el dígito de control del anexo', () => {
    expect(digitoControlRT('999123456')).toBe(1);
    expect(digitoControlRT('999000013')).toBe(0); // residuo 10
    expect(digitoControlRT('999000005')).toBe(0); // residuo 0
    expect(digitoControlRT('999000024')).toBe(4); // suma 257
  });
});

describe('PA', () => {
  it.each(['999ABC', '999ABCDEF', '999123456'])('acepta %s (CA9)', (numero) => {
    expect(validarDocumento('PA', numero)).toEqual({ valido: true, numero });
  });

  it('pasa a mayúsculas: 999abc → 999ABC (CA11, P11 b)', () => {
    expect(normalizarDocumento('PA', '999abc')).toBe('999ABC');
    expect(validarDocumento('PA', '999abc')).toEqual({ valido: true, numero: '999ABC' });
  });

  it.each([
    ['999 aBc', '999ABC'],
    ['999.abc.def', '999ABCDEF'],
  ])('quita espacios y puntos y pasa a mayúsculas: %s → %s (anexo, P11 b)', (numero, normalizado) => {
    expect(validarDocumento('PA', numero)).toEqual({ valido: true, numero: normalizado });
  });

  it.each(['999AB', '999ABCDEFG', '999ÁBC', '999AB-C'])('rechaza %s (CA10)', (numero) => {
    expect(validarDocumento('PA', numero)).toEqual({ valido: false, error: MENSAJES_DOCUMENTO.PA });
  });

  it('no convierte letras fuera de a–z en letras válidas (999ßab)', () => {
    expect(validarDocumento('PA', '999ßab')).toEqual({ valido: false, error: MENSAJES_DOCUMENTO.PA });
  });
});

describe('datos de test-data/', () => {
  const tenderos = JSON.parse(readFileSync(join(aqui, '..', '..', '..', 'test-data', 'tenderos.json'), 'utf8')) as {
    tipoDocumento: TipoDocumento;
    numeroDocumento: string;
  }[];

  it('incluye el RT 999200355-8', () => {
    expect(tenderos.map((t) => t.numeroDocumento)).toContain('999200355-8');
  });

  it.each(tenderos.map((t) => [t.tipoDocumento, t.numeroDocumento]))('%s %s pasa el validador', (tipo, numero) => {
    expect(validarDocumento(tipo as TipoDocumento, numero)).toEqual({ valido: true, numero });
  });
});
