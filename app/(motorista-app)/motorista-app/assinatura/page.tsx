export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MinhaAssinatura } from '@/components/subscription/minha-assinatura'

export default async function AssinaturaMotoristaPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: assinatura }, { data: pagamentos }] = await Promise.all([
    supabase.from('users').select('plano_override').eq('id', user.id).single(),
    supabase
      .from('assinaturas')
      .select('id, plano, perfil, periodo, preco_centavos, status, current_period_start, current_period_end, cancelada_em')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('assinatura_pagamentos')
      .select('id, metodo, status, valor_centavos, referencia_mes, pago_em, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  return (
    <MinhaAssinatura
      assinatura={assinatura ? { ...assinatura, plano_override: profile?.plano_override ?? false } : null}
      pagamentos={pagamentos ?? []}
      planoOverride={profile?.plano_override ?? false}
    />
  )
}
