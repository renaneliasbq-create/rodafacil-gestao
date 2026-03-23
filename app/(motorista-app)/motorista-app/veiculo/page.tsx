import { createClient } from '@/lib/supabase/server'
import { Car, Fuel, Calendar, Hash, Gauge, ArrowUpCircle, TrendingDown } from 'lucide-react'
import { BtnCadastrarVeiculo, BtnEditarVeiculo } from './veiculo-client'

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function InfoRow({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{valor}</span>
    </div>
  )
}

export default async function VeiculoPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [
    { data: veiculo },
    { data: kmRows },
    { data: despesas },
  ] = await Promise.all([
    supabase.from('motorista_veiculo')
      .select('*')
      .eq('motorista_id', user.id)
      .single(),

    supabase.from('motorista_quilometragem')
      .select('km_total, km_final')
      .eq('motorista_id', user.id)
      .order('data', { ascending: false }),

    supabase.from('motorista_despesas')
      .select('valor, categoria')
      .eq('motorista_id', user.id),
  ])

  const totalKm     = (kmRows ?? []).reduce((s, r) => s + (r.km_total ?? 0), 0)
  const ultimoKm    = kmRows?.[0]?.km_final ?? null
  const totalDesp   = (despesas ?? []).reduce((s, d) => s + (d.valor ?? 0), 0)
  const custoPorKm  = totalKm > 0 ? totalDesp / totalKm : 0

  // Despesa dominante
  const porCat: Record<string, number> = {}
  for (const d of (despesas ?? [])) {
    porCat[d.categoria] = (porCat[d.categoria] ?? 0) + (d.valor ?? 0)
  }
  const maiorCat = Object.entries(porCat).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="pb-6">
      {/* ── Header ── */}
      <div className="px-4 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Meu Veículo</h1>
          <p className="text-sm text-gray-400 mt-0.5">Dados e estatísticas</p>
        </div>
        {veiculo
          ? <BtnEditarVeiculo veiculo={veiculo} />
          : <BtnCadastrarVeiculo />
        }
      </div>

      {!veiculo ? (
        /* ── Empty state ── */
        <div className="mx-4 mt-4 flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
            <Car className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">Nenhum veículo cadastrado</p>
          <p className="text-xs text-gray-400 max-w-xs mb-5">
            Cadastre seu veículo para acompanhar estatísticas de km, despesas e custo por km.
          </p>
          <BtnCadastrarVeiculo />
        </div>
      ) : (
        <>
          {/* ── Card do veículo ── */}
          <div className="mx-4 mb-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 shadow-lg">
              {/* Placa */}
              <div className="inline-flex items-center gap-1.5 bg-white/10 rounded-xl px-3 py-1.5 mb-4">
                <Hash className="w-3.5 h-3.5 text-white/60" />
                <span className="text-white font-bold text-sm tracking-widest">{veiculo.placa}</span>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-white/60 text-xs font-medium">{veiculo.marca}</p>
                  <p className="text-white text-2xl font-extrabold leading-tight">{veiculo.modelo}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-white/60 text-xs">
                      <Calendar className="w-3.5 h-3.5" />{veiculo.ano}
                    </span>
                    {veiculo.cor && (
                      <span className="text-white/60 text-xs">{veiculo.cor}</span>
                    )}
                    <span className="flex items-center gap-1 text-white/60 text-xs">
                      <Fuel className="w-3.5 h-3.5" />{veiculo.tipo_combustivel}
                    </span>
                  </div>
                </div>
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Car className="w-8 h-8 text-white/60" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Estatísticas ── */}
          <div className="grid grid-cols-3 gap-2 px-4 mb-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-3 text-center shadow-sm">
              <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-1.5">
                <Gauge className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-[10px] text-gray-400 font-medium">KM rodados</p>
              <p className="text-base font-extrabold text-gray-900">
                {totalKm > 0 ? totalKm.toLocaleString('pt-BR') : '—'}
              </p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-3 text-center shadow-sm">
              <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-1.5">
                <ArrowUpCircle className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-[10px] text-gray-400 font-medium">Total desp.</p>
              <p className="text-base font-extrabold text-gray-900">
                {totalDesp > 0 ? fmt(totalDesp) : '—'}
              </p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-3 text-center shadow-sm">
              <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-1.5">
                <TrendingDown className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-[10px] text-gray-400 font-medium">Custo/km</p>
              <p className="text-base font-extrabold text-gray-900">
                {custoPorKm > 0 ? `R$${custoPorKm.toFixed(2)}` : '—'}
              </p>
            </div>
          </div>

          {/* ── Dados do veículo ── */}
          <div className="px-4 mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Dados cadastrais</p>
            <div className="bg-white border border-gray-100 rounded-2xl px-4 shadow-sm">
              <InfoRow label="Marca" valor={veiculo.marca} />
              <InfoRow label="Modelo" valor={veiculo.modelo} />
              <InfoRow label="Ano" valor={String(veiculo.ano)} />
              <InfoRow label="Placa" valor={veiculo.placa} />
              {veiculo.cor && <InfoRow label="Cor" valor={veiculo.cor} />}
              <InfoRow label="Combustível" valor={veiculo.tipo_combustivel} />
              {veiculo.valor_compra && (
                <InfoRow label="Valor de compra" valor={fmt(veiculo.valor_compra)} />
              )}
            </div>
          </div>

          {/* ── Insights ── */}
          {(totalKm > 0 || totalDesp > 0) && (
            <div className="px-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Insights</p>
              <div className="space-y-2">
                {ultimoKm && (
                  <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Gauge className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Hodômetro atual (estimado)</p>
                      <p className="text-sm font-bold text-gray-900">{ultimoKm.toLocaleString('pt-BR')} km</p>
                    </div>
                  </div>
                )}
                {maiorCat && (
                  <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <ArrowUpCircle className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Maior gasto</p>
                      <p className="text-sm font-bold text-gray-900">
                        {maiorCat[0]} · {fmt(maiorCat[1])}
                        <span className="text-gray-400 font-normal ml-1">
                          ({totalDesp > 0 ? (maiorCat[1] / totalDesp * 100).toFixed(0) : 0}% do total)
                        </span>
                      </p>
                    </div>
                  </div>
                )}
                {veiculo.valor_compra && totalDesp > 0 && (
                  <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <TrendingDown className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Custo de manutenção sobre compra</p>
                      <p className="text-sm font-bold text-gray-900">
                        {(totalDesp / veiculo.valor_compra * 100).toFixed(1)}% do valor do veículo
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
