'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export type FormState = { error?: string; success?: string } | null

// ── Atualizar perfil ───────────────────────────────────────────
const perfilSchema = z.object({
  nome:     z.string().min(2, 'Nome é obrigatório'),
  telefone: z.string().optional(),
})

export async function atualizarPerfil(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = perfilSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { error } = await supabase
    .from('users')
    .update({ nome: parsed.data.nome, telefone: parsed.data.telefone || null, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { error: 'Erro ao salvar perfil.' }

  revalidatePath('/gestor/configuracoes')
  return { success: 'Perfil atualizado com sucesso!' }
}

// ── Criar novo gestor ──────────────────────────────────────────
const gestorSchema = z.object({
  nome:     z.string().min(2, 'Nome é obrigatório'),
  email:    z.string().email('E-mail inválido'),
  senha:    z.string().min(6, 'Senha mínimo 6 caracteres'),
  telefone: z.string().optional(),
})

export async function criarGestor(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = gestorSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { nome, email, senha, telefone } = parsed.data
  const supabase = createClient()

  const { error } = await supabase.rpc('criar_gestor', {
    p_nome: nome,
    p_email: email,
    p_senha: senha,
    p_telefone: telefone || null,
  })

  if (error) {
    if (error.message.includes('EMAIL_DUPLICADO')) return { error: 'E-mail já cadastrado.' }
    return { error: 'Erro ao criar usuário. Tente novamente.' }
  }

  revalidatePath('/gestor/configuracoes')
  return { success: `Acesso criado para ${nome}!` }
}

// ── Salvar URL do avatar ───────────────────────────────────────
export async function salvarAvatar(url: string): Promise<{ error?: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { error } = await supabase
    .from('users')
    .update({ foto_url: url, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { error: 'Erro ao salvar foto.' }
  revalidatePath('/gestor/configuracoes')
  return {}
}

// ── Remover acesso de gestor ───────────────────────────────────
export async function removerGestor(gestorId: string): Promise<{ error?: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.id === gestorId) return { error: 'Você não pode remover seu próprio acesso.' }

  const { error } = await supabase.from('users').update({ tipo: 'inativo' }).eq('id', gestorId)
  if (error) return { error: 'Erro ao remover acesso.' }

  revalidatePath('/gestor/configuracoes')
  return {}
}
