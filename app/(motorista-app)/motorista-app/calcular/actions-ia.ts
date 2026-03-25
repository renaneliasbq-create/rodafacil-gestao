'use server'

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
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
  if (ctx.precoCombustivelRef != null) linhas.push(`Último preço de combustível registrado: ${fmt(ctx.precoCombustivelRef)}.`)

  linhas.push(`Histórico disponível: ${ctx.diasHistorico} dia${ctx.diasHistorico !== 1 ? 's' : ''} de registro.`)
  linhas.push(`\nPergunta do motorista: ${pergunta}`)

  return linhas.join('\n')
}

/* ── Fallback local (sem IA) ─────────────────────────────────────── */
function respostaLocal(pergunta: string, ctx: ContextoMotorista): string {
  const p = pergunta.toLowerCase()

  /* ── Grupo 5: Comparativo de plataformas ── */
  const isGrupo5 = p.includes('plataforma') || p.includes('uber') || p.includes('99') ||
    p.includes('ifood') || p.includes('indrive') || p.includes('onde ganho mais') ||
    p.includes('compensa mais') || p.includes('melhor app')
  if (isGrupo5) {
    const plats = Object.entries(ctx.ganhoPorHora)
    if (plats.length > 1) {
      const melhor = plats.reduce((a, b) => a[1] > b[1] ? a : b)
      const pior   = plats.reduce((a, b) => a[1] < b[1] ? a : b)
      return `Nos últimos 30 dias a ${melhor[0]} pagou mais, com ${fmt(melhor[1])} por hora. A ${pior[0]} ficou em ${fmt(pior[1])} por hora. Priorize a ${melhor[0]} hoje.`
    }
    if (plats.length === 1) {
      return `Você só tem dados da ${plats[0][0]} por enquanto, com ${fmt(plats[0][1])} por hora. Registre ganhos das outras plataformas para comparar.`
    }
    return 'Sem dados de plataformas ainda. Registre seus ganhos para eu comparar qual compensa mais.'
  }

  /* ── Grupo 4: Custo do dia / combustível ── */
  const isGrupo4 = p.includes('combust') || p.includes('custo') || p.includes('gast') ||
    p.includes('consumo') || p.includes('quanto o carro') || p.includes('despesa')
  if (isGrupo4) {
    if (ctx.despesaMediaDia > 0 && ctx.kmPorHora != null && ctx.precoCombustivelRef != null) {
      return `Seu custo médio é ${fmt(ctx.despesaMediaDia)} por dia trabalhado. Você roda em média ${ctx.kmPorHora} km por hora, com combustível a ${fmt(ctx.precoCombustivelRef)}. Registre o abastecimento de hoje para manter o cálculo preciso.`
    }
    return ctx.despesaMediaDia > 0
      ? `Seu custo médio por dia trabalhado é ${fmt(ctx.despesaMediaDia)}. Você precisa faturar acima disso para ter lucro. Registre o combustível de hoje para atualizar a análise.`
      : 'Sem dados de despesas ainda. Registre seus gastos de combustível para eu calcular o custo do dia.'
  }

  /* ── Grupo 2: Ponto de equilíbrio / quanto preciso faturar ── */
  const isGrupo2 = p.includes('faturar') || p.includes('preciso ganhar') || p.includes('equilibrio') ||
    p.includes('equilíbrio') || p.includes('mínimo') || p.includes('minimo') || p.includes('cobrir') ||
    p.includes('ponto de') || p.includes('pelo menos')
  if (isGrupo2) {
    return ctx.despesaMediaDia > 0
      ? `Para cobrir seus custos hoje você precisa faturar pelo menos ${fmt(ctx.despesaMediaDia)}. Acima disso é tudo lucro. Fique de olho no painel durante o dia.`
      : 'Registre suas despesas de combustível e outras para eu calcular o ponto de equilíbrio do dia.'
  }

  /* ── Grupo 3: Previsão de ganho ── */
  const isGrupo3 = p.includes('vou ganhar') || p.includes('costumo ganhar') || p.includes('previsão') ||
    p.includes('previsao') || p.includes('ganho hoje') || p.includes('quanto ganho') || p.includes('ganhar hoje')
  if (isGrupo3) {
    if (ctx.mediaGanhoHoje != null) {
      return `Nas ${ctx.diaSemana}s você costuma ganhar em média ${fmt(ctx.mediaGanhoHoje)} líquido. Isso é baseado no seu histórico dos últimos 30 dias. Registre o dia de hoje para melhorar a previsão.`
    }
    const plats = Object.entries(ctx.ganhoPorHora)
    if (plats.length > 0) {
      const media = plats.reduce((s, [, v]) => s + v, 0) / plats.length
      return `Sua média geral é ${fmt(media)} por hora nas plataformas. Multiplique pelas horas que planeja trabalhar para estimar o ganho de hoje.`
    }
    return `Sem histórico de ${ctx.diaSemana}s ainda. Registre mais alguns dias para eu fazer a previsão.`
  }

  /* ── Grupo 1: Vale a pena rodar hoje ── */
  if (ctx.mediaGanhoHoje != null && ctx.despesaMediaDia > 0) {
    const lucro = ctx.mediaGanhoHoje - ctx.despesaMediaDia
    return lucro > 0
      ? `Nas ${ctx.diaSemana}s você costuma ganhar ${fmt(ctx.mediaGanhoHoje)} e seu custo é ${fmt(ctx.despesaMediaDia)}. Lucro médio de ${fmt(lucro)}. Vale rodar hoje!`
      : `Nas ${ctx.diaSemana}s a média é ${fmt(ctx.mediaGanhoHoje)}, mas seu custo diário é ${fmt(ctx.despesaMediaDia)}. Pode não compensar — avalie bem as horas antes de sair.`
  }

  if (ctx.mediaGanhoHoje != null) {
    return `Nas ${ctx.diaSemana}s você costuma ganhar ${fmt(ctx.mediaGanhoHoje)}. Registre suas despesas para eu calcular se compensa rodar hoje.`
  }

  if (ctx.diasHistorico < 5) {
    return 'Você tem poucos registros ainda. Com mais dados meus cálculos ficam bem mais precisos. Continue registrando seus ganhos!'
  }

  return `Com ${ctx.diasHistorico} dias de histórico, seu custo médio diário é ${fmt(ctx.despesaMediaDia)}. Continue registrando para análises mais completas.`
}

/* ── Salva no histórico (fire-and-forget, nunca bloqueia) ────────── */
async function salvarHistorico(pergunta: string, resposta: string) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('motorista_voz_historico').insert({
      motorista_id: user.id,
      pergunta,
      resposta,
    })
  } catch {
    // Silencioso — histórico é opcional, não pode travar a resposta
  }
}

/* ── Ação principal ──────────────────────────────────────────────── */
export async function perguntarAssistente(
  pergunta: string,
  contexto: ContextoMotorista,
): Promise<string> {
  // Se não há chave configurada, usa fallback local
  if (!process.env.ANTHROPIC_API_KEY) {
    const resp = respostaLocal(pergunta, contexto)
    salvarHistorico(pergunta, resp)   // não aguarda
    return resp
  }

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',  // Haiku: baixa latência para voz (respostas em ~1s)
      max_tokens: 256,
      system: `Você é o assistente do Roda Fácil, app de gestão para motoristas de aplicativo brasileiros.
Responda de forma direta, simples e amigável — como um amigo que entende de finanças falando com um motorista.

REGRAS OBRIGATÓRIAS:
- Máximo 3 frases curtas na resposta
- Use apenas os dados reais fornecidos, nunca invente números
- Fale em português brasileiro informal
- A resposta será lida em voz alta: sem símbolos especiais, sem "%", use "por cento"; sem "R$", use "reais"
- Sempre termine com uma orientação prática curta
- Se os dados forem insuficientes, diga claramente e sugira registrar mais ganhos

GRUPOS DE PERGUNTAS — identifique o grupo e siga a orientação:

GRUPO 1 — Vale a pena rodar hoje / compensa trabalhar / devo sair hoje:
  Se tiver média do dia da semana E despesa média: compare os dois e dê veredicto claro (vale / não vale / depende das horas).
  Se faltar um dos dois: diga o que falta e peça para registrar.

GRUPO 2 — Quanto preciso faturar / mínimo para cobrir gastos / ponto de equilíbrio:
  Se tiver despesa média: informe o valor mínimo e diga que acima disso é lucro.
  Se não tiver: peça para registrar despesas.

GRUPO 3 — Quanto vou ganhar / previsão de ganho / quanto costumo ganhar / ganho por hora:
  Se pergunta for sobre dia específico: use a média histórica daquele dia.
  Se for geral: use a média do dia atual da semana ou a média por hora da plataforma citada.
  Se não tiver dados: oriente a registrar mais dias.

GRUPO 4 — Custo do dia / quanto gasto de combustível / consumo do carro:
  Se tiver despesa média: informe o custo médio por dia trabalhado.
  Se tiver km por hora e preço de combustível: estime o custo de combustível por hora ou por dia.
  Se não tiver: peça para registrar despesas de combustível.

GRUPO 5 — Qual plataforma compensa mais / Uber ou 99 / onde ganho mais por hora:
  Se tiver dados de 2+ plataformas: aponte a melhor por ganho/hora e sugira priorizá-la.
  Se tiver apenas 1: diga qual é e sugira registrar as outras para comparar.
  Se não tiver nenhuma: peça para registrar ganhos com a plataforma indicada.

FORA DOS GRUPOS: responda o que puder com os dados disponíveis e sugira uma das perguntas acima.`,
      messages: [
        { role: 'user', content: montarPrompt(pergunta, contexto) },
      ],
    })

    const bloco = message.content.find(b => b.type === 'text')
    const texto = bloco?.type === 'text' && bloco.text.trim() ? bloco.text.trim() : respostaLocal(pergunta, contexto)
    salvarHistorico(pergunta, texto)  // não aguarda
    return texto

  } catch {
    // API indisponível: resposta local transparente (spec: não informar o erro ao usuário)
    const resp = respostaLocal(pergunta, contexto)
    salvarHistorico(pergunta, resp)   // não aguarda
    return resp
  }
}
