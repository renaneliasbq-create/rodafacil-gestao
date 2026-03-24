import { Fuel, Wrench, Sparkles, Shield, FileText, Coffee, Smartphone, AlertTriangle, HelpCircle } from 'lucide-react'

export const CATEGORIAS = [
  { valor: 'combustivel',  nome: 'Combustível',  icon: Fuel,           bg: 'bg-orange-100', text: 'text-orange-600',  badge: 'bg-orange-100 text-orange-700',  bar: '#f97316' },
  { valor: 'manutencao',   nome: 'Manutenção',   icon: Wrench,         bg: 'bg-blue-100',   text: 'text-blue-600',    badge: 'bg-blue-100 text-blue-700',      bar: '#3b82f6' },
  { valor: 'lavagem',      nome: 'Lavagem',      icon: Sparkles,       bg: 'bg-cyan-100',   text: 'text-cyan-600',    badge: 'bg-cyan-100 text-cyan-700',      bar: '#06b6d4' },
  { valor: 'seguro',       nome: 'Seguro',       icon: Shield,         bg: 'bg-purple-100', text: 'text-purple-600',  badge: 'bg-purple-100 text-purple-700',  bar: '#a855f7' },
  { valor: 'ipva',         nome: 'IPVA / Docs',  icon: FileText,       bg: 'bg-yellow-100', text: 'text-yellow-600',  badge: 'bg-yellow-100 text-yellow-700',  bar: '#eab308' },
  { valor: 'alimentacao',  nome: 'Alimentação',  icon: Coffee,         bg: 'bg-amber-100',  text: 'text-amber-600',   badge: 'bg-amber-100 text-amber-700',    bar: '#f59e0b' },
  { valor: 'aplicativo',   nome: 'Aplicativo',   icon: Smartphone,     bg: 'bg-indigo-100', text: 'text-indigo-600',  badge: 'bg-indigo-100 text-indigo-700',  bar: '#6366f1' },
  { valor: 'multa',        nome: 'Multa',        icon: AlertTriangle,  bg: 'bg-red-100',    text: 'text-red-600',     badge: 'bg-red-100 text-red-700',        bar: '#ef4444' },
  { valor: 'outros',       nome: 'Outros',       icon: HelpCircle,     bg: 'bg-gray-100',   text: 'text-gray-500',    badge: 'bg-gray-100 text-gray-600',      bar: '#6b7280' },
]

export function getCat(valor: string) {
  return CATEGORIAS.find(c => c.valor === valor) ?? CATEGORIAS[CATEGORIAS.length - 1]
}

export function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
