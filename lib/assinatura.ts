/**
 * Helper centralizado de verificação de assinatura.
 * Usado pelos layouts protegidos (gestor, motorista-app).
 */
import { createClient } from '@/lib/supabase/server'

export type StatusAssinatura =
  | 'ativa'
  | 'trial'
  | 'pendente'        // aguardando pagamento
  | 'inadimplente'
  | 'cancelada'
  | 'sem_assinatura'  // nunca assinou
  | 'override'        // acesso garantido por plano_override

export interface AssinaturaInfo {
  status: StatusAssinatura
  plano?: string
  periodo?: string
  current_period_end?: string | null
  assinatura_id?: string
}

/**
 * Retorna o status da assinatura do usuário autenticado.
 * Também considera `plano_override` para usuários legados/admin.
 */
export async function getAssinaturaStatus(userId: string): Promise<AssinaturaInfo> {
  const supabase = createClient()

  // 1. Verifica override (usuários legados / admin)
  const { data: profile } = await supabase
    .from('users')
    .select('plano_override')
    .eq('id', userId)
    .single()

  if (profile?.plano_override) {
    return { status: 'override' }
  }

  // 2. Busca assinatura mais recente
  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('id, plano, periodo, status, current_period_end')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!assinatura) return { status: 'sem_assinatura' }

  return {
    status:             assinatura.status as StatusAssinatura,
    plano:              assinatura.plano,
    periodo:            assinatura.periodo,
    current_period_end: assinatura.current_period_end,
    assinatura_id:      assinatura.id,
  }
}

/** Retorna true se o acesso deve ser liberado */
export function temAcessoAtivo(info: AssinaturaInfo): boolean {
  if (['ativa', 'trial', 'override'].includes(info.status)) return true
  // Cancelada mas ainda dentro do período pago → mantém acesso
  if (info.status === 'cancelada' && info.current_period_end) {
    return new Date(info.current_period_end) > new Date()
  }
  return false
}
