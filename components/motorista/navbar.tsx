'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, CreditCard, Wrench, Gauge, AlertTriangle, FileText, LogOut, Menu, X,
} from 'lucide-react'
import { useState } from 'react'
import { signOut } from '@/app/(auth)/login/actions'

const NAV_ITEMS = [
  { href: '/motorista',              label: 'Resumo',       icon: LayoutDashboard },
  { href: '/motorista/pagamentos',   label: 'Pagamentos',   icon: CreditCard },
  { href: '/motorista/manutencao',   label: 'Manutenção',   icon: Wrench },
  { href: '/motorista/quilometragem', label: 'Quilometragem', icon: Gauge },
  { href: '/motorista/multas',       label: 'Multas',       icon: AlertTriangle },
  { href: '/motorista/documentos',   label: 'Documentos',   icon: FileText },
]

interface NavbarProps {
  userName: string
}

export function MotoristaNavbar({ userName }: NavbarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/motorista' ? pathname === '/motorista' : pathname.startsWith(href)

  return (
    <>
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-700 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h3a1 1 0 00.8-.4l3-4A1 1 0 0018 9h-5V5a1 1 0 00-1-1H3z"/>
                </svg>
              </div>
              <span className="font-extrabold text-blue-900 text-sm">
                Roda<span className="text-blue-600">Fácil</span><span className="text-blue-400 text-xs font-bold ml-0.5">SC</span>
              </span>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    isActive(href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              ))}
            </nav>

            {/* User + logout */}
            <div className="hidden md:flex items-center gap-3">
              <span className="text-xs text-gray-500 font-medium">{userName}</span>
              <form action={signOut}>
                <button type="submit" className="btn-secondary py-1.5 text-xs gap-1.5">
                  <LogOut className="w-3.5 h-3.5" />
                  Sair
                </button>
              </form>
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3">
            <div className="grid grid-cols-3 gap-2 mb-3">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-medium transition-colors',
                    isActive(href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-500 hover:bg-gray-50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">{userName}</span>
              <form action={signOut}>
                <button type="submit" className="text-xs text-red-500 font-medium flex items-center gap-1">
                  <LogOut className="w-3 h-3" /> Sair
                </button>
              </form>
            </div>
          </div>
        )}
      </header>
    </>
  )
}
