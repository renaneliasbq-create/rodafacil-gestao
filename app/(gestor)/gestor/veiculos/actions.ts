'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getAssinaturaStatus, getLimiteVeiculos } from '@/lib/assinatura'

export type FormState = { error?: string } | null

const veiculoSchema = z.object({
  placa:          z.string().min(7, 'Placa inválida').max(8),
  modelo:         z.string().min(1, 'Modelo obrigatório'),
  marca:          z.string().min(1, 'Marca obrigatória'),
  ano:            z.coerce.number().min(1990).max(new Date().getFullYear() + 1),
  cor:            z.string().optional(),
  chassi:         z.string().optional(),
  km_atual:       z.coerce.number().optional(),
  valor_compra:   z.coerce.number().optional(),
  status:         z.enum(['disponivel', 'alugado', 'manutencao']).default('disponivel'),
  // Campos opcionais de contrato
  motorista_id:   z.string().optional(),
  valor_aluguel:  z.coerce.number().optional(),
  periodicidade:  z.enum(['semanal', 'quinzenal', 'mensal']).optional(),
  data_inicio:    z.string().optional(),
  caucao_valor:   z.coerce.number().optional(),
  caucao_pago:    z.string().optional(),
})

export async function criarVeiculo(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = veiculoSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { motorista_id, valor_aluguel, periodicidade, data_inicio, caucao_valor, caucao_pago, valor_compra, ...veiculoData } = parsed.data
  const vincularMotorista = !!(motorista_id && valor_aluguel && periodicidade && data_inicio)

  const supabase = createClient()

  // Verificar limite de veículos do plano
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const assinatura = await getAssinaturaStatus(user.id)
    const limite = getLimiteVeiculos(assinatura)
    if (limite !== null) {
      const { count } = await supabase
        .from('veiculos')
        .select('id', { count: 'exact', head: true })
      if ((count ?? 0) >= limite) {
        return { error: `Você atingiu o limite de ${limite} veículos do seu plano. Faça upgrade para continuar.` }
      }
    }
  }

  const { data: veiculo, error } = await supabase
    .from('veiculos')
    .insert({
      ...veiculoData,
      placa: veiculoData.placa.toUpperCase(),
      cor: veiculoData.cor || null,
      chassi: veiculoData.chassi || null,
      km_atual: veiculoData.km_atual ?? null,
      valor_compra: valor_compra ?? null,
      status: vincularMotorista ? 'alugado' : veiculoData.status,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'Placa já cadastrada.' }
    return { error: 'Erro ao cadastrar veículo.' }
  }

  if (vincularMotorista && veiculo) {
    const { error: contratoError } = await supabase.from('contratos').insert({
      motorista_id, veiculo_id: veiculo.id,
      valor_aluguel, periodicidade, data_inicio,
      status: 'ativo',
      caucao_valor: caucao_valor ?? null,
      caucao_pago: caucao_pago === 'true',
    })
    if (contratoError) return { error: 'Veículo cadastrado, mas erro ao criar contrato.' }
  }

  redirect('/gestor/veiculos?ok=1')
}

export async function atualizarStatusVeiculo(id: string, status: string) {
  const supabase = createClient()
  await supabase.from('veiculos').update({ status }).eq('id', id)
}

export async function prepararUpload(
  entidade: 'veiculo' | 'motorista',
  refId: string,
  nomeOriginal: string,
): Promise<{ signedUrl: string; token: string; path: string } | { error: string }> {
  const supabase = createClient()
  const nomeSanitizado = nomeOriginal.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9.\-_]/g, '_')
  const path = `${entidade}/${refId}/${Date.now()}-${nomeSanitizado}`
  const { data, error } = await supabase.storage.from('documentos').createSignedUploadUrl(path)
  if (error || !data) return { error: error?.message ?? 'Erro ao gerar URL de upload' }
  return { signedUrl: data.signedUrl, token: data.token, path }
}

export async function salvarDocumento(
  entidade: 'veiculo' | 'motorista',
  refId: string,
  nome: string,
  path: string,
  url: string,
): Promise<FormState> {
  const supabase = createClient()
  // tipo = 'cnh' para motorista, 'crlv' para veículo (default genérico aceito pela constraint)
  const tipoDoc = entidade === 'motorista' ? 'cnh' : 'crlv'
  const row = entidade === 'motorista'
    ? { tipo: tipoDoc, motorista_id: refId, veiculo_id: null, nome, path, url }
    : { tipo: tipoDoc, veiculo_id: refId, motorista_id: null, nome, path, url }
  const { error } = await supabase.from('documentos').insert(row)
  if (error) return { error: `Erro: ${error.message}` }
  revalidatePath(`/gestor/veiculos/${refId}`)
  revalidatePath(`/gestor/motoristas/${refId}`)
  return null
}

export async function deletarDocumento(id: string, storagePath: string): Promise<void> {
  const supabase = createClient()
  if (storagePath) await supabase.storage.from('documentos').remove([storagePath])
  await supabase.from('documentos').delete().eq('id', id)
}

const investimentoSchema = z.object({
  veiculo_id:   z.string().uuid(),
  valor_compra: z.coerce.number().positive('Valor inválido'),
})

export async function salvarInvestimento(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = investimentoSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = createClient()
  const { error } = await supabase
    .from('veiculos')
    .update({ valor_compra: parsed.data.valor_compra })
    .eq('id', parsed.data.veiculo_id)

  if (error) return { error: 'Erro ao salvar investimento.' }
  revalidatePath(`/gestor/veiculos/${parsed.data.veiculo_id}`)
  revalidatePath('/gestor/relatorios')
  return null
}
