'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface DadosRegistroRapido {
  tipo: 'despesa' | 'ganho'
  categoria: string
  valor: number
  data: string
  descricao: string | null
  plataforma: string | null
  horas: number | null
  origem: 'voz' | 'foto'
  confianca: 'alta' | 'media' | 'baixa' | null
  fotoBase64?: string | null
}

export async function salvarRegistroRapido(dados: DadosRegistroRapido): Promise<{ ok?: boolean; error?: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  let fotoUrl: string | null = null

  // Upload da foto se fornecida (apenas para origem 'foto')
  if (dados.origem === 'foto' && dados.fotoBase64) {
    try {
      const base64Data = dados.fotoBase64.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')
      const ext    = dados.fotoBase64.startsWith('data:image/png') ? 'png' : 'jpg'
      const path   = `${user.id}/${Date.now()}.${ext}`

      const { error: upErr } = await supabase.storage
        .from('motorista-fotos')
        .upload(path, buffer, { contentType: ext === 'png' ? 'image/png' : 'image/jpeg', upsert: false })

      if (!upErr) {
        const { data: urlData } = supabase.storage.from('motorista-fotos').getPublicUrl(path)
        fotoUrl = urlData?.publicUrl ?? null
      }
    } catch {
      // Foto opcional — não bloquear o registro se falhar o upload
    }
  }

  if (dados.tipo === 'ganho') {
    const { error } = await supabase.from('motorista_ganhos').insert({
      motorista_id:      user.id,
      plataforma:        dados.plataforma ?? dados.categoria,
      data:              dados.data,
      valor_bruto:       dados.valor,
      valor_liquido:     dados.valor,
      horas_trabalhadas: dados.horas,
      origem:            dados.origem,
    })
    if (error) return { error: 'Erro ao salvar ganho.' }
  } else {
    const { error } = await supabase.from('motorista_despesas').insert({
      motorista_id: user.id,
      categoria:    dados.categoria,
      data:         dados.data,
      descricao:    dados.descricao,
      valor:        dados.valor,
      origem:       dados.origem,
      foto_url:     fotoUrl,
    })
    if (error) return { error: 'Erro ao salvar despesa.' }
  }

  // Analytics — fire and forget
  supabase.from('motorista_registros_rapidos').insert({
    motorista_id: user.id,
    canal:        dados.origem,
    tipo:         dados.tipo,
    confianca_ia: dados.confianca,
    sucesso:      true,
  }).then(() => {}).catch(() => {})

  revalidatePath('/motorista-app')
  revalidatePath('/motorista-app/ganhos')
  revalidatePath('/motorista-app/despesas')
  return { ok: true }
}
