import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatar valor em BRL
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Formatar data no padrão brasileiro
export function formatDate(date: string | Date): string {
  if (typeof date === 'string') {
    // Se já tem horário (contém T ou espaço), usa diretamente; se não, adiciona T00:00:00 para evitar fuso incorreto
    const d = date.includes('T') || date.includes(' ') ? new Date(date) : new Date(date + 'T00:00:00')
    return new Intl.DateTimeFormat('pt-BR').format(d)
  }
  return new Intl.DateTimeFormat('pt-BR').format(date)
}

// Nome abreviado do mês
export const MESES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

// Badge de status
export const STATUS_COLORS = {
  // Contrato
  ativo:      'bg-emerald-100 text-emerald-700',
  suspenso:   'bg-yellow-100 text-yellow-700',
  encerrado:  'bg-gray-100 text-gray-500',
  // Pagamento
  pago:       'bg-emerald-100 text-emerald-700',
  pendente:   'bg-yellow-100 text-yellow-700',
  atrasado:   'bg-red-100 text-red-700',
  // Veículo
  alugado:    'bg-blue-100 text-blue-700',
  disponivel: 'bg-emerald-100 text-emerald-700',
  manutencao: 'bg-orange-100 text-orange-700',
  // Multa
  paga:       'bg-emerald-100 text-emerald-700',
} as const

export type StatusKey = keyof typeof STATUS_COLORS

export const STATUS_LABELS: Record<string, string> = {
  ativo: 'Ativo', suspenso: 'Suspenso', encerrado: 'Encerrado',
  pago: 'Pago', pendente: 'Pendente', atrasado: 'Atrasado',
  alugado: 'Alugado', disponivel: 'Disponível', manutencao: 'Manutenção',
  paga: 'Paga',
  semanal: 'Semanal', quinzenal: 'Quinzenal', mensal: 'Mensal',
}
