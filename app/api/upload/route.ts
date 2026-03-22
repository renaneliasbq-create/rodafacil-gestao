import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const entidade = formData.get('entidade') as string
    const refId = formData.get('refId') as string

    if (!file || !entidade || !refId) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const nomeSanitizado = file.name
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9.\-_]/g, '_')
    const path = `${entidade}/${refId}/${Date.now()}-${nomeSanitizado}`

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { error: uploadError } = await supabase.storage
      .from('documentos')
      .upload(path, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: { publicUrl } } = supabase.storage.from('documentos').getPublicUrl(path)

    // Salvar no banco
    const tipoDoc = entidade === 'motorista' ? 'cnh' : 'crlv'
    const row = entidade === 'motorista'
      ? { tipo: tipoDoc, motorista_id: refId, veiculo_id: null, nome: file.name, path, url: publicUrl }
      : { tipo: tipoDoc, veiculo_id: refId, motorista_id: null, nome: file.name, path, url: publicUrl }

    const { error: dbError } = await supabase.from('documentos').insert(row)
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

    return NextResponse.json({ ok: true, url: publicUrl, nome: file.name, path })
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}
