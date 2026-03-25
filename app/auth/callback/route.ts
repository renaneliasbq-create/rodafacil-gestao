import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

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
          // Novo usuário via OAuth — cria perfil como motorista_app
          const nome = user.user_metadata?.full_name
            ?? user.user_metadata?.name
            ?? user.email?.split('@')[0]
            ?? 'Motorista'

          await supabase.from('users').insert({
            id:    user.id,
            nome,
            email: user.email ?? '',
            tipo:  'motorista_app',
          })

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
