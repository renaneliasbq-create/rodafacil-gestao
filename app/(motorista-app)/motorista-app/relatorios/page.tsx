import { BarChart2 } from 'lucide-react'

export default function RelatoriosPage() {
  return (
    <div className="px-4 pt-6 pb-4">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Relatórios</h1>
        <p className="text-sm text-gray-400 mt-1">Análise de desempenho e lucro real</p>
      </div>

      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
          <BarChart2 className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Em construção</h2>
        <p className="text-sm text-gray-400 max-w-xs">
          Veja seu lucro real por plataforma, custo por km e ganho por hora trabalhada.
        </p>
      </div>
    </div>
  )
}
