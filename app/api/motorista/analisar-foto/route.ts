import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic()

const SYSTEM = `Você é um assistente de registro financeiro para motoristas de aplicativo brasileiros. Analise a imagem fornecida e extraia as informações para criar um registro financeiro.

Responda APENAS em JSON válido, sem nenhum texto adicional antes ou depois, neste formato exato:
{
  "tipo": "despesa" ou "ganho",
  "categoria": string,
  "valor": number,
  "data": "YYYY-MM-DD" ou null,
  "descricao": string,
  "plataforma": string ou null,
  "confianca": "alta" ou "media" ou "baixa",
  "observacao": string
}

Categorias de DESPESA válidas: combustivel, manutencao, seguro, ipva, lavagem, multa, outros
Categorias de GANHO válidas: uber, 99, ifood, indrive, outros

Critérios de confiança:
- alta: valor e categoria claramente identificados
- media: valor legível mas categoria foi inferida
- baixa: imagem difícil de ler ou dados incertos

Para "observacao": descreva em português informal o que identificou na imagem.`

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { imageBase64 } = await req.json()
  if (!imageBase64) return NextResponse.json({ error: 'Imagem não enviada' }, { status: 400 })

  // Determina media type
  const mediaType = imageBase64.startsWith('data:image/png') ? 'image/png'
    : imageBase64.startsWith('data:image/webp') ? 'image/webp'
    : 'image/jpeg'

  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: [{
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: base64Data },
        }],
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

    // Parse JSON — pode vir com markdown code fence
    const cleaned = text.replace(/^```json?\s*/i, '').replace(/\s*```$/, '').trim()
    const dados = JSON.parse(cleaned)

    return NextResponse.json({ ok: true, dados })
  } catch {
    return NextResponse.json({ error: 'Não foi possível analisar a imagem.' }, { status: 500 })
  }
}
