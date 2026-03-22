import { Settings } from 'lucide-react'

export default function ConfiguracoesPage() {
  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-extrabold text-gray-900">Configurações</h1>
      <p className="text-gray-400 text-sm mt-1">Configurações do sistema — disponível em breve</p>
      <div className="mt-10 flex flex-col items-center justify-center text-center py-20 card">
        <Settings className="w-10 h-10 text-gray-200 mb-3" />
        <p className="text-sm font-medium text-gray-400">Módulo em construção</p>
      </div>
    </div>
  )
}
