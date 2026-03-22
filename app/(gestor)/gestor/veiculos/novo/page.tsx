import { createClient } from '@/lib/supabase/server'
import { NovoVeiculoForm } from './form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NovoVeiculoPage() {
  const supabase = createClient()

  // Motoristas sem contrato ativo
  const { data: todosMotoristas } = await supabase
    .from('users')
    .select('id, nome')
    .eq('tipo', 'motorista')
    .order('nome')

  const { data: contratosAtivos } = await supabase
    .from('contratos')
    .select('motorista_id')
    .eq('status', 'ativo')

  const motoristasVinculados = new Set(contratosAtivos?.map(c => c.motorista_id))
  const motoristasDisponiveis = (todosMotoristas ?? []).filter(m => !motoristasVinculados.has(m.id))

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/gestor/veiculos" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Novo Veículo</h1>
          <p className="text-gray-500 text-sm mt-0.5">Adicione um veículo à frota</p>
        </div>
      </div>

      <NovoVeiculoForm motoristas={motoristasDisponiveis} />
    </div>
  )
}
