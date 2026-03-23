import { createClient } from '@/lib/supabase/server'
import { LayoutDashboard } from 'lucide-react'

export default async function MotoristaAppDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('nome')
    .eq('id', user!.id)
    .single()

  const primeiroNome = profile?.nome?.split(' ')[0] ?? 'Motorista'

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-gray-400">Bem-vindo de volta,</p>
        <h1 className="text-2xl font-extrabold text-gray-900">{primeiroNome} 👋</h1>
      </div>

      {/* Em construção */}
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
          <LayoutDashboard className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Dashboard em breve</h2>
        <p className="text-sm text-gray-400 max-w-xs">
          Aqui você verá um resumo dos seus ganhos, despesas e lucro real por plataforma.
        </p>
      </div>
    </div>
  )
}
