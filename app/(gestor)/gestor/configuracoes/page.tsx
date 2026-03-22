export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { User, Lock, Users, ShieldCheck } from 'lucide-react'
import { PerfilForm } from './perfil-form'
import { SenhaForm } from './senha-form'
import { GestoresSection } from './gestores-section'
import { formatDate } from '@/lib/utils'

export default async function ConfiguracoesPage() {
  const supabase = createClient()

  const [
    { data: { user } },
    { data: gestores },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('users').select('id, nome, email, telefone, created_at').eq('tipo', 'gestor').order('created_at'),
  ])

  const perfil = gestores?.find(g => g.id === user?.id)

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Configurações</h1>
        <p className="text-gray-500 text-sm mt-0.5">Gerencie seu perfil e os acessos ao sistema</p>
      </div>

      {/* Meu perfil */}
      <div className="card p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
          <User className="w-4 h-4 text-blue-500" />
          <h2 className="font-semibold text-gray-900">Meu perfil</h2>
        </div>

        {/* Avatar + email (somente leitura) */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-blue-700">
              {perfil?.nome?.charAt(0).toUpperCase() ?? '?'}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{perfil?.nome ?? '—'}</p>
            <p className="text-xs text-gray-400">{user?.email}</p>
            <p className="text-xs text-gray-300 mt-0.5">Desde {perfil?.created_at ? formatDate(perfil.created_at) : '—'}</p>
          </div>
        </div>

        <PerfilForm nome={perfil?.nome ?? ''} telefone={perfil?.telefone ?? null} />
      </div>

      {/* Segurança */}
      <div className="card p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
          <Lock className="w-4 h-4 text-blue-500" />
          <h2 className="font-semibold text-gray-900">Segurança</h2>
        </div>
        <SenhaForm />
      </div>

      {/* Usuários com acesso */}
      <div className="card p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-2 pb-4 border-b border-gray-100">
          <ShieldCheck className="w-4 h-4 text-blue-500" />
          <h2 className="font-semibold text-gray-900">Usuários com acesso</h2>
          <span className="ml-auto text-xs text-gray-400">{gestores?.length ?? 0} gestor{(gestores?.length ?? 0) !== 1 ? 'es' : ''}</span>
        </div>
        <div className="pt-2">
          <GestoresSection gestores={gestores ?? []} currentUserId={user?.id ?? ''} />
        </div>
      </div>
    </div>
  )
}
