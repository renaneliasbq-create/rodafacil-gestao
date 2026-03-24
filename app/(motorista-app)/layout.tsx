import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MotoristaBotNavbar } from '@/components/motorista-app/bottom-nav'
import { getAssinaturaStatus, temAcessoAtivo } from '@/lib/assinatura'
import { BloqueioAssinatura } from '@/components/subscription/bloqueio'

export default async function MotoristaAppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('nome, tipo')
    .eq('id', user.id)
    .single()

  if (profile?.tipo !== 'motorista_app') redirect('/login')

  // Verifica assinatura
  const assinaturaInfo = await getAssinaturaStatus(user.id)
  if (!temAcessoAtivo(assinaturaInfo)) {
    return <BloqueioAssinatura info={assinaturaInfo} perfil="motorista" />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pb-20">
        {children}
      </main>
      <MotoristaBotNavbar userName={profile.nome} />
    </div>
  )
}
