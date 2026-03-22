import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MotoristaNavbar } from '@/components/motorista/navbar'

export default async function MotoristaLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('nome, tipo')
    .eq('id', user.id)
    .single()

  if (profile?.tipo !== 'motorista') redirect('/gestor')

  return (
    <div className="min-h-screen bg-gray-50">
      <MotoristaNavbar userName={profile.nome} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  )
}
