'use server'

import { createClient } from '@/lib/supabase/server'
import type { RegistroImportado, PlataformaImport } from './importar-extrato-modal'

/**
 * Recebe a lista de registros parseados e retorna um Set com as
 * chaves (data|valorLiquido|plataforma) dos que já existem no banco.
 * Chamada antes de exibir o preview — não grava nada.
 */
export async function verificarDuplicatas(
  registros: Array<{ data: string; valor_liquido: number; plataforma: string }>,
): Promise<string[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || registros.length === 0) return []

  // Busca apenas nas datas presentes no arquivo (evita full-scan)
  const datas = [...new Set(registros.map(r => r.data))]

  const { data: existentes } = await supabase
    .from('motorista_ganhos')
    .select('data, valor_liquido, plataforma')
    .eq('motorista_id', user.id)
    .in('data', datas)

  return (existentes ?? []).map(
    e => `${e.data}|${Number(e.valor_liquido).toFixed(2)}|${e.plataforma}`,
  )
}

/**
 * Importa os registros novos em lote para o banco.
 * Implementada na Etapa 6.
 */
export async function importarRegistros(
  _registros: RegistroImportado[],
  _plataforma: PlataformaImport,
  _arquivoNome: string,
): Promise<number> {
  throw new Error('Importação ainda não implementada. Aguarde a Etapa 6.')
}
