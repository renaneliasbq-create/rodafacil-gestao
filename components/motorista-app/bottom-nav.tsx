'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, TrendingUp, ArrowUpCircle, Gauge, BarChart2, MoreHorizontal, X, Settings, LogOut, Car, Bell } from 'lucide-react'
import { useState } from 'react'
import { signOut } from '@/app/(auth)/login/actions'

const NAV_ITEMS = [
  { href: '/motorista-app',          label: 'Início',    icon: LayoutDashboard },
  { href: '/motorista-app/ganhos',   label: 'Ganhos',    icon: TrendingUp },
  { href: '/motorista-app/despesas', label: 'Despesas',  icon: ArrowUpCircle },
  { href: '/motorista-app/km',       label: 'KM',        icon: Gauge },
]

const MAIS_ITEMS = [
  { href: '/motorista-app/relatorios', label: 'Relatórios',  icon: BarChart2 },
  { href: '/motorista-app/veiculo',    label: 'Meu Veículo', icon: Car },
  { href: '/motorista-app/alertas',    label: 'Alertas',     icon: Bell },
  { href: '/motorista-app/configuracoes', label: 'Configurações', icon: Settings },
]

interface BottomNavProps {
  userName: string
}

export function MotoristaBotNavbar({ userName }: BottomNavProps) {
  const pathname = usePathname()
  const [maisOpen, setMaisOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/motorista-app' ? pathname === '/motorista-app' : pathname.startsWith(href)

  const isMaisActive = MAIS_ITEMS.some(item => isActive(item.href))

  return (
    <>
      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-white border-t border-gray-200 flex items-stretch safe-area-bottom print:hidden">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors',
              isActive(href)
                ? 'text-emerald-600'
                : 'text-gray-400 hover:text-gray-600'
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </Link>
        ))}

        {/* Botão "Mais" */}
        <button
          onClick={() => setMaisOpen(true)}
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors',
            isMaisActive ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
          )}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-none">Mais</span>
        </button>
      </nav>

      {/* Drawer "Mais" */}
      {maisOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setMaisOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-400">Motorista</p>
                <p className="text-sm font-semibold text-gray-900">{userName}</p>
              </div>
              <button
                onClick={() => setMaisOpen(false)}
                className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <nav className="px-3 py-3 space-y-1">
              {MAIS_ITEMS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMaisOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    isActive(href)
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>

            {/* Logout */}
            <div className="px-3 pb-8 pt-2 border-t border-gray-100 mt-1">
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  <span>Sair</span>
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  )
}
