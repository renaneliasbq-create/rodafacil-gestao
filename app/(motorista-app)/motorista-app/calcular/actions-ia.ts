'use server'

import Anthropic from '@anthropic-ai/sdk'
import type { ContextoMotorista } from './actions-calcular'

const client = new Anthropic() // lê ANTHROPIC_API_KEY automaticamente

/* ── Helpers de formatação ───────────────────────────────────────── */
const DIAS = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado']

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
}

/* ── Monta o prompt com os dados reais ───────────────────────────── */
function montarPrompt(pergunta: string, ctx: ContextoMotorista): string {
  const linhas: string[] = [
    `Hoje é ${ctx.diaSemana}, ${ctx.dataHoje}, ${ctx.horaAtual}.`,
  ]

  const plats = Object.entries(ctx.ganhoPorHora)
  if (plats.length > 0) {
    linhas.push(`Ganho por hora: ${plats.map(([p, v]) => `${p} ${fmt(v)}/h`).join(', ')}.`)
  }

  const dias = Object.entries(ctx.mediaPorDiaSemana)
  if (dias.length > 0) {
    linhas.push(`Médias por dia: ${dias.map(([d, v]) => `${DIAS[+d]} ${fmt(v)}`).join(', ')}.`)
  }

  if (ctx.mediaGanhoHoje != null) {
    linhas.push(`Média histórica de ${ctx.diaSemana}: ${fmt(ctx.mediaGanhoHoje)}.`)
  }

  if (ctx.despesaMediaDia > 0) {
    linhas.push(`Despesas médias: ${fmt(ctx.despesaMediaDia)} por dia trabalhado.`)
  }

  if (ctx.kmPorHora != null) linhas.push(`KM médio por hora: ${ctx.kmPorHora} km/h.`)
  if (ctx.tipoCombustivel)   linhas.push(`Combustível do veículo: ${ctx.tipoCombustivel}.`)

  linhas.push(`Histórico disponível: ${ctx.diasHistorico} dia${ctx.diasHistorico !== 1 ? 's' : ''} de registro.`)
  linhas.push(`\nPergunta do motorista: ${pergunta}`)

  return linhas.join('\n')
}

/* ── Fallback local (sem IA) ─────────────────────────────────────── */
function respostaLocal(pergunta: string, ctx: ContextoMotorista): string {
  const p = pergunta.toLowerCase()

  if (p.includes('combust') || p.includes('custo') || p.includes('gast')) {
    return ctx.despesaMediaDia > 0
      ? `Seu custo médio por dia é ${fmt(ctx.despesaMediaDia)}. Você precisa faturar acima disso para ter lucro. Registre o combustível de hoje para manter a análise atualizada.`
      : 'Sem dados de despesas ainda. Registre seus gastos para eu calcular o custo do dia.'
  }

  if (p.includes('plataforma') || p.includes('uber') || p.includes('ifood')) {
    const plats = Object.entries(ctx.ganhoPorHora)
    if (plats.length > 1) {
      const melhor = plats.reduce((a, b) => a[1] > b[1] ? a : b)
      return `Nos últimos 30 dias a ${melhor[0]} foi a mais rentável com ${fmt(melhor[1])} por hora. Priorize ela hoje.`
    }
    return 'Você ainda não tem histórico suficiente para comparar plataformas. Continue registrando seus ganhos.'
  }

  if (p.includes('faturar') || p.includes('preciso') || p.includes('equilíbrio') || p.includes('mínimo')) {
    return ctx.despesaMediaDia > 0
      ? `Para cobrir os custos de hoje você precisa faturar pelo menos ${fmt(ctx.despesaMediaDia)}. Acima disso é lucro real.`
      : 'Registre suas despesas para eu calcular o ponto de equilíbrio do dia.'
  }

  if (ctx.mediaGanhoHoje != null && ctx.despesaMediaDia > 0) {
    const lucro = ctx.mediaGanhoHoje - ctx.despesaMediaDia
    return lucro > 0
      ? `Nas ${ctx.diaSemana}s você costuma ganhar ${fmt(ctx.mediaGanhoHoje)} líquido, com custo de ${fmt(ctx.despesaMediaDia)}. Lucro estimado de ${fmt(lucro)}. Vale rodar!`
      : `Nas ${ctx.diaSemana}s a média é ${fmt(ctx.mediaGanhoHoje)}, mas seu custo diário é ${fmt(ctx.despesaMediaDia)}. Analise bem antes de sair.`
  }

  if (ctx.diasHistorico < 5) {
    return 'Você tem poucos registros ainda. Com mais dados, minhas respostas ficam mais precisas. Continue registrando seus ganhos!'
  }

  return `Com base nos seus dados, seu custo médio diário é ${fmt(ctx.despesaMediaDia)}. Continue registrando para análises mais completas.`
}

/* ── Ação principal ──────────────────────────────────────────────── */
export async function perguntarAssistente(
  pergunta: string,
  contexto: ContextoMotorista,
): Promise<string> {
  // Se não há chave configurada, usa fallback local
  if (!process.env.ANTHROPIC_API_KEY) {
    return respostaLocal(pergunta, contexto)
  }

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',  // Haiku: baixa latência para voz (respostas em ~1s)
      max_tokens: 256,
      system: `Você é o assistente do Roda Fácil, um app de gestão para motoristas de aplicativo brasileiros.
Responda de forma direta, simples e amigável — como um amigo que entende de finanças falando com um motorista.
REGRAS OBRIGATÓRIAS:
- Máximo 3 frases curtas na resposta
- Use apenas os dados reais fornecidos, nunca invente números
- Fale em português brasileiro informal
- A resposta será lida em voz alta: evite símbolos, porcentagens escritas como %, use "por cento"
- Sempre termine com uma orientação prática
- Se os dados forem insuficientes, diga isso claramente e sugira registrar mais ganhos`,
      messages: [
        { role: 'user', content: montarPrompt(pergunta, contexto) },
      ],
    })

    const bloco = message.content.find(b => b.type === 'text')
    if (bloco?.type === 'text' && bloco.text.trim()) return bloco.text.trim()
    return respostaLocal(pergunta, contexto)

  } catch {
    // API indisponível: resposta local transparente (spec: não informar o erro ao usuário)
    return respostaLocal(pergunta, contexto)
  }
}
