import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MotoristaBotNavbar } from '@/components/motorista-app/bottom-nav'

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

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pb-20">
        {children}
      </main>
      <MotoristaBotNavbar userName={profile.nome} />
    </div>
  )
}
