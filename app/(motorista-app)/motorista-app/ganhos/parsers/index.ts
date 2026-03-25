/**
 * Ponto de entrada dos parsers de CSV por plataforma.
 * Cada parser é implementado nas Etapas 2, 3 e 4.
 */
import type { PlataformaImport, RegistroImportado } from '../importar-extrato-modal'

export async function parsearCSV(
  arquivo: File,
  plataforma: PlataformaImport,
): Promise<RegistroImportado[]> {
  // Etapas 2-4 implementarão os parsers reais.
  // Por enquanto lança erro amigável para qualquer arquivo.
  throw new Error(
    `Parser da ${plataforma === 'uber' ? 'Uber' : plataforma === '99' ? '99' : 'iFood'} ainda não implementado. Aguarde as próximas etapas.`,
  )
}
