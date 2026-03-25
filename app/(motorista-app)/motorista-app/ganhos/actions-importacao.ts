'use server'

/**
 * Server action de importação em lote.
 * Implementada na Etapa 6.
 */
import type { RegistroImportado, PlataformaImport } from './importar-extrato-modal'

export async function importarRegistros(
  _registros: RegistroImportado[],
  _plataforma: PlataformaImport,
  _arquivoNome: string,
): Promise<number> {
  throw new Error('Importação ainda não implementada. Aguarde a Etapa 6.')
}
