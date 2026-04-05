import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const dados = await req.json()

  const prompt = `Dados financeiros do motorista este mês:
- Lucro real: R$ ${dados.lucroReal?.toFixed(2)}
- Variação vs mês anterior: ${dados.varLucro != null ? (dados.varLucro >= 0 ? '+' : '') + dados.varLucro?.toFixed(1) + '%' : 'sem comparativo'}
- Margem de lucro: ${dados.margem?.toFixed(1)}%
- Melhor dia da semana: ${dados.melhorDia ?? 'não disponível'}
- Pior dia da semana: ${dados.piorDia ?? 'não disponível'}
- Plataforma mais rentável/hora: ${dados.melhorPlataforma ?? 'não disponível'}
- Plataforma menos rentável/hora: ${dados.piorPlataforma ?? 'não disponível'}
- Despesas: R$ ${dados.totalDesp?.toFixed(2)} (${dados.propDesp?.toFixed(0)}% da receita líquida)
- Dias trabalhados: ${dados.diasTrabalhados}
- Meta atingida: ${dados.metaAtingida ?? 'sem meta definida'}`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: `Você é um assistente financeiro para motoristas de aplicativo brasileiros. Com base nos dados fornecidos, gere exatamente 3 insights práticos e personalizados em português informal. Cada insight deve: ter no máximo 2 frases, destacar um aprendizado ou alerta concreto, e terminar com uma orientação acionável. Nunca use termos técnicos complexos. Responda APENAS com um JSON no formato: {"insights": [{"tipo": "positivo"|"alerta"|"sugestao", "texto": "..."}]}`,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const json = JSON.parse(text)
    return NextResponse.json(json)
  } catch {
    return NextResponse.json({ error: 'Erro ao processar insights' }, { status: 500 })
  }
}
