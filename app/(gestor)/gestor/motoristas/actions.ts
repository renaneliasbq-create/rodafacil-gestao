'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export type FormState = { error?: string } | null

// ── Criar pagamento (recebível) ───────────────────────────────
const pagamentoSchema = z.object({
  motorista_id:    z.string().uuid(),
  contrato_id:     z.string().uuid(),
  valor:           z.coerce.number().positive('Valor inválido'),
  data_vencimento: z.string().min(1, 'Data obrigatória'),
  referencia:      z.string().optional(),
  status:          z.enum(['pendente', 'pago']).default('pendente'),
  data_pagamento:  z.string().optional(),
  bonus:           z.string().optional(), // 'true' quando semana de bônus combustível
  bonus_natal:     z.string().optional(), // 'true' quando bônus de natal
  veiculo_id:      z.string().optional(), // necessário para registrar despesa do bônus
})

export async function criarPagamentoMotorista(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = pagamentoSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { bonus, bonus_natal, veiculo_id, ...pagamentoData } = parsed.data
  const supabase = createClient()
  const { error } = await supabase.from('pagamentos').insert({
    ...pagamentoData,
    referencia: pagamentoData.referencia || null,
    data_pagamento: pagamentoData.data_pagamento || null,
  })

  if (error) return { error: 'Erro ao criar recebível.' }

  // Bônus de combustível (semana de pontualidade)
  if (bonus === 'true' && veiculo_id) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('despesas').insert({
      categoria:    'combustivel',
      descricao:    'Bônus motorista - pagamentos em dia',
      valor:        180,
      data:         pagamentoData.data_vencimento,
      veiculo_id,
      motorista_id: pagamentoData.motorista_id,
      created_by:   user?.id ?? null,
    })
  }

  // Bônus de natal
  if (bonus_natal === 'true') {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('despesas').insert({
      categoria:    'outro',
      descricao:    'Bônus de natal - ceia',
      valor:        150,
      data:         pagamentoData.data_vencimento,
      veiculo_id:   veiculo_id ?? null,
      motorista_id: pagamentoData.motorista_id,
      created_by:   user?.id ?? null,
    })
  }

  revalidatePath(`/gestor/motoristas/${parsed.data.motorista_id}`)
  return null
}

// ── Criar multa ───────────────────────────────────────────────
const multaSchema = z.object({
  motorista_id: z.string().uuid(),
  veiculo_id:   z.string().uuid(),
  data:         z.string().min(1, 'Data obrigatória'),
  infracao:     z.string().min(1, 'Descrição obrigatória'),
  valor:        z.coerce.number().positive('Valor inválido'),
})

export async function criarMulta(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = multaSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = createClient()
  const { error } = await supabase.from('multas').insert({
    ...parsed.data,
    status: 'pendente',
  })

  if (error) return { error: 'Erro ao registrar multa.' }
  revalidatePath(`/gestor/motoristas/${parsed.data.motorista_id}`)
  return null
}

// ── Criar retirada ────────────────────────────────────────────
const retiradaSchema = z.object({
  motorista_id: z.string().uuid(),
  valor:        z.coerce.number().positive('Valor inválido'),
  data:         z.string().min(1, 'Data obrigatória'),
  observacao:   z.string().optional(),
})

export async function criarRetirada(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = retiradaSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = createClient()
  const { error } = await supabase.from('retiradas').insert({
    motorista_id: parsed.data.motorista_id,
    valor:        parsed.data.valor,
    data:         parsed.data.data,
    observacao:   parsed.data.observacao || null,
  })

  if (error) return { error: 'Erro ao registrar retirada.' }
  revalidatePath(`/gestor/motoristas/${parsed.data.motorista_id}`)
  return null
}

// ── Criar manutenção ──────────────────────────────────────────
const manutencaoSchema = z.object({
  veiculo_id:    z.string().uuid(),
  motorista_id:  z.string().uuid(),
  tipo:          z.string().min(1, 'Tipo obrigatório'),
  descricao:     z.string().optional(),
  valor:         z.coerce.number().optional(),
  quilometragem: z.coerce.number().optional(),
  data:          z.string().min(1, 'Data obrigatória'),
})

export async function criarManutencao(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = manutencaoSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('manutencoes').insert({
    veiculo_id:    parsed.data.veiculo_id,
    tipo:          parsed.data.tipo,
    descricao:     parsed.data.descricao || null,
    valor:         parsed.data.valor ?? null,
    quilometragem: parsed.data.quilometragem ?? null,
    data:          parsed.data.data,
    created_by:    user?.id ?? null,
  })

  if (error) return { error: 'Erro ao registrar manutenção.' }
  revalidatePath(`/gestor/motoristas/${parsed.data.motorista_id}`)
  return null
}

// ── Criar motorista ───────────────────────────────────────────
const motoristaSchema = z.object({
  nome:     z.string().min(2, 'Nome é obrigatório'),
  email:    z.string().email('E-mail inválido'),
  senha:    z.string().min(6, 'Senha mínimo 6 caracteres'),
  telefone: z.string().optional(),
  cpf:      z.string().optional(),
  cnh:      z.string().optional(),
})

export async function criarMotorista(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = motoristaSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { nome, email, senha, telefone, cpf, cnh } = parsed.data
  const supabase = createClient()

  const { error } = await supabase.rpc('criar_motorista', {
    p_nome: nome, p_email: email, p_senha: senha,
    p_telefone: telefone || null,
    p_cpf: cpf || null,
    p_cnh: cnh || null,
  })

  if (error) {
    if (error.message.includes('EMAIL_DUPLICADO')) return { error: 'E-mail já cadastrado.' }
    return { error: 'Erro ao criar motorista. Tente novamente.' }
  }

  redirect('/gestor/motoristas?ok=1')
}

// ── Criar contrato ────────────────────────────────────────────
const contratoSchema = z.object({
  motorista_id:   z.string().uuid(),
  veiculo_id:     z.string().uuid(),
  valor_aluguel:  z.coerce.number().positive('Valor inválido'),
  periodicidade:  z.enum(['semanal', 'quinzenal', 'mensal']),
  data_inicio:    z.string().min(1, 'Data obrigatória'),
  caucao_valor:   z.coerce.number().optional(),
  caucao_pago:    z.string().optional(),
  observacoes:    z.string().optional(),
})

export async function criarContrato(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = contratoSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { motorista_id, veiculo_id, valor_aluguel, periodicidade, data_inicio, caucao_valor, caucao_pago, observacoes } = parsed.data
  const supabase = createClient()

  const { error: contratoError } = await supabase.from('contratos').insert({
    motorista_id, veiculo_id, valor_aluguel, periodicidade,
    data_inicio, status: 'ativo',
    caucao_valor: caucao_valor ?? null,
    caucao_pago: caucao_pago === 'true',
    observacoes: observacoes || null,
  })

  if (contratoError) return { error: 'Erro ao criar contrato.' }

  // Atualiza status do veículo para alugado
  await supabase.from('veiculos').update({ status: 'alugado' }).eq('id', veiculo_id)

  redirect(`/gestor/motoristas/${motorista_id}?contrato=1`)
}

// ── Confirmar pagamento ───────────────────────────────────────
const confirmarSchema = z.object({
  id:              z.string().uuid(),
  motorista_id:    z.string().uuid(),
  data_pagamento:  z.string().min(1, 'Data obrigatória'),
  forma_pagamento: z.string().optional(),
})

export async function confirmarPagamento(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = confirmarSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = createClient()
  const { error } = await supabase.from('pagamentos').update({
    status: 'pago',
    data_pagamento: parsed.data.data_pagamento,
    forma_pagamento: parsed.data.forma_pagamento || null,
  }).eq('id', parsed.data.id)

  if (error) return { error: 'Erro ao confirmar pagamento.' }
  revalidatePath(`/gestor/motoristas/${parsed.data.motorista_id}`)
  revalidatePath('/gestor/receitas')
  return null
}

// ── Editar pagamento ──────────────────────────────────────────
const editarPagamentoSchema = z.object({
  id:              z.string().uuid(),
  motorista_id:    z.string().uuid(),
  referencia:      z.string().optional(),
  valor:           z.coerce.number().positive('Valor inválido'),
  data_vencimento: z.string().min(1, 'Data obrigatória'),
  status:          z.enum(['pendente', 'pago']),
  data_pagamento:  z.string().optional(),
  bonus:           z.string().optional(),
  bonus_natal:     z.string().optional(),
  veiculo_id:      z.string().optional(),
})

export async function editarPagamento(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = editarPagamentoSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { id, motorista_id, bonus, bonus_natal, veiculo_id, ...dados } = parsed.data
  const supabase = createClient()
  const { error } = await supabase.from('pagamentos').update({
    ...dados,
    referencia: dados.referencia || null,
    data_pagamento: dados.data_pagamento || null,
  }).eq('id', id)

  if (error) return { error: 'Erro ao editar recebível.' }

  if (bonus === 'true' && veiculo_id) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('despesas').insert({
      categoria: 'combustivel', descricao: 'Bônus motorista - pagamentos em dia',
      valor: 180, data: dados.data_vencimento,
      veiculo_id, motorista_id, created_by: user?.id ?? null,
    })
  }

  if (bonus_natal === 'true') {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('despesas').insert({
      categoria: 'outro', descricao: 'Bônus de natal - ceia',
      valor: 150, data: dados.data_vencimento,
      veiculo_id: veiculo_id ?? null, motorista_id, created_by: user?.id ?? null,
    })
  }

  revalidatePath(`/gestor/motoristas/${motorista_id}`)
  return null
}

// ── Criar seguro ──────────────────────────────────────────────
const seguroSchema = z.object({
  motorista_id: z.string().uuid(),
  veiculo_id:   z.string().uuid(),
  descricao:    z.string().optional(),
  valor:        z.coerce.number().positive('Valor inválido'),
  data:         z.string().min(1, 'Data obrigatória'),
})

export async function criarSeguro(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = seguroSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('despesas').insert({
    categoria:    'seguro',
    descricao:    parsed.data.descricao || null,
    valor:        parsed.data.valor,
    data:         parsed.data.data,
    veiculo_id:   parsed.data.veiculo_id,
    motorista_id: parsed.data.motorista_id,
    created_by:   user?.id ?? null,
  })

  if (error) return { error: 'Erro ao registrar seguro.' }
  revalidatePath(`/gestor/motoristas/${parsed.data.motorista_id}`)
  return null
}

// ── Confirmar multa ───────────────────────────────────────────
export async function confirmarMulta(id: string, motoristaId: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('multas').update({ status: 'paga' }).eq('id', id)
  revalidatePath(`/gestor/motoristas/${motoristaId}`)
}

// ── Confirmar manutenção ──────────────────────────────────────
export async function confirmarManutencao(id: string, motoristaId: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('manutencoes').update({ status: 'concluida' }).eq('id', id)
  revalidatePath(`/gestor/motoristas/${motoristaId}`)
}

// ── Deletar pagamento ─────────────────────────────────────────
export async function deletarPagamento(id: string, motoristaId: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('pagamentos').delete().eq('id', id)
  revalidatePath(`/gestor/motoristas/${motoristaId}`)
}

// ── Deletar retirada ──────────────────────────────────────────
export async function deletarRetirada(id: string, motoristaId: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('retiradas').delete().eq('id', id)
  revalidatePath(`/gestor/motoristas/${motoristaId}`)
}
