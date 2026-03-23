import { Car } from 'lucide-react'

export default function VeiculoPage() {
  return (
    <div className="px-4 pt-6 pb-4">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Meu Veículo</h1>
        <p className="text-sm text-gray-400 mt-1">Dados e documentos do seu carro</p>
      </div>

      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <Car className="w-8 h-8 text-gray-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Em construção</h2>
        <p className="text-sm text-gray-400 max-w-xs">
          Cadastre seu veículo, CRLV e acompanhe alertas de revisão e documentos.
        </p>
      </div>
    </div>
  )
}
