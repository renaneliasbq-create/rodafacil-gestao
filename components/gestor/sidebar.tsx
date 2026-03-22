'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, Car, ArrowDownCircle, ArrowUpCircle,
  FileBarChart, Settings, LogOut, ChevronLeft, Menu, Building2,
} from 'lucide-react'
import { useState } from 'react'
import { signOut } from '@/app/(auth)/login/actions'

const NAV_ITEMS = [
  { href: '/gestor',             label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/gestor/motoristas',  label: 'Motoristas',      icon: Users },
  { href: '/gestor/veiculos',    label: 'Veículos',        icon: Car },
  { href: '/gestor/receitas',    label: 'Receitas',        icon: ArrowDownCircle },
  { href: '/gestor/despesas',    label: 'Despesas',        icon: ArrowUpCircle },
  { href: '/gestor/empresa',     label: 'Gastos CNPJ',     icon: Building2 },
  { href: '/gestor/relatorios',  label: 'Relatórios',      icon: FileBarChart },
  { href: '/gestor/configuracoes', label: 'Configurações', icon: Settings },
]

interface SidebarProps {
  userName: string
}

export function GestorSidebar({ userName }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/gestor' ? pathname === '/gestor' : pathname.startsWith(href)

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-sidebar-border',
        collapsed && 'justify-center'
      )}>
        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h3a1 1 0 00.8-.4l3-4A1 1 0 0018 9h-5V5a1 1 0 00-1-1H3z"/>
          </svg>
        </div>
        {!collapsed && (
          <span className="font-extrabold text-white text-base tracking-tight">
            Roda<span className="text-blue-400">Fácil</span>
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'sidebar-item',
              isActive(href) && 'active',
              collapsed && 'justify-center px-0'
            )}
            title={collapsed ? label : undefined}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        {!collapsed && (
          <div className="px-3 mb-3">
            <p className="text-xs text-sidebar-text truncate">Gestor</p>
            <p className="text-sm font-medium text-white truncate">{userName}</p>
          </div>
        )}
        <form action={signOut}>
          <button
            type="submit"
            className={cn(
              'sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-900/20',
              collapsed && 'justify-center px-0'
            )}
            title={collapsed ? 'Sair' : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </form>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col h-screen bg-sidebar-bg sticky top-0 transition-all duration-200 flex-shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}>
        <NavContent />

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-sidebar-hover border border-sidebar-border rounded-full flex items-center justify-center text-sidebar-text hover:text-white transition-colors"
        >
          <ChevronLeft className={cn('w-3 h-3 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </aside>

      {/* Mobile: hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-9 h-9 bg-sidebar-bg rounded-lg flex items-center justify-center text-white shadow-lg"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Mobile: overlay + drawer */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 h-full w-60 z-50 bg-sidebar-bg flex flex-col">
            <NavContent />
          </aside>
        </>
      )}
    </>
  )
}
