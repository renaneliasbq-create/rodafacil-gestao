import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: Parameters<typeof supabaseResponse.cookies.set>[2] }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Rotas de assinatura — acessíveis mesmo logado (não redireciona para dashboard)
  const subscriptionRoutes = ['/planos', '/assinar']
  if (subscriptionRoutes.some(r => pathname === r || pathname.startsWith(r))) {
    return supabaseResponse
  }

  // Rotas públicas — não precisa de auth; se logado, redireciona para o dashboard
  const publicRoutes = ['/', '/login', '/auth/callback']
  if (publicRoutes.some(r => pathname === r || (r !== '/' && pathname.startsWith(r)))) {
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('tipo')
        .eq('id', user.id)
        .single()

      const dest =
        profile?.tipo === 'gestor'        ? '/gestor'
      : profile?.tipo === 'motorista_app' ? '/motorista-app'
      : '/motorista'
      return NextResponse.redirect(new URL(dest, request.url))
    }
    return supabaseResponse
  }

  // Rotas protegidas — exige autenticação
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verificar tipo de usuário para rotas /gestor e /motorista
  const { data: profile } = await supabase
    .from('users').select('tipo').eq('id', user.id).single()

  if (pathname.startsWith('/gestor') && profile?.tipo !== 'gestor') {
    const dest = profile?.tipo === 'motorista_app' ? '/motorista-app' : '/login'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  if (pathname.startsWith('/motorista-app') && profile?.tipo !== 'motorista_app') {
    const dest = profile?.tipo === 'gestor' ? '/gestor' : '/login'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  if (pathname.startsWith('/motorista') && !pathname.startsWith('/motorista-app') && profile?.tipo !== 'motorista') {
    return NextResponse.redirect(new URL('/gestor', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
