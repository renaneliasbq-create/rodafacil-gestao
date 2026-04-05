'use server'

import { createClient } from '@/lib/supabase/server'
import { pagarme } from '@/lib/pagarme/client'
import { getPlano, type PlanoId } from '@/lib/pagarme/plans'

export type IniciarState = {
  error?: string
  assinatura_id?: string
  customer_id?: string
} | null

/**
 * Passo 1 — valida dados pessoais, cria cliente no Pagar.me
 * e registra a assinatura como 'pendente' no banco.
 */
export async function iniciarAssinatura(
  _prev: IniciarState,
  formData: FormData
): Promise<IniciarState> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada. Faça login novamente.' }

  // Campos do formulário
  const planoId  = formData.get('plano')   as PlanoId
  const periodo  = formData.get('periodo') as 'mensal' | 'anual'
  const nome     = (formData.get('nome')   as string)?.trim()
  const email    = (formData.get('email')  as string)?.trim()
  const doc      = (formData.get('doc')    as string)?.replace(/\D/g, '')
  const tel      = (formData.get('tel')    as string)?.replace(/\D/g, '')
  const cep      = (formData.get('cep')    as string)?.replace(/\D/g, '')
  const linha1   = (formData.get('linha1') as string)?.trim()
  const numero   = (formData.get('numero') as string)?.trim()
  const cidade   = (formData.get('cidade') as string)?.trim()
  const estado   = (formData.get('estado') as string)?.trim().toUpperCase()

  // Validações básicas
  if (!nome || nome.length < 3) return { error: 'Informe o nome completo.' }
  if (!email) return { error: 'Informe o e-mail.' }
  if (!doc || (doc.length !== 11 && doc.length !== 14)) return { error: 'CPF (11 dígitos) ou CNPJ (14 dígitos) inválido.' }
  if (!tel || tel.length < 10) return { error: 'Telefone inválido.' }
  if (!cep || cep.length !== 8) return { error: 'CEP inválido (8 dígitos).' }
  if (!linha1) return { error: 'Informe o endereço.' }
  if (!numero) return { error: 'Informe o número.' }
  if (!cidade) return { error: 'Informe a cidade.' }
  if (!estado || estado.length !== 2) return { error: 'Informe o estado (UF).' }

  let plano
  try { plano = getPlano(planoId) } catch { return { error: 'Plano inválido.' } }

  const preco = periodo === 'anual' ? plano.preco_anual * 12 : plano.preco_mensal

  // Verifica se já tem assinatura ativa (trial expirado não bloqueia)
  const { data: assinaturaExistente } = await supabase
    .from('assinaturas')
    .select('id, status, current_period_end')
    .eq('user_id', user.id)
    .in('status', ['ativa', 'trial'])
    .maybeSingle()

  if (assinaturaExistente) {
    const hoje = new Date().toISOString().split('T')[0]
    const trialExpirado = assinaturaExistente.status === 'trial' &&
      assinaturaExistente.current_period_end &&
      assinaturaExistente.current_period_end < hoje

    if (!trialExpirado) {
      return { error: 'Você já possui uma assinatura ativa. Acesse "Minha Assinatura" para gerenciá-la.' }
    }

    // Trial expirado: fecha o trial antigo para criar a assinatura paga
    await supabase
      .from('assinaturas')
      .update({ status: 'cancelada', cancelada_em: new Date().toISOString() })
      .eq('id', assinaturaExistente.id)
  }

  // Cria (ou recupera) cliente no Pagar.me
  let customerId: string

  const { data: profile } = await supabase
    .from('users')
    .select('pagarme_customer_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.pagarme_customer_id) {
    customerId = profile.pagarme_customer_id
  } else {
    try {
      const areaCode = tel.slice(0, 2)
      const number   = tel.slice(2)

      const customer = await pagarme.post<{ id: string }>('/customers', {
        name:     nome,
        email,
        type:     doc.length === 11 ? 'individual' : 'company',
        document: doc,
        phones: {
          mobile_phone: {
            country_code: '55',
            area_code:    areaCode,
            number,
          },
        },
        address: {
          line_1:  `${linha1}, ${numero}`,
          zip_code: cep,
          city:    cidade,
          state:   estado,
          country: 'BR',
        },
      })

      customerId = customer.id

      // Salva o customer_id no perfil do usuário
      await supabase
        .from('users')
        .update({ pagarme_customer_id: customerId })
        .eq('id', user.id)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar cliente no Pagar.me.'
      return { error: msg }
    }
  }

  // Cria o registro de assinatura como 'pendente'
  const { data: assinatura, error: dbError } = await supabase
    .from('assinaturas')
    .insert({
      user_id:            user.id,
      plano:              planoId,
      perfil:             plano.perfil,
      periodo,
      preco_centavos:     preco,
      status:             'pendente',
      pagarme_customer_id: customerId,
    })
    .select('id')
    .single()

  if (dbError) return { error: 'Erro ao registrar assinatura. Tente novamente.' }

  return { assinatura_id: assinatura.id, customer_id: customerId }
}
