import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GestorSidebar } from '@/components/gestor/sidebar'

export default async function GestorLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('nome, tipo')
    .eq('id', user.id)
    .single()

  if (profile?.tipo !== 'gestor') redirect('/motorista')

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <GestorSidebar userName={profile.nome} />

      <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
        {children}
      </main>
    </div>
  )
}
