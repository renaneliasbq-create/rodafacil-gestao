export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Car, Wrench, Users, TrendingUp } from 'lucide-react'
import { VincularMotoristaForm } from './vincular-form'
import { InvestimentoForm } from './investimento-form'
import { DocumentosSection } from './documentos'

export default async function VeiculoDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const [
    { data: veiculo },
    { data: contrato },
    { data: manutencoes },
    { data: todosMotoristas },
    { data: contratosAtivos },
    { data: todosContratos },
    { data: pagamentos },
    { data: despesas },
    { data: docVeiculo },
  ] = await Promise.all([
    supabase.from('veiculos').select('*').eq('id', params.id).single(),
    supabase.from('contratos')
      .select('*, motorista:users(id, nome, email, telefone)')
      .eq('veiculo_id', params.id).eq('status', 'ativo').limit(1).single(),
    supabase.from('manutencoes').select('*').eq('veiculo_id', params.id)
      .order('data', { ascending: false }).limit(10),
    supabase.from('users').select('id, nome').eq('tipo', 'motorista').order('nome'),
    supabase.from('contratos').select('motorista_id').eq('status', 'ativo'),
    supabase.from('contratos').select('id').eq('veiculo_id', params.id),
    supabase.from('pagamentos').select('contrato_id, valor, status, data_vencimento'),
    supabase.from('despesas').select('valor, data').eq('veiculo_id', params.id),
    supabase.from('documentos').select('*').eq('tipo', 'veiculo').eq('veiculo_id', params.id).order('created_at', { ascending: false }),
  ])

  const motoristasVinculados = new Set(contratosAtivos?.map(c => c.motorista_id))
  const motoristasDisponiveis = (todosMotoristas ?? []).filter(m => !motoristasVinculados.has(m.id))

  if (!veiculo) notFound()

  const motorista = (Array.isArray(contrato?.motorista) ? contrato?.motorista[0] : contrato?.motorista) as Record<string, string> | null
  const motoristaId = motorista?.id ?? null

  const { data: docMotorista } = motoristaId
    ? await supabase.from('documentos').select('*').eq('tipo', 'motorista').eq('motorista_id', motoristaId).order('created_at', { ascending: false })
    : { data: [] }

  // ── Cálculo de payback ─────────────────────────────────────
  const contratosIds = new Set((todosContratos ?? []).map(c => c.id))
  const receitaTotal = (pagamentos ?? [])
    .filter(p => p.status === 'pago' && contratosIds.has(p.contrato_id))
    .reduce((s, p) => s + p.valor, 0)
  const despesaTotal = (despesas ?? []).reduce((s, d) => s + d.valor, 0)
  const lucroAcumulado = receitaTotal - despesaTotal
  const valorCompra = veiculo.valor_compra ?? null

  // Estimar lucro médio mensal (últimos meses com dados)
  let mesesEstimativa: number | null = null
  if (valorCompra && valorCompra > 0) {
    // Agrupa receita por mês para calcular média
    const receitaPorMes: Record<string, number> = {}
    ;(pagamentos ?? [])
      .filter(p => p.status === 'pago' && contratosIds.has(p.contrato_id))
      .forEach(p => {
        const mes = p.data_vencimento.slice(0, 7)
        receitaPorMes[mes] = (receitaPorMes[mes] ?? 0) + p.valor
      })
    const despesaPorMes: Record<string, number> = {}
    ;(despesas ?? []).forEach(d => {
      const mes = d.data.slice(0, 7)
      despesaPorMes[mes] = (despesaPorMes[mes] ?? 0) + d.valor
    })
    const allMeses = new Set([...Object.keys(receitaPorMes), ...Object.keys(despesaPorMes)])
    const lucroPorMes = Array.from(allMeses).map(m => (receitaPorMes[m] ?? 0) - (despesaPorMes[m] ?? 0))
    const mediaLucroMensal = lucroPorMes.length > 0 ? lucroPorMes.reduce((s, v) => s + v, 0) / lucroPorMes.length : 0
    const faltaRecuperar = valorCompra - lucroAcumulado
    mesesEstimativa = mediaLucroMensal > 0 && faltaRecuperar > 0
      ? Math.ceil(faltaRecuperar / mediaLucroMensal)
      : faltaRecuperar <= 0 ? 0 : null
  }

  const percentRecuperado = valorCompra && valorCompra > 0
    ? Math.min(100, Math.max(0, (lucroAcumulado / valorCompra) * 100))
    : null

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/gestor/veiculos" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">{veiculo.marca} {veiculo.modelo}</h1>
          <p className="text-gray-500 text-sm mt-0.5 font-bold tracking-wider">{veiculo.placa}</p>
        </div>
        <span className={`badge ml-auto ${STATUS_COLORS[veiculo.status as keyof typeof STATUS_COLORS]}`}>
          {STATUS_LABELS[veiculo.status]}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Dados do veículo */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Car className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Dados do veículo</h2>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Ano',     value: String(veiculo.ano) },
              { label: 'Cor',     value: veiculo.cor },
              { label: 'Chassi', value: veiculo.chassi },
              { label: 'KM',     value: veiculo.km_atual ? `${veiculo.km_atual.toLocaleString('pt-BR')} km` : null },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-medium text-gray-900">{value ?? '—'}</span>
              </div>
            ))}
          </div>
          <DocumentosSection
            entidade="veiculo"
            refId={params.id}
            documentos={docVeiculo ?? []}
            label="Documentos do veículo"
          />
        </div>

        {/* Motorista atual */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Motorista atual</h2>
          </div>
          {motorista && contrato && !Array.isArray(contrato.motorista) ? (
            <div className="space-y-2">
              {[
                { label: 'Nome',   value: motorista.nome },
                { label: 'E-mail', value: motorista.email },
                { label: 'Fone',   value: motorista.telefone },
                { label: 'Valor',  value: `${formatCurrency(contrato.valor_aluguel)} / ${STATUS_LABELS[contrato.periodicidade] ?? contrato.periodicidade}` },
                { label: 'Início', value: formatDate(contrato.data_inicio) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-medium text-gray-900">{value ?? '—'}</span>
                </div>
              ))}
              {motoristaId && (
                <DocumentosSection
                  entidade="motorista"
                  refId={motoristaId}
                  documentos={docMotorista ?? []}
                  label="CNH / Documentos"
                />
              )}
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-400 mb-4">Veículo sem motorista no momento.</p>
              <VincularMotoristaForm veiculoId={params.id} motoristas={motoristasDisponiveis} />
            </div>
          )}
        </div>
      </div>

      {/* Card de Payback */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <h2 className="font-semibold text-gray-900">Análise de Payback</h2>
          </div>
          <InvestimentoForm veiculoId={params.id} valorAtual={veiculo.valor_compra} />
        </div>

        {valorCompra ? (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">Investimento</p>
                <p className="text-base font-bold text-gray-900">{formatCurrency(valorCompra)}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <p className="text-xs text-emerald-600 mb-1">Receita total</p>
                <p className="text-base font-bold text-emerald-700">{formatCurrency(receitaTotal)}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <p className="text-xs text-red-500 mb-1">Despesas total</p>
                <p className="text-base font-bold text-red-600">{formatCurrency(despesaTotal)}</p>
              </div>
              <div className={`rounded-xl p-3 text-center ${lucroAcumulado >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                <p className={`text-xs mb-1 ${lucroAcumulado >= 0 ? 'text-blue-500' : 'text-orange-500'}`}>Lucro acumulado</p>
                <p className={`text-base font-bold ${lucroAcumulado >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>{formatCurrency(lucroAcumulado)}</p>
              </div>
            </div>

            {/* Barra de progresso */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Progresso do payback</span>
                <span className="text-sm font-bold text-blue-600">{percentRecuperado?.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all ${percentRecuperado! >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(100, percentRecuperado!)}%` }}
                />
              </div>
            </div>

            {/* Status do payback */}
            <div className="bg-gray-50 rounded-xl p-4">
              {mesesEstimativa === 0 ? (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <p className="text-sm font-semibold text-emerald-700">Payback atingido! O veículo já se pagou.</p>
                </div>
              ) : mesesEstimativa != null ? (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    Estimativa de payback:{' '}
                    <span className="font-bold text-blue-700">
                      {mesesEstimativa} {mesesEstimativa === 1 ? 'mês' : 'meses'}
                    </span>
                    {' '}(com base na média mensal atual)
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />
                  <p className="text-sm text-gray-500">Sem dados suficientes para estimar o payback.</p>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">
                Falta recuperar: <span className="font-medium text-gray-600">{formatCurrency(Math.max(0, valorCompra - lucroAcumulado))}</span>
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-gray-400 mb-1">Nenhum valor de compra definido.</p>
            <p className="text-xs text-gray-400">Clique em "Definir investimento" para ativar a análise de payback.</p>
          </div>
        )}
      </div>

      {/* Manutenções */}
      <div className="card">
        <div className="flex items-center gap-2 p-5 border-b border-gray-100">
          <Wrench className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Histórico de manutenção</h2>
          <span className="ml-auto text-xs text-gray-400">{manutencoes?.length ?? 0} registros</span>
        </div>
        {manutencoes && manutencoes.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {manutencoes.map((m) => (
              <div key={m.id} className="flex items-start justify-between px-5 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="badge bg-orange-100 text-orange-700">{m.tipo}</span>
                    <span className="text-xs text-gray-400">{formatDate(m.data)}</span>
                  </div>
                  {m.descricao && <p className="text-sm text-gray-600 mt-1">{m.descricao}</p>}
                </div>
                {m.valor != null && (
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(m.valor)}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <p className="text-sm text-gray-400">Nenhuma manutenção registrada</p>
          </div>
        )}
      </div>
    </div>
  )
}
