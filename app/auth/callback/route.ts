import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code   = searchParams.get('code')
  const perfil = searchParams.get('perfil') // 'gestor' | 'motorista_app' | null

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Verifica se o perfil já existe
        const { data: profile } = await supabase
          .from('users')
          .select('tipo')
          .eq('id', user.id)
          .maybeSingle()

        if (!profile) {
          // Novo usuário via OAuth
          const nome = user.user_metadata?.full_name
            ?? user.user_metadata?.name
            ?? user.email?.split('@')[0]
            ?? 'Usuário'

          const tipo = perfil === 'gestor' ? 'gestor' : 'motorista_app'

          await supabase.from('users').insert({
            id:    user.id,
            nome,
            email: user.email ?? '',
            tipo,
          })

          // Cria trial de 30 dias para gestores
          if (tipo === 'gestor') {
            const trialEnd = new Date()
            trialEnd.setDate(trialEnd.getDate() + 30)
            await supabase.from('assinaturas').insert({
              user_id:            user.id,
              plano:              'gestor_starter',
              perfil:             'gestor',
              periodo:            'mensal',
              preco_centavos:     4990,
              status:             'trial',
              current_period_end: trialEnd.toISOString().split('T')[0],
            })
            return NextResponse.redirect(`${origin}/gestor`)
          }

          return NextResponse.redirect(`${origin}/motorista-app`)
        }

        // Usuário existente — redireciona pelo tipo
        const dest = profile.tipo === 'gestor'
          ? '/gestor'
          : profile.tipo === 'motorista_app'
          ? '/motorista-app'
          : '/motorista'

        return NextResponse.redirect(`${origin}${dest}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
