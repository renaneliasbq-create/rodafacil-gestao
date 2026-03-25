/**
 * Roteador de parsers por plataforma.
 * Após o parse, chama o servidor para detectar duplicatas.
 */
import type { PlataformaImport, RegistroImportado } from '../importar-extrato-modal'
import { chaveDuplicata } from './utils'
import { verificarDuplicatas } from '../actions-importacao'

export async function parsearCSV(
  arquivo: File,
  plataforma: PlataformaImport,
): Promise<RegistroImportado[]> {
  const conteudo = await arquivo.text()

  // ── Seleciona o parser correto ───────────────────────────────────
  let registrosRaw: Omit<RegistroImportado, 'duplicado'>[]

  if (plataforma === 'uber') {
    const { parsearUber } = await import('./uber')
    registrosRaw = parsearUber(conteudo)
  } else if (plataforma === '99') {
    const { parsear99 } = await import('./noventa-e-nove')
    registrosRaw = parsear99(conteudo)
  } else if (plataforma === 'ifood') {
    const { parsearIfood } = await import('./ifood')
    registrosRaw = parsearIfood(conteudo)
  } else if (plataforma === 'indrive') {
    const { parsearInDrive } = await import('./indrive')
    registrosRaw = parsearInDrive(conteudo)
  } else {
    throw new Error('Plataforma não reconhecida.')
  }

  // ── Verifica duplicatas no servidor ─────────────────────────────
  const chavesExistentes = await verificarDuplicatas(
    registrosRaw.map(r => ({
      data: r.data,
      valor_liquido: r.valor_liquido,
      plataforma: r.plataforma,
    })),
  )
  const setExistentes = new Set(chavesExistentes)

  // ── Monta resultado final com flag de duplicata ──────────────────
  return registrosRaw.map(r => ({
    ...r,
    duplicado: setExistentes.has(
      chaveDuplicata(r.data, r.valor_liquido, r.plataforma),
    ),
  }))
}
