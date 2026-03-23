export const dynamic = 'force-dynamic'

import { unstable_noStore as noStore } from 'next/cache'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, MESES } from '@/lib/utils'
import { FiltroDre } from './filtro-dre'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const CATEGORIA_LABELS: Record<string, string> = {
  manutencao:    'Manutenção',
  emplacamento:  'Emplacamento',
  ipva:          'IPVA',
  seguro:        'Seguro',
  multa:         'Multas',
  combustivel:   'Combustível',
  administrativo:'Administrativo',
  outro:         'Outras despesas',
}

const CNPJ_LABELS: Record<string, string> = {
  contador:            'Contador / Contabilidade',
  alvara:              'Alvará',
  certificado_digital: 'Certificado Digital',
  software:            'Software',
  telefone_internet:   'Telefone / Internet',
  aluguel:             'Aluguel',
  imposto:             'Impostos e Taxas',
  bancario:            'Tarifas Bancárias',
  outro:               'Outras despesas administrativas',
}

function extractCategoriaCnpj(descricao: string | null): string {
  if (!descricao) return 'outro'
  const match = descricao.match(/^\[CNPJ\] ([^:]+):/)
  return match ? match[1].trim() : 'outro'
}

function DRELinha({ label, valor, tipo = 'normal', indent = false }: {
  label: string
  valor: number
  tipo?: 'normal' | 'subtotal' | 'total' | 'resultado'
  indent?: boolean
}) {
  const isNegativo = valor < 0 || (tipo === 'normal' && label.startsWith('(-)'))

  const containerClass = {
    normal:    'flex items-baseline justify-between py-1.5 border-b border-gray-50',
    subtotal:  'flex items-baseline justify-between py-2 border-t border-gray-200 mt-1',
    total:     'flex items-baseline justify-between py-2.5 border-t-2 border-gray-300 mt-1 bg-gray-50 px-3 -mx-3 rounded-lg',
    resultado: 'flex items-baseline justify-between py-3 border-t-2 border-gray-800 mt-2 bg-blue-50 px-3 -mx-3 rounded-lg',
  }[tipo]

  const labelClass = {
    normal:    `text-sm text-gray-600 ${indent ? 'pl-4' : ''}`,
    subtotal:  'text-sm font-semibold text-gray-700',
    total:     'text-sm font-bold text-gray-800',
    resultado: 'text-base font-extrabold text-blue-900',
  }[tipo]

  const valueClass = {
    normal:    `text-sm font-medium tabular-nums ${isNegativo || valor < 0 ? 'text-red-600' : 'text-gray-800'}`,
    subtotal:  `text-sm font-bold tabular-nums ${valor < 0 ? 'text-red-600' : 'text-gray-700'}`,
    total:     `text-sm font-bold tabular-nums ${valor < 0 ? 'text-red-700' : 'text-gray-800'}`,
    resultado: `text-base font-extrabold tabular-nums ${valor < 0 ? 'text-red-700' : 'text-blue-700'}`,
  }[tipo]

  return (
    <div className={containerClass}>
      <span className={labelClass}>{label}</span>
      <span className={valueClass}>{formatCurrency(Math.abs(valor))}</span>
    </div>
  )
}

function Secao({ titulo }: { titulo: string }) {
  return (
    <div className="mt-6 mb-2">
      <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">{titulo}</p>
    </div>
  )
}

export default async function DrePage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  noStore()
  const supabase = createClient()

  const hoje = new Date()
  const ano = hoje.getFullYear()
  const p = searchParams.p ?? 'ano'

  let dataInicio: string
  let dataFim: string
  let periodoLabel: string

  if (p === 's1') {
    dataInicio = `${ano}-01-01`; dataFim = `${ano}-06-30`; periodoLabel = `1º Semestre ${ano}`
  } else if (p === 's2') {
    dataInicio = `${ano}-07-01`; dataFim = `${ano}-12-31`; periodoLabel = `2º Semestre ${ano}`
  } else if (p === 'mes') {
    const mes = String(hoje.getMonth() + 1).padStart(2, '0')
    const ultimoDia = new Date(ano, hoje.getMonth() + 1, 0).getDate()
    dataInicio = `${ano}-${mes}-01`; dataFim = `${ano}-${mes}-${ultimoDia}`
    periodoLabel = `${MESES[hoje.getMonth()]} ${ano}`
  } else if (p === 'custom' && searchParams.ini && searchParams.fim) {
    dataInicio = searchParams.ini; dataFim = searchParams.fim
    periodoLabel = `${formatDate(searchParams.ini)} – ${formatDate(searchParams.fim)}`
  } else {
    dataInicio = `${ano}-01-01`; dataFim = `${ano}-12-31`; periodoLabel = `Ano ${ano}`
  }

  const [
    { data: pagamentos },
    { data: despesas },
    { data: saques },
  ] = await Promise.all([
    supabase.from('pagamentos').select('valor, status').gte('data_vencimento', dataInicio).lte('data_vencimento', dataFim).eq('status', 'pago'),
    supabase.from('despesas').select('valor, categoria, descricao').gte('data', dataInicio).lte('data', dataFim),
    supabase.from('saques').select('valor').gte('data', dataInicio).lte('data', dataFim),
  ])

  // ── Receitas ─────────────────────────────────────
  const receitaBruta = (pagamentos ?? []).reduce((s, p) => s + Number(p.valor), 0)

  // ── Bonificações (despesas com descricao 'Bônus') ─
  const bonificacoes = (despesas ?? [])
    .filter(d => d.descricao?.startsWith('Bônus'))
    .reduce((s, d) => s + Number(d.valor), 0)

  const receitaLiquida = receitaBruta - bonificacoes

  // ── Despesas operacionais (veículos, exceto CNPJ e bônus) ──
  const despesasOperacionais = (despesas ?? []).filter(d =>
    !d.descricao?.startsWith('[CNPJ]') &&
    !d.descricao?.startsWith('Bônus')
  )

  const porCategoria: Record<string, number> = {}
  for (const d of despesasOperacionais) {
    const cat = d.categoria ?? 'outro'
    porCategoria[cat] = (porCategoria[cat] ?? 0) + Number(d.valor)
  }
  const totalOperacional = Object.values(porCategoria).reduce((s, v) => s + v, 0)

  // ── Despesas administrativas CNPJ ─────────────────
  const despesasCnpj = (despesas ?? []).filter(d => d.descricao?.startsWith('[CNPJ]'))
  const porCnpj: Record<string, number> = {}
  for (const d of despesasCnpj) {
    const cat = extractCategoriaCnpj(d.descricao)
    porCnpj[cat] = (porCnpj[cat] ?? 0) + Number(d.valor)
  }
  const totalCnpj = Object.values(porCnpj).reduce((s, v) => s + v, 0)

  const totalDespesas = totalOperacional + totalCnpj

  // ── Resultado operacional ──────────────────────────
  const resultadoOperacional = receitaLiquida - totalDespesas

  // ── Retiradas do gestor ────────────────────────────
  const totalSaques = (saques ?? []).reduce((s, r) => s + Number(r.valor), 0)

  // ── Resultado líquido ──────────────────────────────
  const resultadoLiquido = resultadoOperacional - totalSaques

  const geradoEm = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="p-4 lg:p-8 space-y-4 print:p-0 print:space-y-0">

      {/* Filtro + botão imprimir — oculto na impressão */}
      <div className="print:hidden">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/gestor/relatorios" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4" /> Voltar para Relatórios
          </Link>
        </div>
        <div className="card p-4">
          <Suspense>
            <FiltroDre />
          </Suspense>
        </div>
      </div>

      {/* Documento DRE */}
      <div className="card p-6 sm:p-8 max-w-2xl mx-auto print:shadow-none print:border-none print:max-w-none print:p-8">

        {/* Cabeçalho do documento */}
        <div className="text-center mb-8 pb-6 border-b-2 border-gray-200">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Documento Financeiro</p>
          <h1 className="text-xl font-extrabold text-gray-900">Demonstração do Resultado</h1>
          <h2 className="text-base font-semibold text-gray-600 mt-0.5">do Exercício — DRE Simplificado</h2>
          <div className="mt-3 space-y-0.5">
            <p className="text-sm font-semibold text-gray-800">Roda Fácil SC</p>
            <p className="text-sm text-gray-500">Período: <span className="font-semibold text-gray-700">{periodoLabel}</span></p>
          </div>
        </div>

        {/* ── RECEITAS ── */}
        <Secao titulo="1. Receitas" />
        <DRELinha label="(+) Receita Bruta de Locações" valor={receitaBruta} />
        {bonificacoes > 0 && (
          <DRELinha label="(-) Bonificações concedidas aos motoristas" valor={bonificacoes} indent />
        )}
        <DRELinha label="(=) Receita Líquida de Locações" valor={receitaLiquida} tipo="subtotal" />

        {/* ── DESPESAS OPERACIONAIS ── */}
        <Secao titulo="2. Despesas Operacionais (Veículos)" />
        {Object.entries(porCategoria)
          .sort((a, b) => b[1] - a[1])
          .map(([cat, val]) => (
            <DRELinha
              key={cat}
              label={`(-) ${CATEGORIA_LABELS[cat] ?? cat}`}
              valor={val}
              indent
            />
          ))
        }
        {totalOperacional > 0
          ? <DRELinha label="(=) Total Despesas Operacionais" valor={totalOperacional} tipo="subtotal" />
          : <p className="text-sm text-gray-400 py-2 italic">Nenhuma despesa operacional no período</p>
        }

        {/* ── DESPESAS ADMINISTRATIVAS ── */}
        <Secao titulo="3. Despesas Administrativas (CNPJ)" />
        {Object.entries(porCnpj)
          .sort((a, b) => b[1] - a[1])
          .map(([cat, val]) => (
            <DRELinha
              key={cat}
              label={`(-) ${CNPJ_LABELS[cat] ?? cat}`}
              valor={val}
              indent
            />
          ))
        }
        {totalCnpj > 0
          ? <DRELinha label="(=) Total Despesas Administrativas" valor={totalCnpj} tipo="subtotal" />
          : <p className="text-sm text-gray-400 py-2 italic">Nenhuma despesa administrativa no período</p>
        }

        {/* ── RESULTADO OPERACIONAL ── */}
        <div className="mt-2">
          <DRELinha
            label={`(=) ${resultadoOperacional >= 0 ? 'Resultado Operacional' : 'Prejuízo Operacional'}`}
            valor={resultadoOperacional}
            tipo="total"
          />
        </div>

        {/* ── RETIRADAS ── */}
        <Secao titulo="4. Distribuição ao Sócio" />
        <DRELinha label="(-) Retiradas do sócio (pró-labore / distribuição)" valor={totalSaques} indent />

        {/* ── RESULTADO LÍQUIDO ── */}
        <div className="mt-2">
          <DRELinha
            label={`(=) ${resultadoLiquido >= 0 ? 'Resultado Líquido do Exercício' : 'Prejuízo Líquido do Exercício'}`}
            valor={resultadoLiquido}
            tipo="resultado"
          />
        </div>

        {/* Rodapé do documento */}
        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-400">Gerado em {geradoEm}</p>
            <p className="text-xs text-gray-400">Este documento é um resumo gerencial simplificado.</p>
          </div>
          <div className="text-right">
            <div className="border-t border-gray-400 pt-1 w-48">
              <p className="text-xs text-gray-500">Assinatura / Contador</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
