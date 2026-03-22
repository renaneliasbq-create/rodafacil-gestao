import { createClient } from '@/lib/supabase/server'
import { MESES } from '@/lib/utils'
import { Gauge } from 'lucide-react'

export default async function QuilometragemPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: registros } = await supabase
    .from('quilometragem')
    .select('*')
    .eq('motorista_id', user.id)
    .order('ano', { ascending: false })
    .order('mes', { ascending: false })

  const totalKm = registros?.reduce((s, r) => s + r.km_total, 0) ?? 0
  const mediaKm = registros && registros.length > 0
    ? Math.round(totalKm / registros.length)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Quilometragem</h1>
        <p className="text-gray-500 text-sm mt-0.5">Acompanhe a quilometragem rodada por mês</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total acumulado</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {totalKm.toLocaleString('pt-BR')} <span className="text-sm font-medium text-gray-400">km</span>
          </p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Média mensal</p>
          <p className="text-xl font-bold text-blue-700 mt-1">
            {mediaKm.toLocaleString('pt-BR')} <span className="text-sm font-medium text-gray-400">km</span>
          </p>
        </div>
      </div>

      {/* Lista */}
      <div className="card">
        <div className="flex items-center gap-2 p-5 border-b border-gray-100">
          <Gauge className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Registros mensais</h2>
          <span className="ml-auto text-xs text-gray-400">{registros?.length ?? 0} meses</span>
        </div>

        {registros && registros.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {registros.map((r) => {
              const mesLabel = MESES[r.mes - 1] ?? r.mes
              const barWidth = totalKm > 0 ? Math.round((r.km_total / totalKm) * 100) : 0

              return (
                <div key={r.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {mesLabel}/{r.ano}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {r.km_total.toLocaleString('pt-BR')} km
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-16 text-center">
            <Gauge className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-medium">Nenhum registro de quilometragem</p>
            <p className="text-xs text-gray-400 mt-1">Os dados serão exibidos aqui mensalmente</p>
          </div>
        )}
      </div>
    </div>
  )
}
