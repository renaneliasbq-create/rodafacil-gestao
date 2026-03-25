'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { RegistroImportado, PlataformaImport } from './importar-extrato-modal'

/**
 * Recebe a lista de registros parseados e retorna as chaves
 * (data|valorLiquido|plataforma) dos que já existem no banco.
 * Chamada antes de exibir o preview — não grava nada.
 */
export async function verificarDuplicatas(
  registros: Array<{ data: string; valor_liquido: number; plataforma: string }>,
): Promise<string[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || registros.length === 0) return []

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
 * - Cria um registro em motorista_importacoes (lote rastreável)
 * - Insere os ganhos em motorista_ganhos com origem e importacao_id
 * - Retorna o número de registros efetivamente importados
 */
export async function importarRegistros(
  registros: RegistroImportado[],
  plataforma: PlataformaImport,
  arquivoNome: string,
): Promise<number> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sessão expirada. Faça login novamente.')

  const novos = registros.filter(r => !r.duplicado)
  if (novos.length === 0) return 0

  const totalRegistros   = registros.length
  const totalIgnorados   = registros.filter(r => r.duplicado).length
  const valorTotalLiq    = novos.reduce((s, r) => s + r.valor_liquido, 0)
  const origem           = `importacao_${plataforma}` as const

  // 1. Cria o lote de importação
  const { data: lote, error: loteError } = await supabase
    .from('motorista_importacoes')
    .insert({
      motorista_id:          user.id,
      plataforma,
      arquivo_nome:          arquivoNome,
      total_registros:       totalRegistros,
      registros_importados:  novos.length,
      registros_ignorados:   totalIgnorados,
      valor_total_importado: valorTotalLiq,
    })
    .select('id')
    .single()

  if (loteError || !lote) throw new Error('Erro ao registrar lote de importação.')

  // 2. Insere os ganhos em batches de 500 (segurança de payload)
  const BATCH = 500
  let importados = 0

  for (let i = 0; i < novos.length; i += BATCH) {
    const batch = novos.slice(i, i + BATCH)

    const rows = batch.map(r => ({
      motorista_id:       user.id,
      plataforma:         r.plataforma,
      data:               r.data,
      valor_bruto:        r.valor_bruto,
      valor_liquido:      r.valor_liquido,
      horas_trabalhadas:  r.horas_trabalhadas ?? null,
      origem,
      importacao_id:      lote.id,
    }))

    const { error } = await supabase.from('motorista_ganhos').insert(rows)

    if (error) {
      // Se um batch falhar, atualiza o lote com o que foi importado até aqui
      await supabase
        .from('motorista_importacoes')
        .update({ registros_importados: importados })
        .eq('id', lote.id)
      throw new Error(`Erro ao importar registros: ${error.message}`)
    }

    importados += batch.length
  }

  revalidatePath('/motorista-app/ganhos')
  revalidatePath('/motorista-app')

  return importados
}

/**
 * Retorna as últimas 20 importações do motorista logado,
 * ordenadas da mais recente para a mais antiga.
 */
export async function buscarHistoricoImportacoes() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('motorista_importacoes')
    .select('id, plataforma, arquivo_nome, total_registros, registros_importados, registros_ignorados, valor_total_importado, created_at')
    .eq('motorista_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return data ?? []
}

/**
 * Desfaz uma importação:
 * - Apaga todos os ganhos vinculados ao lote (ON DELETE CASCADE cuida disso)
 * - Apaga o registro do lote em motorista_importacoes
 * Só permite desfazer importações do próprio motorista (RLS garante).
 */
export async function desfazerImportacao(importacaoId: string): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sessão expirada. Faça login novamente.')

  // Apaga os ganhos do lote
  const { error: ganhoError } = await supabase
    .from('motorista_ganhos')
    .delete()
    .eq('importacao_id', importacaoId)
    .eq('motorista_id', user.id)

  if (ganhoError) throw new Error(`Erro ao remover ganhos: ${ganhoError.message}`)

  // Apaga o lote
  const { error: loteError } = await supabase
    .from('motorista_importacoes')
    .delete()
    .eq('id', importacaoId)
    .eq('motorista_id', user.id)

  if (loteError) throw new Error(`Erro ao remover importação: ${loteError.message}`)

  revalidatePath('/motorista-app/ganhos')
  revalidatePath('/motorista-app')
}
