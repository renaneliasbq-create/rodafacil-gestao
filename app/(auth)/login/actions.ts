'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

export type SignUpState = { error?: string } | null

export async function signUpGestor(
  _prevState: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const nome     = (formData.get('nome')     as string)?.trim()
  const email    = (formData.get('email')    as string)?.trim()
  const password = formData.get('password')  as string
  const confirm  = formData.get('confirm')   as string

  if (!nome || nome.length < 2)      return { error: 'Informe seu nome completo.' }
  if (!email)                        return { error: 'Informe um e-mail válido.' }
  if (password.length < 6)           return { error: 'A senha deve ter no mínimo 6 caracteres.' }
  if (password !== confirm)          return { error: 'As senhas não coincidem.' }

  const supabase = createClient()

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nome, tipo: 'gestor' } },
  })

  if (signUpError) {
    if (signUpError.message.includes('already registered')) {
      return { error: 'Este e-mail já está cadastrado. Faça login.' }
    }
    return { error: 'Erro ao criar conta. Tente novamente.' }
  }

  if (!authData.user) return { error: 'Erro ao criar conta. Tente novamente.' }

  // Garante que o perfil existe com tipo correto
  await supabase.from('users').upsert({
    id:    authData.user.id,
    nome,
    email,
    tipo:  'gestor',
  })

  // Cria trial de 30 dias automaticamente
  const trialEnd = new Date()
  trialEnd.setDate(trialEnd.getDate() + 30)

  await supabase.from('assinaturas').insert({
    user_id:           authData.user.id,
    plano:             'gestor_starter',
    perfil:            'gestor',
    periodo:           'mensal',
    preco_centavos:    4990,
    status:            'trial',
    current_period_end: trialEnd.toISOString().split('T')[0],
  })

  redirect('/gestor')
}

export async function signUpMotoApp(
  _prevState: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const nome     = (formData.get('nome')     as string)?.trim()
  const email    = (formData.get('email')    as string)?.trim()
  const password = formData.get('password')  as string
  const confirm  = formData.get('confirm')   as string

  if (!nome || nome.length < 2)      return { error: 'Informe seu nome completo.' }
  if (!email)                        return { error: 'Informe um e-mail válido.' }
  if (password.length < 6)           return { error: 'A senha deve ter no mínimo 6 caracteres.' }
  if (password !== confirm)          return { error: 'As senhas não coincidem.' }

  const supabase = createClient()

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nome, tipo: 'motorista_app' } },
  })

  if (signUpError) {
    if (signUpError.message.includes('already registered')) {
      return { error: 'Este e-mail já está cadastrado. Faça login.' }
    }
    return { error: 'Erro ao criar conta. Tente novamente.' }
  }

  if (!authData.user) return { error: 'Erro ao criar conta. Tente novamente.' }

  // Garante que o perfil existe com tipo correto
  await supabase.from('users').upsert({
    id:    authData.user.id,
    nome,
    email,
    tipo:  'motorista_app',
  })

  redirect('/motorista-app')
}

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

export type LoginState = {
  error?: string
} | null

export async function signIn(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const supabase = createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'E-mail ou senha incorretos.' }
    }
    return { error: 'Erro ao fazer login. Tente novamente.' }
  }

  // Busca o tipo do usuário para redirecionar ao dashboard correto
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Erro ao autenticar.' }

  const { data: profile } = await supabase
    .from('users')
    .select('tipo')
    .eq('id', user.id)
    .single()

  const dest = profile?.tipo === 'gestor'
    ? '/gestor'
    : profile?.tipo === 'motorista_app'
    ? '/motorista-app'
    : '/motorista'
  redirect(dest)
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
