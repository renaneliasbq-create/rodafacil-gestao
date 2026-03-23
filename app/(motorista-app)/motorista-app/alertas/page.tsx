import { Bell } from 'lucide-react'

export default function AlertasPage() {
  return (
    <div className="px-4 pt-6 pb-4">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Alertas</h1>
        <p className="text-sm text-gray-400 mt-1">Vencimentos e lembretes importantes</p>
      </div>

      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mb-4">
          <Bell className="w-8 h-8 text-yellow-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Em construção</h2>
        <p className="text-sm text-gray-400 max-w-xs">
          Receba alertas de CNH, CRLV, revisão e outros vencimentos importantes.
        </p>
      </div>
    </div>
  )
}
